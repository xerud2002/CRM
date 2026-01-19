import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { MailSidebar } from '../components/email/MailSidebar';
import { MailList } from '../components/email/MailList';
import { MailDetail } from '../components/email/MailDetail';
import { ComposeModal } from '../components/email/ComposeModal';
import { ThunderbirdImport } from '../components/email/ThunderbirdImport';
import { RefreshCw, Bell, BellOff } from 'lucide-react';

const Email = () => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [activeFolder, setActiveFolder] = useState('inbox');
    const [emails, setEmails] = useState<any[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [composeOpen, setComposeOpen] = useState(false);
    const [replyTo, setReplyTo] = useState<any>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showThunderbirdImport, setShowThunderbirdImport] = useState(false);
    const [lastEmailCount, setLastEmailCount] = useState<Record<string, number>>({});
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // 1. Fetch Accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await api.get('/mail/accounts');
                setAccounts(response.data);
                if (response.data.length > 0 && !selectedAccount) {
                    setSelectedAccount(response.data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch accounts', error);
            }
        };
        fetchAccounts();
    }, []);

    // Fetch emails for an account
    const fetchEmails = useCallback(async (accountId: string, showLoading = true) => {
        if (!accountId) return;

        if (showLoading) setLoading(true);
        try {
            const response = await api.get(`/mail/inbox`, {
                params: { accountId, page: 1, limit: 100 }
            });
            
            const newEmails = response.data.data || response.data || [];
            
            // Check for new emails and notify
            const account = accounts.find(a => a.id === accountId);
            const prevCount = lastEmailCount[accountId] || 0;
            const newCount = newEmails.length;
            
            if (notificationsEnabled && prevCount > 0 && newCount > prevCount && account) {
                const diff = newCount - prevCount;
                showNotification(account.email, diff);
            }
            
            setLastEmailCount(prev => ({ ...prev, [accountId]: newCount }));
            
            if (accountId === selectedAccount) {
                setEmails(newEmails);
            }
            
            // Update unread count
            const unread = newEmails.filter((e: any) => !e.isRead).length;
            setUnreadCounts(prev => ({ ...prev, [accountId]: unread }));
            
        } catch (error) {
            console.error('Failed to fetch emails', error);
            if (accountId === selectedAccount) {
                setEmails([]);
            }
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [accounts, selectedAccount, notificationsEnabled, lastEmailCount]);

    // Show browser notification
    const showNotification = (email: string, count: number) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Email', {
                body: `${count} new email${count > 1 ? 's' : ''} on ${email}`,
                icon: '/favicon.ico',
                tag: email
            });
        }
    };

    // 2. Fetch Emails when Account changes
    useEffect(() => {
        if (selectedAccount) {
            fetchEmails(selectedAccount);
        }
    }, [selectedAccount]);

    // 3. Polling for new emails (every 30 seconds)
    useEffect(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }

        pollingRef.current = setInterval(() => {
            // Poll all accounts for new email counts
            accounts.forEach(account => {
                fetchEmails(account.id, false);
            });
        }, 30000); // 30 seconds

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [accounts, fetchEmails]);

    // Sync emails from server
    const handleSync = async () => {
        setSyncing(true);
        try {
            if (selectedAccount) {
                await api.post(`/mail/accounts/${selectedAccount}/sync`);
                await fetchEmails(selectedAccount);
            } else {
                await api.post('/mail/sync-all');
                // Refresh all accounts
                for (const account of accounts) {
                    await fetchEmails(account.id, false);
                }
            }
        } catch (error) {
            console.error('Failed to sync emails', error);
        } finally {
            setSyncing(false);
        }
    };

    // Handle selection
    const handleSelectEmail = async (email: any) => {
        setSelectedEmail(email);
        // Mark as read
        if (!email.isRead) {
            try {
                // Optimistic update
                setEmails(prev => prev.map(e => 
                    e.id === email.id ? { ...e, isRead: true } : e
                ));
                // Update unread count
                if (selectedAccount) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [selectedAccount]: Math.max(0, (prev[selectedAccount] || 0) - 1)
                    }));
                }
            } catch (error) {
                console.error('Failed to mark as read', error);
            }
        }
    };

    const handleCompose = () => {
        setReplyTo(null);
        setComposeOpen(true);
    };

    const handleReply = () => {
        if (selectedEmail) {
            setReplyTo({
                subject: selectedEmail.subject,
                from: selectedEmail.fromAddress,
                body: selectedEmail.body,
            });
            setComposeOpen(true);
        }
    };

    const handleEmailSent = () => {
        setComposeOpen(false);
        if (selectedAccount) {
            fetchEmails(selectedAccount);
        }
    };

    const selectedAccountData = accounts.find(a => a.id === selectedAccount);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold text-slate-800">📧 Email</h1>
                    {selectedAccountData && (
                        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            {selectedAccountData.email}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={`p-2 rounded-lg transition-colors ${
                            notificationsEnabled 
                                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                                : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
                    >
                        {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Sync emails"
                    >
                        <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleCompose}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Compose
                    </button>
                </div>
            </div>

            {/* Main email layout */}
            <div className="flex flex-1 bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                {/* Sidebar */}
                <MailSidebar
                    accounts={accounts}
                    selectedAccount={selectedAccount}
                    onSelectAccount={setSelectedAccount}
                    activeFolder={activeFolder}
                    onSelectFolder={setActiveFolder}
                    unreadCounts={unreadCounts}
                    onImportThunderbird={() => setShowThunderbirdImport(true)}
                />

                {/* List (if account selected) */}
                {selectedAccount ? (
                    <>
                        <MailList
                            emails={emails}
                            selectedEmailId={selectedEmail?.id}
                            onSelectEmail={handleSelectEmail}
                            loading={loading}
                        />
                        {/* Detail */}
                        <MailDetail 
                            email={selectedEmail}
                            onReply={handleReply}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Select an account to view emails
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            <ComposeModal
                isOpen={composeOpen}
                onClose={() => setComposeOpen(false)}
                onSend={handleEmailSent}
                accounts={accounts}
                replyTo={replyTo}
            />

            {/* Thunderbird Import Modal */}
            {showThunderbirdImport && (
                <ThunderbirdImport 
                    onClose={() => setShowThunderbirdImport(false)}
                    onSuccess={() => {
                        setShowThunderbirdImport(false);
                        fetchAccounts();
                    }}
                />
            )}
        </div>
    );
};

export default Email;
