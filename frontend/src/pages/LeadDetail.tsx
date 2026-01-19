import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ActivityTimeline from '../components/timeline/ActivityTimeline';
import { ComposeModal } from '../components/email/ComposeModal';
import { QuotesList, CreateQuoteModal } from '../components/quotes';
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
    MessageSquare,
    FileText,
    ExternalLink,
    Save,
    X,
    Plus,
    Receipt
} from 'lucide-react';

type JobDay = {
    day: number;
    date: string;
    type: 'packing' | 'loading' | 'moving' | 'unloading';
    startTime?: string;
};

const LeadDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [composeOpen, setComposeOpen] = useState(false);
    const [createQuoteOpen, setCreateQuoteOpen] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [editingXeroLink, setEditingXeroLink] = useState(false);
    const [xeroLinkValue, setXeroLinkValue] = useState('');
    const [savingXeroLink, setSavingXeroLink] = useState(false);
    
    // Invoice link state
    const [editingInvoiceLink, setEditingInvoiceLink] = useState(false);
    const [invoiceLinkValue, setInvoiceLinkValue] = useState('');
    const [savingInvoiceLink, setSavingInvoiceLink] = useState(false);
    
    // Booking details state
    const [editingBooking, setEditingBooking] = useState(false);
    const [bookingData, setBookingData] = useState({
        serviceType: '',
        startTime: '',
        jobDays: [] as JobDay[]
    });
    const [savingBooking, setSavingBooking] = useState(false);

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

        const fetchAccounts = async () => {
            try {
                const response = await api.get('/mail/accounts');
                setAccounts(response.data);
            } catch (error) {
                console.error('Failed to fetch email accounts', error);
            }
        };

        if (id) {
            fetchLead();
            fetchAccounts();
        }
    }, [id]);

    const handleSaveXeroLink = async () => {
        if (!id) return;
        setSavingXeroLink(true);
        try {
            await api.patch(`/leads/${id}`, { xeroQuoteLink: xeroLinkValue || null });
            setLead({ ...lead, xeroQuoteLink: xeroLinkValue || null });
            setEditingXeroLink(false);
        } catch (error) {
            console.error('Failed to save Xero link', error);
        } finally {
            setSavingXeroLink(false);
        }
    };

    const startEditingXeroLink = () => {
        setXeroLinkValue(lead?.xeroQuoteLink || '');
        setEditingXeroLink(true);
    };

    const handleSaveInvoiceLink = async () => {
        if (!id) return;
        setSavingInvoiceLink(true);
        try {
            await api.patch(`/leads/${id}`, { xeroInvoiceLink: invoiceLinkValue || null });
            setLead({ ...lead, xeroInvoiceLink: invoiceLinkValue || null });
            setEditingInvoiceLink(false);
        } catch (error) {
            console.error('Failed to save invoice link', error);
        } finally {
            setSavingInvoiceLink(false);
        }
    };

    const startEditingInvoiceLink = () => {
        setInvoiceLinkValue(lead?.xeroInvoiceLink || '');
        setEditingInvoiceLink(true);
    };

    const startEditingBooking = () => {
        setBookingData({
            serviceType: lead?.serviceType || '',
            startTime: lead?.startTime || '8:00 AM',
            jobDays: lead?.jobDays || []
        });
        setEditingBooking(true);
    };

    const handleSaveBooking = async () => {
        if (!id) return;
        setSavingBooking(true);
        try {
            await api.patch(`/leads/${id}`, {
                serviceType: bookingData.serviceType || null,
                startTime: bookingData.startTime || null,
                jobDays: bookingData.jobDays.length > 0 ? bookingData.jobDays : null
            });
            setLead({ 
                ...lead, 
                serviceType: bookingData.serviceType || null,
                startTime: bookingData.startTime || null,
                jobDays: bookingData.jobDays.length > 0 ? bookingData.jobDays : null
            });
            setEditingBooking(false);
        } catch (error) {
            console.error('Failed to save booking details', error);
        } finally {
            setSavingBooking(false);
        }
    };

    const addJobDay = () => {
        const nextDay = bookingData.jobDays.length + 1;
        setBookingData({
            ...bookingData,
            jobDays: [...bookingData.jobDays, { 
                day: nextDay, 
                date: '', 
                type: 'moving' as const,
                startTime: '8:00 AM'
            }]
        });
    };

    const removeJobDay = (index: number) => {
        const newJobDays = bookingData.jobDays
            .filter((_, i) => i !== index)
            .map((jd, i) => ({ ...jd, day: i + 1 }));
        setBookingData({ ...bookingData, jobDays: newJobDays });
    };

    const updateJobDay = (index: number, field: keyof JobDay, value: string) => {
        const newJobDays = [...bookingData.jobDays];
        newJobDays[index] = { ...newJobDays[index], [field]: value };
        setBookingData({ ...bookingData, jobDays: newJobDays });
    };

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
                        <button 
                            onClick={() => setComposeOpen(true)}
                            className="btn btn-outline flex items-center gap-2" 
                            title="Send Email"
                        >
                            <Mail size={18} />
                            <span className="hidden sm:inline">Email</span>
                        </button>
                        <button 
                            onClick={() => setCreateQuoteOpen(true)}
                            className="btn btn-outline flex items-center gap-2" 
                            title="Create Quote"
                        >
                            <FileText size={18} />
                            <span className="hidden sm:inline">Quote</span>
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
                            <ActivityTimeline leadId={id!} />
                        )}

                        {activeTab === 'quotes' && (
                            <QuotesList 
                                leadId={id!} 
                                onCreateQuote={() => setCreateQuoteOpen(true)} 
                            />
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

                    {/* Xero Quote Link Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Xero Quote</h3>
                            {!editingXeroLink && (
                                <button
                                    onClick={startEditingXeroLink}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Edit Xero link"
                                >
                                    <Edit size={14} />
                                </button>
                            )}
                        </div>
                        
                        {editingXeroLink ? (
                            <div className="space-y-3">
                                <input
                                    type="url"
                                    value={xeroLinkValue}
                                    onChange={(e) => setXeroLinkValue(e.target.value)}
                                    placeholder="Paste Xero quote link here..."
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveXeroLink}
                                        disabled={savingXeroLink}
                                        className="flex-1 btn btn-primary text-sm py-2 flex items-center justify-center gap-1"
                                    >
                                        <Save size={14} />
                                        {savingXeroLink ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditingXeroLink(false)}
                                        className="btn btn-outline text-sm py-2"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : lead?.xeroQuoteLink ? (
                            <a
                                href={lead.xeroQuoteLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                                <ExternalLink size={14} />
                                View Quote in Xero
                            </a>
                        ) : (
                            <p className="text-sm text-slate-400">No Xero quote link added yet</p>
                        )}
                    </div>

                    {/* Xero Invoice Link Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Receipt size={14} />
                                Xero Invoice
                            </h3>
                            {!editingInvoiceLink && (
                                <button
                                    onClick={startEditingInvoiceLink}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Edit invoice link"
                                >
                                    <Edit size={14} />
                                </button>
                            )}
                        </div>
                        
                        {editingInvoiceLink ? (
                            <div className="space-y-3">
                                <input
                                    type="url"
                                    value={invoiceLinkValue}
                                    onChange={(e) => setInvoiceLinkValue(e.target.value)}
                                    placeholder="Paste Xero invoice link here..."
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveInvoiceLink}
                                        disabled={savingInvoiceLink}
                                        className="flex-1 btn btn-primary text-sm py-2 flex items-center justify-center gap-1"
                                    >
                                        <Save size={14} />
                                        {savingInvoiceLink ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditingInvoiceLink(false)}
                                        className="btn btn-outline text-sm py-2"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : lead?.xeroInvoiceLink ? (
                            <a
                                href={lead.xeroInvoiceLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                                <ExternalLink size={14} />
                                View Invoice in Xero
                            </a>
                        ) : (
                            <p className="text-sm text-slate-400">No Xero invoice link added yet</p>
                        )}
                    </div>

                    {/* Booking Details Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Calendar size={14} />
                                Job Schedule
                            </h3>
                            {!editingBooking && (
                                <button
                                    onClick={startEditingBooking}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Edit booking details"
                                >
                                    <Edit size={14} />
                                </button>
                            )}
                        </div>
                        
                        {editingBooking ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Service Type</label>
                                    <select
                                        value={bookingData.serviceType}
                                        onChange={(e) => setBookingData({ ...bookingData, serviceType: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select service...</option>
                                        <option value="Moving Only">Moving Only</option>
                                        <option value="Packing & Moving">Packing & Moving</option>
                                        <option value="Packing, Loading & Unloading">Packing, Loading & Unloading</option>
                                        <option value="Full Service (Multi-Day)">Full Service (Multi-Day)</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Default Start Time</label>
                                    <input
                                        type="text"
                                        value={bookingData.startTime}
                                        onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                                        placeholder="e.g., 8:00 AM"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-medium text-slate-600">Job Days</label>
                                        <button
                                            type="button"
                                            onClick={addJobDay}
                                            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Add Day
                                        </button>
                                    </div>
                                    
                                    {bookingData.jobDays.length === 0 ? (
                                        <p className="text-xs text-slate-400">No job days configured (single day job)</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {bookingData.jobDays.map((jd, idx) => (
                                                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-semibold text-slate-700">Day {jd.day}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeJobDay(idx)}
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <select
                                                            value={jd.type}
                                                            onChange={(e) => updateJobDay(idx, 'type', e.target.value)}
                                                            className="px-2 py-1 text-xs border border-slate-200 rounded"
                                                        >
                                                            <option value="packing">Packing</option>
                                                            <option value="loading">Loading</option>
                                                            <option value="moving">Moving</option>
                                                            <option value="unloading">Unloading</option>
                                                        </select>
                                                        <input
                                                            type="date"
                                                            value={jd.date}
                                                            onChange={(e) => updateJobDay(idx, 'date', e.target.value)}
                                                            className="px-2 py-1 text-xs border border-slate-200 rounded"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={jd.startTime || ''}
                                                            onChange={(e) => updateJobDay(idx, 'startTime', e.target.value)}
                                                            placeholder="Start time"
                                                            className="col-span-2 px-2 py-1 text-xs border border-slate-200 rounded"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleSaveBooking}
                                        disabled={savingBooking}
                                        className="flex-1 btn btn-primary text-sm py-2 flex items-center justify-center gap-1"
                                    >
                                        <Save size={14} />
                                        {savingBooking ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditingBooking(false)}
                                        className="btn btn-outline text-sm py-2"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {lead?.serviceType && (
                                    <div>
                                        <p className="text-xs text-slate-500">Service</p>
                                        <p className="text-sm font-medium text-slate-900">{lead.serviceType}</p>
                                    </div>
                                )}
                                {lead?.startTime && (
                                    <div>
                                        <p className="text-xs text-slate-500">Start Time</p>
                                        <p className="text-sm font-medium text-slate-900">{lead.startTime}</p>
                                    </div>
                                )}
                                {lead?.jobDays && lead.jobDays.length > 0 ? (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-2">Schedule</p>
                                        {lead.jobDays.map((jd: JobDay, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm py-1 border-b border-slate-100 last:border-0">
                                                <span className="text-xs font-semibold text-slate-500">Day {jd.day}</span>
                                                <span className="capitalize text-slate-700">{jd.type}</span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-slate-600">{new Date(jd.date).toLocaleDateString('en-GB')}</span>
                                                {jd.startTime && <span className="text-slate-500 text-xs">({jd.startTime})</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : !lead?.serviceType && !lead?.startTime ? (
                                    <p className="text-sm text-slate-400">No booking details configured yet</p>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Compose Email Modal */}
            <ComposeModal
                isOpen={composeOpen}
                onClose={() => setComposeOpen(false)}
                onSend={() => setComposeOpen(false)}
                accounts={accounts}
                lead={lead}
            />

            {/* Create Quote Modal */}
            <CreateQuoteModal
                isOpen={createQuoteOpen}
                onClose={() => setCreateQuoteOpen(false)}
                onCreated={() => setActiveTab('quotes')}
                lead={lead}
            />
        </div>
    );
};

export default LeadDetail;
