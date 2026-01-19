import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CallLogModal from '../components/calls/CallLogModal';
import {
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    Clock,
    Calendar,
    Search,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    User,
    ExternalLink
} from 'lucide-react';

interface Call {
    id: string;
    direction: 'inbound' | 'outbound';
    status: 'answered' | 'missed' | 'voicemail' | 'no_answer';
    durationSeconds: number | null;
    notes: string | null;
    followUpRequired: boolean;
    followUpDate: string | null;
    startedAt: string;
    createdAt: string;
    lead: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
    };
    user: {
        id: string;
        name: string;
    };
}

interface CallStats {
    today: { total: number; answered: number; missed: number };
    week: { total: number; answered: number; missed: number };
    byDirection: { inbound: number; outbound: number };
}

const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        answered: 'bg-green-100 text-green-700',
        missed: 'bg-red-100 text-red-700',
        voicemail: 'bg-orange-100 text-orange-700',
        no_answer: 'bg-slate-100 text-slate-700',
    };
    return styles[status] || styles.no_answer;
};

const Calls = () => {
    const navigate = useNavigate();
    const [calls, setCalls] = useState<Call[]>([]);
    const [stats, setStats] = useState<CallStats | null>(null);
    const [followUps, setFollowUps] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'follow-ups'>('all');
    
    // Filters
    const [directionFilter, setDirectionFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    // Modal
    const [logModalOpen, setLogModalOpen] = useState(false);

    const fetchCalls = useCallback(async () => {
        try {
            const params: Record<string, string | number> = { page, limit };
            if (directionFilter) params.direction = directionFilter;
            if (statusFilter) params.status = statusFilter;
            
            const response = await api.get('/calls', { params });
            setCalls(response.data.data);
            setTotalPages(response.data.meta.totalPages);
            setTotal(response.data.meta.total);
        } catch (error) {
            console.error('Failed to fetch calls', error);
        }
    }, [page, limit, directionFilter, statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get('/calls/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch call stats', error);
        }
    }, []);

    const fetchFollowUps = useCallback(async () => {
        try {
            const response = await api.get('/calls/follow-ups');
            setFollowUps(response.data);
        } catch (error) {
            console.error('Failed to fetch follow-ups', error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchCalls(), fetchStats(), fetchFollowUps()]);
            setLoading(false);
        };
        loadData();
    }, [fetchCalls, fetchStats, fetchFollowUps]);

    const handleCallLogged = () => {
        fetchCalls();
        fetchStats();
        fetchFollowUps();
    };

    const filteredCalls = calls.filter(call => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            call.lead.firstName.toLowerCase().includes(search) ||
            call.lead.lastName.toLowerCase().includes(search) ||
            call.lead.phone.includes(search)
        );
    });

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Call Log</h1>
                    <p className="text-slate-500">Track and manage all customer calls</p>
                </div>
                <button
                    onClick={() => setLogModalOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Phone size={18} />
                    Log Call
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Phone size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats?.today.total || 0}</p>
                            <p className="text-sm text-slate-500">Calls Today</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats?.today.answered || 0}</p>
                            <p className="text-sm text-slate-500">Answered Today</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <AlertCircle size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{followUps.length}</p>
                            <p className="text-sm text-slate-500">Follow-ups Due</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Calendar size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats?.week.total || 0}</p>
                            <p className="text-sm text-slate-500">This Week</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 flex">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'all'
                                ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        All Calls ({total})
                    </button>
                    <button
                        onClick={() => setActiveTab('follow-ups')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'follow-ups'
                                ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Follow-ups
                        {followUps.length > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                                {followUps.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filters (only for All Calls tab) */}
                {activeTab === 'all' && (
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex flex-wrap gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name or phone..."
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                            
                            <select
                                value={directionFilter}
                                onChange={(e) => {
                                    setDirectionFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">All Directions</option>
                                <option value="inbound">Inbound</option>
                                <option value="outbound">Outbound</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">All Outcomes</option>
                                <option value="answered">Answered</option>
                                <option value="missed">Missed</option>
                                <option value="voicemail">Voicemail</option>
                                <option value="no_answer">No Answer</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Call List */}
                <div className="divide-y divide-slate-100">
                    {activeTab === 'all' ? (
                        filteredCalls.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Phone size={40} className="mx-auto mb-2 opacity-30" />
                                <p>No calls found</p>
                            </div>
                        ) : (
                            filteredCalls.map((call) => (
                                <div
                                    key={call.id}
                                    className="p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Direction Icon */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            call.direction === 'inbound' 
                                                ? 'bg-blue-100' 
                                                : 'bg-green-100'
                                        }`}>
                                            {call.direction === 'inbound' ? (
                                                <PhoneIncoming size={18} className="text-blue-600" />
                                            ) : (
                                                <PhoneOutgoing size={18} className="text-green-600" />
                                            )}
                                        </div>

                                        {/* Call Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button
                                                    onClick={() => navigate(`/leads/${call.lead.id}`)}
                                                    className="font-medium text-slate-900 hover:text-primary-600 flex items-center gap-1"
                                                >
                                                    {call.lead.firstName} {call.lead.lastName}
                                                    <ExternalLink size={14} />
                                                </button>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(call.status)}`}>
                                                    {call.status.replace('_', ' ')}
                                                </span>
                                                {call.followUpRequired && (
                                                    <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                                                        <AlertCircle size={12} />
                                                        Follow-up
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Phone size={14} />
                                                    {call.lead.phone}
                                                </span>
                                                {call.durationSeconds && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {formatDuration(call.durationSeconds)}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <User size={14} />
                                                    {call.user?.name || 'Unknown'}
                                                </span>
                                            </div>

                                            {call.notes && (
                                                <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded p-2 line-clamp-2">
                                                    {call.notes}
                                                </p>
                                            )}
                                        </div>

                                        {/* Time */}
                                        <div className="text-right text-sm">
                                            <p className="text-slate-500">{formatDate(call.startedAt || call.createdAt)}</p>
                                            {call.followUpDate && (
                                                <p className="text-orange-600 text-xs mt-1">
                                                    Follow-up: {new Date(call.followUpDate).toLocaleDateString('en-GB')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        // Follow-ups Tab
                        followUps.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <CheckCircle size={40} className="mx-auto mb-2 opacity-30" />
                                <p>No follow-ups pending</p>
                            </div>
                        ) : (
                            followUps.map((call) => (
                                <div
                                    key={call.id}
                                    className="p-4 hover:bg-orange-50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                            <AlertCircle size={18} className="text-orange-600" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/leads/${call.lead.id}`)}
                                                    className="font-medium text-slate-900 hover:text-primary-600 flex items-center gap-1"
                                                >
                                                    {call.lead.firstName} {call.lead.lastName}
                                                    <ExternalLink size={14} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Phone size={14} />
                                                    {call.lead.phone}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    Due: {call.followUpDate 
                                                        ? new Date(call.followUpDate).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })
                                                        : 'No date set'}
                                                </span>
                                            </div>

                                            {call.notes && (
                                                <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded p-2 line-clamp-2">
                                                    {call.notes}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => navigate(`/leads/${call.lead.id}`)}
                                            className="btn btn-outline btn-sm"
                                        >
                                            View Lead
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>

                {/* Pagination (only for All Calls tab) */}
                {activeTab === 'all' && totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm text-slate-600">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Log Call Modal - TODO: Add lead picker */}
            {logModalOpen && (
                <CallLogModal
                    isOpen={logModalOpen}
                    onClose={() => setLogModalOpen(false)}
                    leadId=""
                    onCallLogged={handleCallLogged}
                />
            )}
        </div>
    );
};

export default Calls;
