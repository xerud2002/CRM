import { useState, useEffect } from 'react';
import api from '../../services/api';
import { QuoteDetailModal } from './QuoteDetailModal';

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  total: number;
  createdAt: string;
  sentAt?: string;
  lead?: {
    firstName: string;
    lastName: string;
  };
}

interface QuotesListProps {
  leadId: string;
  onCreateQuote: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
};

export const QuotesList = ({ leadId, onCreateQuote }: QuotesListProps) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const fetchQuotes = async () => {
    try {
      const response = await api.get(`/quotes/lead/${leadId}`);
      setQuotes(response.data);
    } catch (error) {
      console.error('Failed to fetch quotes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [leadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Quotes</h3>
        <button
          onClick={onCreateQuote}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Quote
        </button>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>No quotes yet</p>
          <button
            onClick={onCreateQuote}
            className="mt-2 text-blue-600 hover:text-blue-700"
          >
            Create the first quote
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              onClick={() => setSelectedQuoteId(quote.id)}
              className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium text-slate-700">
                    {quote.quoteNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[quote.status]}`}>
                    {quote.status}
                  </span>
                </div>
                <span className="font-semibold text-blue-600">
                  £{Number(quote.total).toFixed(2)}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Created {new Date(quote.createdAt).toLocaleDateString('en-GB')}
                {quote.sentAt && ` • Sent ${new Date(quote.sentAt).toLocaleDateString('en-GB')}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQuoteId && (
        <QuoteDetailModal
          isOpen={!!selectedQuoteId}
          onClose={() => setSelectedQuoteId(null)}
          quoteId={selectedQuoteId}
          onUpdate={fetchQuotes}
        />
      )}
    </div>
  );
};

export default QuotesList;
