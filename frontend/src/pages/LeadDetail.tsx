import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Edit,
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    MessageSquare
} from 'lucide-react';

const LeadDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const response = await api.get(`/leads/${id}`);
                setLead(response.data);
            } catch (error) {
                console.error('Failed to fetch lead', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchLead();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-slate-700">Lead not found</h2>
                <button
                    onClick={() => navigate('/leads')}
                    className="mt-4 btn btn-primary"
                >
                    Back to Leads
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/leads')}
                    className="flex items-center text-slate-500 hover:text-slate-700 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to list
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center mb-4 md:mb-0">
                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500 border border-slate-200 mr-4">
                            {lead.firstName?.[0]}{lead.lastName?.[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{lead.firstName} {lead.lastName}</h1>
                            <div className="flex items-center mt-1 text-slate-500 text-sm">
                                <span className="flex items-center mr-4">
                                    <Mail size={14} className="mr-1" /> {lead.email}
                                </span>
                                <span className="flex items-center">
                                    <Phone size={14} className="mr-1" /> {lead.phone}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-slate-100 rounded-full text-slate-700 font-medium text-sm capitalize">
                            {lead.status}
                        </div>
                        <button className="btn btn-outline" title="Send Email">
                            <Mail size={18} />
                        </button>
                        <button className="btn btn-outline" title="Call">
                            <Phone size={18} />
                        </button>
                        <button className="btn btn-primary">
                            Edit Lead
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="bg-white border-b border-slate-200 rounded-t-xl overflow-hidden flex">
                        {['overview', 'activity', 'quotes'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab
                                        ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 shadow-sm min-h-[400px]">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Move Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Moving From</label>
                                            <div className="mt-1 flex items-start">
                                                <MapPin size={16} className="text-slate-400 mr-2 mt-1" />
                                                <p className="text-slate-900 font-medium">{lead.fromAddress || 'N/A'}</p>
                                            </div>
                                            <p className="ml-6 text-sm text-slate-500">{lead.fromPostcode}</p>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Moving To</label>
                                            <div className="mt-1 flex items-start">
                                                <MapPin size={16} className="text-slate-400 mr-2 mt-1" />
                                                <p className="text-slate-900 font-medium">{lead.toAddress || 'N/A'}</p>
                                            </div>
                                            <p className="ml-6 text-sm text-slate-500">{lead.toPostcode}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border border-slate-100 rounded-lg">
                                        <label className="text-xs text-slate-500">Proposed Move Date</label>
                                        <div className="flex items-center mt-1">
                                            <Calendar size={16} className="text-slate-400 mr-2" />
                                            <span className="font-medium text-slate-900">
                                                {lead.moveDate ? new Date(lead.moveDate).toLocaleDateString() : 'Not set'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 border border-slate-100 rounded-lg">
                                        <label className="text-xs text-slate-500">Source</label>
                                        <div className="flex items-center mt-1">
                                            <span className="font-medium text-slate-900 capitalize">{lead.source}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Notes</h3>
                                    <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[100px]">
                                        {lead.submitterComments || 'No notes available.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="text-center py-10 text-slate-500">
                                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Activity timeline implementation pending.</p>
                            </div>
                        )}

                        {activeTab === 'quotes' && (
                            <div className="text-center py-10 text-slate-500">
                                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No quotes generated yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Quick Actions Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Lead Status</h3>
                        <div className="space-y-3">
                            {['New', 'Contacted', 'Survey Booked', 'Quote Sent'].map((step, idx) => (
                                <div key={step} className="flex items-center">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs ${idx === 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {idx === 0 ? <CheckCircle size={14} /> : idx + 1}
                                    </div>
                                    <span className={`text-sm ${idx === 0 ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                                        {step}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDetail;
