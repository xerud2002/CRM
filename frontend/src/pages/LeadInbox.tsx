import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Inbox,
    CheckCircle,
    XCircle,
    MapPin,
    Calendar,
    Home,
    RefreshCw,
    Clock,
    User,
    ChevronRight,
} from 'lucide-react';

interface PendingLead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source: string;
    moveDate: string;
    fromPostcode: string;
    toPostcode: string;
    bedrooms?: number;
    createdAt: string;
}

const sourceColors: Record<string, string> = {
    comparemymove: 'bg-blue-100 text-blue-700',
    reallymoving: 'bg-green-100 text-green-700',
    getamover: 'bg-purple-100 text-purple-700',
    website: 'bg-orange-100 text-orange-700',
    manual: 'bg-slate-100 text-slate-700',
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

const LeadInbox = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<PendingLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchPendingLeads = useCallback(async () => {
        try {
            const response = await api.get('/leads/inbox');
            setLeads(response.data);
        } catch (error) {
            console.error('Failed to fetch pending leads', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingLeads();
    }, [fetchPendingLeads]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchPendingLeads, 60000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchPendingLeads]);

    const handleAccept = async (leadId: string) => {
        setProcessing(leadId);
        try {
            await api.post(`/leads/${leadId}/accept`);
            setLeads(leads.filter((l) => l.id !== leadId));
        } catch (error) {
            console.error('Failed to accept lead', error);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (leadId: string) => {
        setProcessing(leadId);
        try {
            await api.post(`/leads/${leadId}/reject`);
            setLeads(leads.filter((l) => l.id !== leadId));
        } catch (error) {
            console.error('Failed to reject lead', error);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-100 rounded-xl">
                        <Inbox size={24} className="text-primary-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Lead Inbox</h1>
                        <p className="text-slate-500 mt-1">
                            {leads.length} pending {leads.length === 1 ? 'lead' : 'leads'} awaiting review
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-slate-300"
                        />
                        Auto-refresh
                    </label>
                    <button
                        onClick={fetchPendingLeads}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Lead Cards */}
            {leads.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
                    <p className="text-slate-500">No pending leads to review right now.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {leads.map((lead) => (
                        <div
                            key={lead.id}
                            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Lead Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                                            {lead.firstName?.[0]}{lead.lastName?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">
                                                {lead.firstName} {lead.lastName}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${sourceColors[lead.source] || sourceColors.manual}`}>
                                                    {lead.source}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatTimeAgo(lead.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Move Details */}
                                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={14} className="text-slate-400" />
                                            {lead.fromPostcode || '?'} → {lead.toPostcode || '?'}
                                        </span>
                                        {lead.moveDate && (
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} className="text-slate-400" />
                                                {new Date(lead.moveDate).toLocaleDateString('en-GB')}
                                            </span>
                                        )}
                                        {lead.bedrooms && (
                                            <span className="flex items-center gap-1">
                                                <Home size={14} className="text-slate-400" />
                                                {lead.bedrooms} bed
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate(`/leads/${lead.id}`)}
                                        className="btn btn-outline btn-sm flex items-center gap-1"
                                    >
                                        View
                                        <ChevronRight size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleReject(lead.id)}
                                        disabled={processing === lead.id}
                                        className="btn btn-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-1"
                                    >
                                        <XCircle size={16} />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleAccept(lead.id)}
                                        disabled={processing === lead.id}
                                        className="btn btn-primary btn-sm flex items-center gap-1"
                                    >
                                        <CheckCircle size={16} />
                                        Accept
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeadInbox;
