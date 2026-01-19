import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Mail,
    Phone,
    MessageSquare,
    ArrowRightLeft,
    Calendar,
    Flag,
    Clock,
    Send,
} from 'lucide-react';

interface Activity {
    id: string;
    type: 'email' | 'call' | 'note' | 'status_change' | 'milestone' | 'assessment';
    description: string;
    metadata?: Record<string, any>;
    createdAt: string;
    user?: {
        id: string;
        name: string;
    };
}

interface ActivityTimelineProps {
    leadId: string;
    onActivityAdded?: () => void;
}

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'email':
            return <Mail size={16} className="text-blue-500" />;
        case 'call':
            return <Phone size={16} className="text-green-500" />;
        case 'note':
            return <MessageSquare size={16} className="text-purple-500" />;
        case 'status_change':
            return <ArrowRightLeft size={16} className="text-orange-500" />;
        case 'milestone':
            return <Flag size={16} className="text-yellow-500" />;
        case 'assessment':
            return <Calendar size={16} className="text-teal-500" />;
        default:
            return <Clock size={16} className="text-slate-400" />;
    }
};

const getActivityColor = (type: string) => {
    switch (type) {
        case 'email':
            return 'bg-blue-100 border-blue-200';
        case 'call':
            return 'bg-green-100 border-green-200';
        case 'note':
            return 'bg-purple-100 border-purple-200';
        case 'status_change':
            return 'bg-orange-100 border-orange-200';
        case 'milestone':
            return 'bg-yellow-100 border-yellow-200';
        case 'assessment':
            return 'bg-teal-100 border-teal-200';
        default:
            return 'bg-slate-100 border-slate-200';
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
};

const ActivityTimeline = ({ leadId, onActivityAdded }: ActivityTimelineProps) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [noteText, setNoteText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchActivities = async () => {
        try {
            const response = await api.get(`/leads/${leadId}/activities`);
            setActivities(response.data);
        } catch (error) {
            console.error('Failed to fetch activities', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (leadId) {
            fetchActivities();
        }
    }, [leadId]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteText.trim()) return;

        setSubmitting(true);
        try {
            await api.post(`/leads/${leadId}/notes`, {
                description: noteText.trim(),
            });
            setNoteText('');
            fetchActivities();
            onActivityAdded?.();
        } catch (error) {
            console.error('Failed to add note', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <MessageSquare size={14} className="text-purple-500" />
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add a note..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            rows={2}
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                type="submit"
                                disabled={!noteText.trim() || submitting}
                                className="btn btn-primary btn-sm flex items-center gap-2"
                            >
                                <Send size={14} />
                                {submitting ? 'Adding...' : 'Add Note'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Timeline */}
            {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <Clock size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity yet</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="relative flex gap-3 pl-0">
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white z-10 ${getActivityColor(activity.type)}`}>
                                    {getActivityIcon(activity.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm text-slate-700">{activity.description}</p>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">
                                            {formatDate(activity.createdAt)}
                                        </span>
                                    </div>
                                    {activity.user && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            by {activity.user.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityTimeline;
