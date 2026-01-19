import { useState, useEffect } from 'react';
import api from '../services/api';
import { MailSidebar } from '../components/email/MailSidebar';
import { MailList } from '../components/email/MailList';
import { MailDetail } from '../components/email/MailDetail';
import { ComposeModal } from '../components/email/ComposeModal';

const Email = () => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [activeFolder, setActiveFolder] = useState('inbox');
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [composeOpen, setComposeOpen] = useState(false);
    const [replyTo, setReplyTo] = useState<any>(null);

    // 1. Fetch Accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await api.get('/mail/accounts');
                setAccounts(response.data);
                if (response.data.length > 0) {
                    setSelectedAccount(response.data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch accounts', error);
            }
        };
        fetchAccounts();
    }, []);

    // 2. Fetch Emails when Account/Folder changes
    useEffect(() => {
        const fetchEmails = async () => {
            if (!selectedAccount) return;

            setLoading(true);
            try {
                // Query param 'folder' is not yet supported by backend, this is a placeholder
                const response = await api.get(`/mail/${selectedAccount}/inbox`);
                setEmails(response.data);
            } catch (error) {
                console.error('Failed to fetch emails', error);
                setEmails([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEmails();
    }, [selectedAccount, activeFolder]);

    // Handle selection
    const handleSelectEmail = (email: any) => {
        setSelectedEmail(email);
        // Mark as read logic here
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
        // Refresh emails after sending
        setComposeOpen(false);
        // Optionally refresh the email list
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Top bar with compose button */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
                <h1 className="text-xl font-semibold text-slate-800">📧 Email</h1>
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

            {/* Main email layout */}
            <div className="flex flex-1 bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                {/* Sidebar */}
                <MailSidebar
                    accounts={accounts}
                    selectedAccount={selectedAccount}
                    onSelectAccount={setSelectedAccount}
                    activeFolder={activeFolder}
                    onSelectFolder={setActiveFolder}
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
        </div>
    );
};

export default Email;
