import { useState } from 'react';
import { Upload, RefreshCw, Check, AlertCircle, Folder, Mail, HardDrive } from 'lucide-react';
import api from '../../services/api';

interface Profile {
  name: string;
  path: string;
}

interface ThunderbirdAccount {
  id: string;
  name: string;
  email: string;
  incomingServer: {
    type: string;
    hostname: string;
    port: number;
    username: string;
  };
}

interface MboxFile {
  account: string;
  folder: string;
  path: string;
  size: number;
}

interface ImportPreview {
  profilePath: string;
  accounts: ThunderbirdAccount[];
  mboxFiles: MboxFile[];
}

interface ImportResultData {
  accounts?: number;
  emails?: number;
  errors?: string[];
  imported?: number;
  skipped?: number;
}

export const ThunderbirdImport = ({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) => {
  const [step, setStep] = useState<'profiles' | 'preview' | 'importing' | 'done'>('profiles');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);
  const [selectedFolders, setSelectedFolders] = useState<string[]>(['Inbox', 'Sent']);
  const [emailLimit, setEmailLimit] = useState(100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/mail/import/thunderbird/profiles');
      setProfiles(response.data);
      if (response.data.length === 0) {
        setError('No Thunderbird profiles found. Make sure Thunderbird is installed.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profiles';
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    if (!selectedProfile) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/mail/import/thunderbird/preview', {
        params: { profilePath: selectedProfile }
      });
      setPreview(response.data);
      setStep('preview');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preview';
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const importAccounts = async () => {
    setLoading(true);
    setError(null);
    const response = await api.post('/mail/import/thunderbird/accounts', {
      profilePath: selectedProfile
    });
    return response.data;
  };

  const importEmails = async () => {
    setLoading(true);
    setError(null);
    const response = await api.post('/mail/import/thunderbird/emails', {
      profilePath: selectedProfile,
      folders: selectedFolders,
      limit: emailLimit
    });
    return response.data;
  };

  const handleImport = async () => {
    setStep('importing');
    setError(null);
    try {
      const accountsResult = await importAccounts();
      const emailsResult = await importEmails();
      
      setImportResult({
        ...accountsResult,
        emails: emailsResult.emails
      });
      setStep('done');
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || errorMessage);
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folder: string) => {
    setSelectedFolders(prev => 
      prev.includes(folder) 
        ? prev.filter(f => f !== folder)
        : [...prev, folder]
    );
  };

  // Load profiles on mount
  useState(() => {
    loadProfiles();
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Mail size={24} />
            Import from Mozilla Thunderbird
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Import your email accounts and messages
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Select Profile */}
          {step === 'profiles' && (
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900">Select Thunderbird Profile</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="animate-spin text-blue-600" size={32} />
                </div>
              ) : profiles.length > 0 ? (
                <div className="space-y-2">
                  {profiles.map(profile => (
                    <button
                      key={profile.path}
                      onClick={() => setSelectedProfile(profile.path)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedProfile === profile.path
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Folder className={selectedProfile === profile.path ? 'text-blue-600' : 'text-slate-400'} size={20} />
                        <div>
                          <p className="font-medium text-slate-900">{profile.name}</p>
                          <p className="text-xs text-slate-500 truncate">{profile.path}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <HardDrive size={48} className="mx-auto mb-4 text-slate-300" />
                  <p>No Thunderbird profiles found</p>
                  <button
                    onClick={loadProfiles}
                    className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && preview && (
            <div className="space-y-6">
              {/* Accounts */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3">
                  Email Accounts ({preview.accounts.length})
                </h3>
                <div className="space-y-2">
                  {preview.accounts.map(account => (
                    <div key={account.id} className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                      <Mail className="text-blue-500" size={18} />
                      <div>
                        <p className="font-medium text-slate-900">{account.name || account.email}</p>
                        <p className="text-xs text-slate-500">{account.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Folders */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3">
                  Select Folders to Import
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {preview.mboxFiles.map((mbox, idx) => (
                    <label
                      key={idx}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedFolders.includes(mbox.folder)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFolders.includes(mbox.folder)}
                          onChange={() => toggleFolder(mbox.folder)}
                          className="mt-1"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{mbox.folder}</p>
                          <p className="text-xs text-slate-500">{formatBytes(mbox.size)}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Import Options</h3>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-slate-600">
                    Max emails per folder:
                    <select
                      value={emailLimit}
                      onChange={(e) => setEmailLimit(Number(e.target.value))}
                      className="ml-2 px-3 py-1 border border-slate-200 rounded-lg"
                    >
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={500}>500</option>
                      <option value={1000}>1000</option>
                      <option value={0}>All (slow)</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="text-center py-12">
              <RefreshCw className="animate-spin text-blue-600 mx-auto" size={48} />
              <p className="mt-4 text-slate-600">Importing your emails...</p>
              <p className="text-sm text-slate-400">This may take a few minutes</p>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 'done' && importResult && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="text-green-600" size={32} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Import Complete!</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {importResult.imported || 0}
                  </p>
                  <p className="text-sm text-slate-600">Accounts Imported</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {importResult.emails || 0}
                  </p>
                  <p className="text-sm text-slate-600">Emails Imported</p>
                </div>
              </div>

              {(importResult.errors?.length ?? 0) > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">
                    {importResult.errors?.length} warnings during import
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-between bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
          >
            {step === 'done' ? 'Close' : 'Cancel'}
          </button>

          <div className="flex gap-3">
            {step === 'profiles' && selectedProfile && (
              <button
                onClick={loadPreview}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <RefreshCw className="animate-spin" size={16} />}
                Preview Import
              </button>
            )}

            {step === 'preview' && (
              <>
                <button
                  onClick={() => setStep('profiles')}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading || selectedFolders.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload size={16} />
                  Start Import
                </button>
              </>
            )}

            {step === 'done' && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
