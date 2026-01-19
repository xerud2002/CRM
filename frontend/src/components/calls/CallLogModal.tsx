import { useState, useEffect } from 'react';
import { X, Phone, PhoneIncoming, PhoneOutgoing, Clock, Calendar, MessageSquare, Search, User } from 'lucide-react';
import api from '../../services/api';

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}

interface CallLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId?: string;
    leadName?: string;
    onCallLogged?: () => void;
}

type CallDirection = 'inbound' | 'outbound';
type CallStatus = 'answered' | 'missed' | 'voicemail' | 'no_answer';

export const CallLogModal = ({ isOpen, onClose, leadId: initialLeadId, leadName, onCallLogged }: CallLogModalProps) => {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [leadSearch, setLeadSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Lead[]>([]);
    const [searching, setSearching] = useState(false);
    const [showLeadPicker, setShowLeadPicker] = useState(!initialLeadId);
    
    const [direction, setDirection] = useState<CallDirection>('outbound');
    const [status, setStatus] = useState<CallStatus>('answered');
    const [durationMinutes, setDurationMinutes] = useState('');
    const [durationSeconds, setDurationSeconds] = useState('');
    const [notes, setNotes] = useState('');
    const [followUpRequired, setFollowUpRequired] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Search leads when typing
    useEffect(() => {
        const searchLeads = async () => {
            if (!leadSearch.trim() || leadSearch.length < 2) {
                setSearchResults([]);
                return;
            }
            
            setSearching(true);
            try {
                const response = await api.get('/leads', { 
                    params: { search: leadSearch, limit: 10 } 
                });
                setSearchResults(response.data.data || []);
            } catch (err) {
                console.error('Failed to search leads', err);
            } finally {
                setSearching(false);
            }
        };

        const debounce = setTimeout(searchLeads, 300);
        return () => clearTimeout(debounce);
    }, [leadSearch]);

    // Set lead if provided
    useEffect(() => {
        if (initialLeadId && leadName) {
            setSelectedLead({ id: initialLeadId, firstName: leadName.split(' ')[0], lastName: leadName.split(' ').slice(1).join(' '), phone: '', email: '' });
            setShowLeadPicker(false);
        }
    }, [initialLeadId, leadName]);

    const handleSelectLead = (lead: Lead) => {
        setSelectedLead(lead);
        setShowLeadPicker(false);
        setLeadSearch('');
        setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const targetLeadId = initialLeadId || selectedLead?.id;
        if (!targetLeadId) {
            setError('Please select a lead');
            return;
        }

        setSubmitting(true);

        try {
            const mins = parseInt(durationMinutes) || 0;
            const secs = parseInt(durationSeconds) || 0;
            const totalSeconds = mins * 60 + secs;

            await api.post('/calls', {
                leadId: targetLeadId,
                direction,
                status,
                durationSeconds: totalSeconds > 0 ? totalSeconds : null,
                notes: notes.trim() || null,
                followUpRequired,
                followUpDate: followUpRequired && followUpDate ? followUpDate : null,
                startedAt: new Date().toISOString(),
            });

            // Reset form
            setDirection('outbound');
            setStatus('answered');
            setDurationMinutes('');
            setDurationSeconds('');
            setNotes('');
            setFollowUpRequired(false);
            setFollowUpDate('');
            if (!initialLeadId) {
                setSelectedLead(null);
                setShowLeadPicker(true);
            }

            onCallLogged?.();
            onClose();
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || 'Failed to log call');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Phone size={20} className="text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Log Call</h2>
                            {(leadName || selectedLead) && (
                                <p className="text-sm text-slate-500">
                                    {leadName || `${selectedLead?.firstName} ${selectedLead?.lastName}`}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Lead Picker (when no leadId provided) */}
                    {showLeadPicker && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <User size={14} className="inline mr-1" />
                                Select Lead
                            </label>
                            {selectedLead ? (
                                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {selectedLead.firstName} {selectedLead.lastName}
                                        </p>
                                        <p className="text-sm text-slate-500">{selectedLead.phone || selectedLead.email}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedLead(null);
                                            setShowLeadPicker(true);
                                        }}
                                        className="text-sm text-primary-600 hover:text-primary-700"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="relative">
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={leadSearch}
                                            onChange={(e) => setLeadSearch(e.target.value)}
                                            placeholder="Search by name, phone, or email..."
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    {/* Search Results */}
                                    {(searchResults.length > 0 || searching) && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                            {searching ? (
                                                <div className="p-3 text-center text-slate-500 text-sm">
                                                    Searching...
                                                </div>
                                            ) : (
                                                searchResults.map((lead) => (
                                                    <button
                                                        key={lead.id}
                                                        type="button"
                                                        onClick={() => handleSelectLead(lead)}
                                                        className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                                    >
                                                        <p className="font-medium text-slate-900">
                                                            {lead.firstName} {lead.lastName}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {lead.phone} • {lead.email}
                                                        </p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Direction Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Call Direction
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDirection('outbound')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                                    direction === 'outbound'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                }`}
                            >
                                <PhoneOutgoing size={18} />
                                <span className="font-medium">Outbound</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDirection('inbound')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                                    direction === 'inbound'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                }`}
                            >
                                <PhoneIncoming size={18} />
                                <span className="font-medium">Inbound</span>
                            </button>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Call Outcome
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'answered', label: 'Answered', color: 'green' },
                                { value: 'missed', label: 'Missed', color: 'red' },
                                { value: 'voicemail', label: 'Voicemail', color: 'orange' },
                                { value: 'no_answer', label: 'No Answer', color: 'slate' },
                            ].map(({ value, label, color }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setStatus(value as CallStatus)}
                                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                        status === value
                                            ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                                    style={status === value ? {
                                        borderColor: color === 'green' ? '#22c55e' : color === 'red' ? '#ef4444' : color === 'orange' ? '#f97316' : '#64748b',
                                        backgroundColor: color === 'green' ? '#f0fdf4' : color === 'red' ? '#fef2f2' : color === 'orange' ? '#fff7ed' : '#f8fafc',
                                        color: color === 'green' ? '#15803d' : color === 'red' ? '#dc2626' : color === 'orange' ? '#ea580c' : '#475569'
                                    } : {}}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration (only show if answered) */}
                    {status === 'answered' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Clock size={14} className="inline mr-1" />
                                Duration
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="999"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                    placeholder="0"
                                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <span className="text-slate-500">min</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={durationSeconds}
                                    onChange={(e) => setDurationSeconds(e.target.value)}
                                    placeholder="0"
                                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <span className="text-slate-500">sec</span>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <MessageSquare size={14} className="inline mr-1" />
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="What was discussed?"
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        />
                    </div>

                    {/* Follow-up */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={followUpRequired}
                                onChange={(e) => setFollowUpRequired(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Schedule follow-up call
                            </span>
                        </label>

                        {followUpRequired && (
                            <div className="ml-6">
                                <label className="block text-sm text-slate-500 mb-1">
                                    <Calendar size={14} className="inline mr-1" />
                                    Follow-up date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={followUpDate}
                                    onChange={(e) => setFollowUpDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Log Call'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CallLogModal;
