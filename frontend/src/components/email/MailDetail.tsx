import { Reply, ReplyAll, Forward, Trash2, MoreVertical, Star, Mail } from 'lucide-react';

export const MailDetail = ({ email }: any) => {
    if (!email) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400 flex-col">
                <Mail size={48} className="mb-4 opacity-50" />
                <p>Select an email to view</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-xl font-bold text-slate-900">{email.subject}</h1>
                    <div className="flex items-center space-x-2">
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                            <Star size={20} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100">
                            <Trash2 size={20} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {email.fromAddress.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                        <div className="flex items-baseline">
                            <span className="text-sm font-medium text-slate-900 mr-2">{email.fromAddress}</span>
                            <span className="text-xs text-slate-500">to me</span>
                        </div>
                        <div className="text-xs text-slate-400">
                            {new Date(email.sentAt).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="prose max-w-none text-slate-800">
                    {/* In a real app, use a sanitizer here for HTML content */}
                    <div dangerouslySetInnerHTML={{ __html: email.body }} />
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex space-x-3">
                    <button className="btn btn-outline flex items-center">
                        <Reply size={16} className="mr-2" /> Reply
                    </button>
                    <button className="btn btn-outline flex items-center">
                        <ReplyAll size={16} className="mr-2" /> Reply All
                    </button>
                    <button className="btn btn-outline flex items-center">
                        <Forward size={16} className="mr-2" /> Forward
                    </button>
                </div>
            </div>
        </div>
    );
};
