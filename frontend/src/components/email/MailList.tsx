import { Search } from 'lucide-react';

export const MailList = ({ emails, selectedEmailId, onSelectEmail, loading }: any) => {
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="w-96 bg-white border-r border-slate-200 flex flex-col h-full">
            {/* Search */}
            <div className="p-4 border-b border-slate-200">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Search emails..."
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-slate-100">
                    {emails.length === 0 ? (
                        <li className="p-4 text-center text-slate-500 text-sm">No emails found.</li>
                    ) : (
                        emails.map((email: any) => (
                            <li
                                key={email.id}
                                onClick={() => onSelectEmail(email)}
                                className={`cursor-pointer hover:bg-slate-50 p-4 transition-colors ${selectedEmailId === email.id ? 'bg-primary-50 border-l-4 border-primary-600' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className={`text-sm font-medium truncate ${email.isRead ? 'text-slate-600' : 'text-slate-900 font-bold'}`}>
                                        {email.fromAddress}
                                    </span>
                                    <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                                        {new Date(email.sentAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className={`text-sm text-slate-900 truncate mb-1 ${!email.isRead && 'font-semibold'}`}>
                                    {email.subject}
                                </h3>
                                <p className="text-xs text-slate-500 truncate">
                                    {email.snippet || email.body?.substring(0, 50) + '...'}
                                </p>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};
