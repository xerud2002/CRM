import { Mail, Send, Trash2, Archive, Inbox, Plus, Settings, Download, Zap } from 'lucide-react';

interface MailSidebarProps {
    accounts: any[];
    selectedAccount: string | null;
    onSelectAccount: (id: string) => void;
    activeFolder: string;
    onSelectFolder: (folder: string) => void;
    unreadCounts?: Record<string, number>;
    onAddAccount?: () => void;
    onImportThunderbird?: () => void;
    onProcessEmails?: () => void;
}

export const MailSidebar = ({ 
    accounts, 
    selectedAccount, 
    onSelectAccount, 
    activeFolder, 
    onSelectFolder,
    unreadCounts = {},
    onAddAccount,
    onImportThunderbird,
    onProcessEmails
}: MailSidebarProps) => {
    const folders = [
        { id: 'inbox', label: 'Inbox', icon: Inbox },
        { id: 'sent', label: 'Sent', icon: Send },
        { id: 'drafts', label: 'Drafts', icon: Archive },
        { id: 'trash', label: 'Trash', icon: Trash2 },
    ];

    // Calculate total unread
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

    return (
        <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-hidden">
            {/* Accounts Section */}
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Email Accounts
                    </h2>
                    {totalUnread > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                            {totalUnread}
                        </span>
                    )}
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                    {accounts.length === 0 ? (
                        <p className="text-sm text-slate-400 py-2">No accounts configured</p>
                    ) : (
                        accounts.map((account: any) => {
                            const unread = unreadCounts[account.id] || 0;
                            return (
                                <button
                                    key={account.id}
                                    onClick={() => onSelectAccount(account.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all ${
                                        selectedAccount === account.id
                                            ? 'bg-white text-primary-700 shadow-sm border border-primary-200'
                                            : 'text-slate-700 hover:bg-white hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center min-w-0">
                                        <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                                            selectedAccount === account.id ? 'bg-primary-500' : 'bg-green-400'
                                        }`}></div>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate text-left">
                                                {account.displayName || account.email.split('@')[0]}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">
                                                {account.email}
                                            </p>
                                        </div>
                                    </div>
                                    {unread > 0 && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full flex-shrink-0">
                                            {unread}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
                <button 
                    onClick={onAddAccount}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-dashed border-slate-300"
                >
                    <Plus size={16} />
                    Add Account
                </button>
                <button 
                    onClick={onImportThunderbird}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    <Download size={16} />
                    Import from Thunderbird
                </button>
                <button 
                    onClick={onProcessEmails}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
                >
                    <Zap size={16} />
                    Process to Leads
                </button>
            </div>

            {/* Folders Section */}
            <div className="flex-1 p-4 overflow-y-auto">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Folders</h2>
                <div className="space-y-1">
                    {folders.map((folder) => (
                        <button
                            key={folder.id}
                            onClick={() => onSelectFolder(folder.id)}
                            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                activeFolder === folder.id
                                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            }`}
                        >
                            <folder.icon size={18} className="mr-3 flex-shrink-0" />
                            {folder.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Settings Link */}
            <div className="p-4 border-t border-slate-200">
                <button className="w-full flex items-center px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <Settings size={18} className="mr-3" />
                    Email Settings
                </button>
            </div>
        </div>
    );
};
