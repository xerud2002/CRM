import { useState, useEffect } from 'react';
import api from '../services/api';
import { MailSidebar } from '../components/email/MailSidebar';
import { MailList } from '../components/email/MailList';
import { MailDetail } from '../components/email/MailDetail';

const Email = () => {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [activeFolder, setActiveFolder] = useState('inbox');
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
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
                    <MailDetail email={selectedEmail} />
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    Select an account to view emails
                </div>
            )}
        </div>
    );
};

export default Email;
