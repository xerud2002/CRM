import { useState } from 'react';
import { Zap, Check, AlertCircle, FileText, Users, RefreshCw } from 'lucide-react';
import api from '../../services/api';

interface ProcessingResult {
  processed: number;
  leadsCreated: number;
  skipped: number;
  errors: string[];
  leads: { id: string; email: string; source: string }[];
}

interface ProcessingStats {
  totalUnprocessed: number;
  bySource: Record<string, number>;
}

export const EmailProcessor = ({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const response = await api.get('/mail/process/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const processEmails = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/mail/process');
      setResult(response.data);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load stats on mount
  useState(() => {
    loadStats();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Process Emails</h2>
              <p className="text-sm text-white/80">Convert incoming emails to leads</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats */}
          {stats && !result && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="text-slate-400" size={20} />
                <span className="font-medium text-slate-700">
                  {stats.totalUnprocessed} unprocessed emails
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Emails from CompareMyMove, ReallyMoving, GetAMover, and your website
                will be automatically parsed and converted to leads.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="animate-spin text-purple-600 mx-auto" size={48} />
              <p className="mt-4 text-slate-600">Processing emails...</p>
              <p className="text-sm text-slate-400">This may take a moment</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={18} />
                <span className="font-medium">Error</span>
              </div>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="text-green-600" size={32} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Processing Complete!</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.processed}</p>
                  <p className="text-xs text-slate-600">Processed</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{result.leadsCreated}</p>
                  <p className="text-xs text-slate-600">Leads Created</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-600">{result.skipped}</p>
                  <p className="text-xs text-slate-600">Skipped</p>
                </div>
              </div>

              {/* New leads list */}
              {result.leads.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Users size={16} />
                    New Leads Created
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm"
                      >
                        <span className="text-slate-700">{lead.email}</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          {lead.source}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    {result.errors.length} warnings
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-1 max-h-20 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Initial state - not loading, no result */}
          {!loading && !result && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-purple-600" size={32} />
              </div>
              <p className="text-slate-600 mb-2">
                Scan incoming emails and automatically create leads from:
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">CompareMyMove</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">ReallyMoving</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">GetAMover</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Website</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-between bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
          >
            {result ? 'Close' : 'Cancel'}
          </button>

          {!result && (
            <button
              onClick={processEmails}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Process Emails
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
