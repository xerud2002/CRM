import { useState, useEffect } from 'react';
import { X, MessageSquare, Send, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface SmsTemplate {
    id: string;
    name: string;
    content: string;
    variables: string[];
}

interface SmsModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string;
    leadName?: string;
    leadPhone?: string;
    onSmsSent?: () => void;
}

export const SmsModal = ({ isOpen, onClose, leadId, leadName, leadPhone, onSmsSent }: SmsModalProps) => {
    const [templates, setTemplates] = useState<SmsTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [smsStatus, setSmsStatus] = useState<{ configured: boolean; provider: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
            fetchStatus();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/sms/templates');
            setTemplates(response.data);
        } catch (err) {
            console.error('Failed to fetch SMS templates', err);
        }
    };

    const fetchStatus = async () => {
        try {
            const response = await api.get('/sms/status');
            setSmsStatus(response.data);
        } catch (err) {
            console.error('Failed to fetch SMS status', err);
        }
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        if (templateId) {
            const template = templates.find(t => t.id === templateId);
            if (template) {
                setMessage(template.content);
            }
        } else {
            setMessage('');
        }
    };

    const handleSend = async () => {
        if (!message.trim()) {
            setError('Please enter a message');
            return;
        }

        setSending(true);
        setError('');
        setSuccess(false);

        try {
            await api.post('/sms/send', {
                leadId,
                message: message.trim(),
                template: selectedTemplate || 'custom',
            });
            setSuccess(true);
            setMessage('');
            setSelectedTemplate('');
            onSmsSent?.();
            
            // Auto-close after success
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 2000);
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || 'Failed to send SMS');
        } finally {
            setSending(false);
        }
    };

    const charCount = message.length;
    const smsCount = Math.ceil(charCount / 160) || 1;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <MessageSquare size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Send SMS</h2>
                            {leadName && (
                                <p className="text-sm text-slate-500">{leadName} • {leadPhone}</p>
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

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Status Warning */}
                    {smsStatus && !smsStatus.configured && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                            <AlertCircle size={18} className="text-yellow-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-yellow-800">SMS not configured</p>
                                <p className="text-yellow-600">Messages will be simulated. Configure Twilio credentials in .env to enable real SMS.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                            SMS sent successfully!
                        </div>
                    )}

                    {/* Template Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Use Template (optional)
                        </label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">Write custom message</option>
                            {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                    {template.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Message Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        />
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                            <span>{charCount} characters</span>
                            <span>{smsCount} SMS{smsCount > 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Variable Help */}
                    <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                        <p className="font-medium mb-1">Available variables:</p>
                        <code className="text-primary-600">
                            {'{{firstName}}'} {'{{lastName}}'} {'{{fromPostcode}}'} {'{{toPostcode}}'} {'{{moveDate}}'}
                        </code>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !message.trim()}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Send size={18} />
                        {sending ? 'Sending...' : 'Send SMS'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmsModal;
