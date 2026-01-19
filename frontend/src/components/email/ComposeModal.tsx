import { useState, useEffect } from 'react';
import api from '../../services/api';
import { TemplateSelector } from './TemplateSelector';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  includesCalendarInvite: boolean;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  fromAddress?: string;
  fromPostcode?: string;
  toAddress?: string;
  toPostcode?: string;
  moveDate?: string;
  bedrooms?: number;
}

interface EmailAccount {
  id: string;
  email: string;
  displayName?: string;
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: () => void;
  accounts: EmailAccount[];
  lead?: Lead;
  replyTo?: {
    subject: string;
    from: string;
    body: string;
  };
}

export const ComposeModal = ({ isOpen, onClose, onSend, accounts, lead, replyTo }: ComposeModalProps) => {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [to, setTo] = useState(lead?.email || replyTo?.from || '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState(replyTo ? `\n\n---\nOn ${new Date().toLocaleDateString()}, ${replyTo.from} wrote:\n${replyTo.body}` : '');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Update recipient when lead changes
  useEffect(() => {
    if (lead?.email) {
      setTo(lead.email);
    }
  }, [lead]);

  // Update account selection when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleTemplateSelect = async (template: EmailTemplate) => {
    setSelectedTemplate(template);
    
    // If we have a lead, preview with variables substituted
    if (lead) {
      try {
        const variables = {
          first_name: lead.firstName || '',
          last_name: lead.lastName || '',
          email: lead.email || '',
          phone: lead.phone || '',
          from_address: lead.fromAddress || '',
          from_postcode: lead.fromPostcode || '',
          to_address: lead.toAddress || '',
          to_postcode: lead.toPostcode || '',
          move_date: lead.moveDate ? new Date(lead.moveDate).toLocaleDateString('en-GB', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }) : '',
          bedrooms: lead.bedrooms?.toString() || '',
          staff_name: 'Holdem Removals Team',
          staff_phone: '01234 567890',
          company_name: 'Holdem Removals',
        };

        const response = await api.post(`/mail/templates/${template.id}/preview`, variables);
        setSubject(response.data.subject);
        setBody(response.data.body);
      } catch {
        // Fallback to raw template
        setSubject(template.subject);
        setBody(template.body);
      }
    } else {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSend = async () => {
    if (!selectedAccountId || !to || !subject) {
      alert('Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      // Convert plain text/variables to HTML
      const htmlBody = body
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      await api.post('/mail/send', {
        accountId: selectedAccountId,
        to,
        subject,
        html: htmlBody,
      });

      // If template includes calendar invite, generate and attach it
      if (selectedTemplate?.includesCalendarInvite && lead) {
        // This would be handled by the backend when sending
        console.log('Calendar invite would be attached');
      }

      onSend();
      onClose();
      
      // Reset form
      setSubject('');
      setBody('');
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to send email', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              ✉️ {replyTo ? 'Reply' : 'New Email'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            {/* From Account */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.displayName} &lt;{account.email}&gt;
                  </option>
                ))}
              </select>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Template Selector */}
            {!replyTo && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Template</label>
                <TemplateSelector
                  onSelect={handleTemplateSelect}
                  selectedTemplateId={selectedTemplate?.id}
                />
                {selectedTemplate?.includesCalendarInvite && (
                  <p className="mt-1 text-sm text-green-600">
                    📅 This template will include a calendar invitation attachment
                  </p>
                )}
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Message</label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showPreview ? '✏️ Edit' : '👁️ Preview'}
                </button>
              </div>
              
              {showPreview ? (
                <div 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 min-h-[200px] max-h-[400px] overflow-y-auto prose prose-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: body
                      .replace(/\n/g, '<br>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message..."
                  rows={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              )}
            </div>

            {/* Variable hints */}
            {selectedTemplate && !showPreview && (
              <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                <strong>Available variables:</strong> {selectedTemplate.variables?.map(v => `{{${v}}}`).join(', ')}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
              >
                📎 Attach
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !to || !subject}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : '➤ Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
