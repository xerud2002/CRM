import { Mail, Send, Trash2, Archive } from 'lucide-react';

export const MailSidebar = ({ accounts, selectedAccount, onSelectAccount, activeFolder, onSelectFolder }: any) => {
    const folders = [
        { id: 'inbox', label: 'Inbox', icon: Mail },
        { id: 'sent', label: 'Sent', icon: Send },
        { id: 'drafts', label: 'Drafts', icon: Archive },
        { id: 'trash', label: 'Trash', icon: Trash2 },
    ];

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full bg-slate-50">
            <div className="p-4">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Accounts</h2>
                <div className="space-y-1">
                    {accounts.map((account: any) => (
                        <button
                            key={account.id}
                            onClick={() => onSelectAccount(account.id)}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${selectedAccount === account.id
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-slate-700 hover:bg-white hover:text-slate-900'
                                }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                            <span className="truncate">{account.email}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4 p-4">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Folders</h2>
                <div className="space-y-1">
                    {folders.map((folder) => (
                        <button
                            key={folder.id}
                            onClick={() => onSelectFolder(folder.id)}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeFolder === folder.id
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            <folder.icon size={18} className="mr-3" />
                            {folder.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
