import { useState, useEffect } from 'react';
import api from '../../services/api';

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  deposit?: number;
  createdAt: string;
  sentAt?: string;
  validUntil?: string;
  lineItems: Array<{
    id: string;
    description: string;
    category: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  lead?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    fromAddress?: string;
    toAddress?: string;
    moveDate?: string;
  };
}

interface QuoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  onUpdate?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
};

export const QuoteDetailModal = ({ isOpen, onClose, quoteId, onUpdate }: QuoteDetailModalProps) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/quotes/${quoteId}`);
      setQuote(response.data);
    } catch (error) {
      console.error('Failed to fetch quote', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && quoteId) {
      fetchQuote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, quoteId]);
  };

  const handleSend = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      await api.post(`/quotes/${quote.id}/send`);
      await fetchQuote();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to send quote', error);
      alert('Failed to send quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      await api.post(`/quotes/${quote.id}/accept`);
      await fetchQuote();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to accept quote', error);
      alert('Failed to accept quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!quote) return;
    if (!confirm('Are you sure you want to mark this quote as declined?')) return;
    setActionLoading(true);
    try {
      await api.post(`/quotes/${quote.id}/decline`);
      await fetchQuote();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to decline quote', error);
      alert('Failed to decline quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewPdf = () => {
    if (!quote) return;
    window.open(`${api.defaults.baseURL}/quotes/${quote.id}/pdf/preview`, '_blank');
  };

  const handleDownloadPdf = async () => {
    if (!quote) return;
    window.open(`${api.defaults.baseURL}/quotes/${quote.id}/pdf`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                {quote?.quoteNumber || 'Loading...'}
              </h2>
              {quote && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[quote.status]}`}>
                  {quote.status.toUpperCase()}
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : quote ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Customer</h3>
                  <p className="font-semibold text-slate-900">
                    {quote.lead?.firstName} {quote.lead?.lastName}
                  </p>
                  <p className="text-sm text-slate-600">{quote.lead?.email}</p>
                  {quote.lead?.phone && (
                    <p className="text-sm text-slate-600">{quote.lead.phone}</p>
                  )}
                </div>

                {/* Move Details */}
                {quote.lead && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">From:</span>
                      <p className="font-medium">{quote.lead.fromAddress || 'TBC'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">To:</span>
                      <p className="font-medium">{quote.lead.toAddress || 'TBC'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Move Date:</span>
                      <p className="font-medium">
                        {quote.lead.moveDate
                          ? new Date(quote.lead.moveDate).toLocaleDateString('en-GB')
                          : 'TBC'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Quote Created:</span>
                      <p className="font-medium">
                        {new Date(quote.createdAt).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Line Items */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Items</h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Description</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-500">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {quote.lineItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <span className="font-medium">{item.description}</span>
                              <span className="ml-2 text-xs text-slate-400">{item.category}</span>
                            </td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">£{Number(item.unitPrice).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-medium">£{Number(item.amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span>£{Number(quote.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">VAT (20%)</span>
                      <span>£{Number(quote.vatAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Total</span>
                      <span className="text-blue-600">£{Number(quote.total).toFixed(2)}</span>
                    </div>
                    {quote.deposit && (
                      <div className="flex justify-between text-sm text-green-600 pt-1">
                        <span>Deposit Required</span>
                        <span>£{Number(quote.deposit).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="text-xs text-slate-500 space-y-1">
                  {quote.sentAt && (
                    <p>📤 Sent: {new Date(quote.sentAt).toLocaleString('en-GB')}</p>
                  )}
                  {quote.validUntil && (
                    <p>⏰ Valid until: {new Date(quote.validUntil).toLocaleDateString('en-GB')}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-500">Quote not found</p>
            )}
          </div>

          {/* Footer */}
          {quote && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={handleViewPdf}
                  className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  👁️ Preview PDF
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  📥 Download PDF
                </button>
              </div>
              <div className="flex gap-2">
                {quote.status === 'draft' && (
                  <button
                    onClick={handleSend}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    📧 Send to Customer
                  </button>
                )}
                {['sent', 'viewed'].includes(quote.status) && (
                  <>
                    <button
                      onClick={handleDecline}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      ✗ Declined
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      ✓ Accepted
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailModal;
