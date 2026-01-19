import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Assessment {
    id: string;
    leadId: string;
    lead: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    assignedTo?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    type: 'video' | 'in_person';
    method: 'whatsapp' | 'zoom' | 'phone' | 'on_site' | 'office_visit';
    assessmentDate: string;
    assessmentTime: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    fromPostcode?: string;
    toPostcode?: string;
    notes?: string;
}

type ViewMode = 'week' | 'month';
type CalendarType = 'all' | 'video' | 'in_person';

const methodLabels: Record<string, string> = {
    whatsapp: 'WhatsApp',
    zoom: 'Zoom',
    phone: 'Phone',
    on_site: 'On-Site',
    office_visit: 'Office Visit',
};

const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 border-blue-400 text-blue-800',
    completed: 'bg-green-100 border-green-400 text-green-800',
    cancelled: 'bg-gray-100 border-gray-400 text-gray-500',
    no_show: 'bg-red-100 border-red-400 text-red-800',
};

export default function Assessments() {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [calendarType, setCalendarType] = useState<CalendarType>('all');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Calculate date range based on view mode
    const dateRange = useMemo(() => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        if (viewMode === 'week') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
            start.setDate(diff);
            end.setDate(diff + 6);
        } else {
            start.setDate(1);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
        }

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }, [currentDate, viewMode]);

    useEffect(() => {
        fetchAssessments();
    }, [dateRange, calendarType]);

    const fetchAssessments = async () => {
        try {
            setLoading(true);
            const params: any = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            };
            if (calendarType !== 'all') {
                params.type = calendarType;
            }
            const response = await api.get('/assessments/calendar', { params });
            setAssessments(response.data);
        } catch (error) {
            console.error('Failed to fetch assessments:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigatePeriod = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Generate days for the calendar grid
    const calendarDays = useMemo(() => {
        const days: Date[] = [];
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);

        if (viewMode === 'month') {
            // Adjust to start from Monday of the first week
            const firstDay = start.getDay();
            const startOffset = firstDay === 0 ? 6 : firstDay - 1;
            start.setDate(start.getDate() - startOffset);

            // Generate 6 weeks of days
            for (let i = 0; i < 42; i++) {
                days.push(new Date(start));
                start.setDate(start.getDate() + 1);
            }
        } else {
            // Week view - just 7 days
            for (let i = 0; i < 7; i++) {
                days.push(new Date(start));
                start.setDate(start.getDate() + 1);
            }
        }

        return days;
    }, [dateRange, viewMode]);

    // Group assessments by date
    const assessmentsByDate = useMemo(() => {
        const map = new Map<string, Assessment[]>();
        assessments.forEach((assessment) => {
            const date = assessment.assessmentDate.split('T')[0];
            if (!map.has(date)) {
                map.set(date, []);
            }
            map.get(date)!.push(assessment);
        });
        // Sort each day's assessments by time
        map.forEach((list) => {
            list.sort((a, b) => a.assessmentTime.localeCompare(b.assessmentTime));
        });
        return map;
    }, [assessments]);

    const formatDateHeader = () => {
        if (viewMode === 'week') {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        return currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Assessments Calendar</h1>
                    <p className="text-gray-500">Manage video and in-person assessments</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Assessment
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigatePeriod('prev')}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => navigatePeriod('next')}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <span className="text-lg font-semibold ml-2">{formatDateHeader()}</span>
                    </div>

                    {/* View Mode & Calendar Type */}
                    <div className="flex items-center gap-4">
                        {/* Calendar Type Filter */}
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setCalendarType('all')}
                                className={`px-3 py-1 text-sm rounded ${
                                    calendarType === 'all' ? 'bg-white shadow' : 'hover:bg-gray-200'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setCalendarType('video')}
                                className={`px-3 py-1 text-sm rounded ${
                                    calendarType === 'video' ? 'bg-white shadow' : 'hover:bg-gray-200'
                                }`}
                            >
                                🎥 Video
                            </button>
                            <button
                                onClick={() => setCalendarType('in_person')}
                                className={`px-3 py-1 text-sm rounded ${
                                    calendarType === 'in_person' ? 'bg-white shadow' : 'hover:bg-gray-200'
                                }`}
                            >
                                🏠 In-Person
                            </button>
                        </div>

                        {/* View Mode */}
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('week')}
                                className={`px-3 py-1 text-sm rounded ${
                                    viewMode === 'week' ? 'bg-white shadow' : 'hover:bg-gray-200'
                                }`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-3 py-1 text-sm rounded ${
                                    viewMode === 'month' ? 'bg-white shadow' : 'hover:bg-gray-200'
                                }`}
                            >
                                Month
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <div className={`grid grid-cols-7 ${viewMode === 'week' ? 'min-h-[500px]' : ''}`}>
                        {calendarDays.map((day, index) => {
                            const dateStr = day.toISOString().split('T')[0];
                            const dayAssessments = assessmentsByDate.get(dateStr) || [];
                            const today = isToday(day);
                            const currentMonth = isCurrentMonth(day);

                            return (
                                <div
                                    key={index}
                                    className={`border-r border-b last:border-r-0 ${
                                        viewMode === 'week' ? 'min-h-[500px]' : 'min-h-[120px]'
                                    } ${!currentMonth && viewMode === 'month' ? 'bg-gray-50' : ''}`}
                                >
                                    {/* Date Header */}
                                    <div className={`p-2 text-right ${today ? 'bg-blue-50' : ''}`}>
                                        <span
                                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm ${
                                                today
                                                    ? 'bg-blue-600 text-white font-bold'
                                                    : currentMonth
                                                    ? 'text-gray-900'
                                                    : 'text-gray-400'
                                            }`}
                                        >
                                            {day.getDate()}
                                        </span>
                                    </div>

                                    {/* Assessments */}
                                    <div className="px-1 pb-1 space-y-1">
                                        {dayAssessments.slice(0, viewMode === 'month' ? 3 : 20).map((assessment) => (
                                            <div
                                                key={assessment.id}
                                                onClick={() => navigate(`/leads/${assessment.leadId}`)}
                                                className={`p-1.5 text-xs rounded border-l-2 cursor-pointer hover:opacity-80 ${
                                                    statusColors[assessment.status]
                                                }`}
                                            >
                                                <div className="font-medium flex items-center gap-1">
                                                    <span>{assessment.type === 'video' ? '🎥' : '🏠'}</span>
                                                    <span>{assessment.assessmentTime.slice(0, 5)}</span>
                                                </div>
                                                <div className="truncate">
                                                    {assessment.lead.firstName} {assessment.lead.lastName}
                                                </div>
                                                <div className="text-gray-500 truncate">
                                                    {methodLabels[assessment.method]}
                                                    {assessment.fromPostcode && ` • ${assessment.fromPostcode}`}
                                                </div>
                                            </div>
                                        ))}
                                        {viewMode === 'month' && dayAssessments.length > 3 && (
                                            <div className="text-xs text-gray-500 px-1">
                                                +{dayAssessments.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="text-gray-500">Status:</span>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-blue-200 border border-blue-400"></span>
                    <span>Scheduled</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-200 border border-green-400"></span>
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-200 border border-gray-400"></span>
                    <span>Cancelled</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-200 border border-red-400"></span>
                    <span>No Show</span>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateAssessmentModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        fetchAssessments();
                    }}
                    initialDate={selectedDate}
                />
            )}
        </div>
    );
}

// Create Assessment Modal Component
function CreateAssessmentModal({
    onClose,
    onCreated,
    initialDate,
}: {
    onClose: () => void;
    onCreated: () => void;
    initialDate?: string | null;
}) {
    const [formData, setFormData] = useState({
        leadId: '',
        type: 'video' as 'video' | 'in_person',
        method: 'whatsapp' as string,
        assessmentDate: initialDate || new Date().toISOString().split('T')[0],
        assessmentTime: '10:00',
        fromPostcode: '',
        toPostcode: '',
        notes: '',
    });
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        searchLeads();
    }, [searchTerm]);

    const searchLeads = async () => {
        try {
            const response = await api.get('/leads', {
                params: {
                    search: searchTerm || undefined,
                    limit: 10,
                    status: ['new', 'contacted', 'qualified', 'proposal'],
                },
            });
            setLeads(response.data.data || []);
        } catch (error) {
            console.error('Failed to search leads:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.leadId) {
            alert('Please select a lead');
            return;
        }

        try {
            setLoading(true);
            await api.post('/assessments', formData);
            onCreated();
        } catch (error) {
            console.error('Failed to create assessment:', error);
            alert('Failed to create assessment');
        } finally {
            setLoading(false);
        }
    };

    const videoMethods = ['whatsapp', 'zoom', 'phone'];
    const inPersonMethods = ['on_site', 'office_visit'];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Schedule Assessment</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Lead Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Lead *</label>
                        <input
                            type="text"
                            placeholder="Search leads by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                        <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                            {leads.map((lead) => (
                                <div
                                    key={lead.id}
                                    onClick={() => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            leadId: lead.id,
                                            fromPostcode: lead.fromPostcode || '',
                                            toPostcode: lead.toPostcode || '',
                                        }));
                                    }}
                                    className={`p-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                                        formData.leadId === lead.id ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="font-medium text-sm">
                                        {lead.firstName} {lead.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {lead.email} • {lead.phone}
                                    </div>
                                </div>
                            ))}
                            {leads.length === 0 && (
                                <div className="p-3 text-sm text-gray-500 text-center">No leads found</div>
                            )}
                        </div>
                    </div>

                    {/* Assessment Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type *</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        type: 'video',
                                        method: 'whatsapp',
                                    }))
                                }
                                className={`flex-1 p-3 rounded-lg border ${
                                    formData.type === 'video'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="text-2xl mb-1">🎥</div>
                                <div className="text-sm font-medium">Video</div>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        type: 'in_person',
                                        method: 'on_site',
                                    }))
                                }
                                className={`flex-1 p-3 rounded-lg border ${
                                    formData.type === 'in_person'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="text-2xl mb-1">🏠</div>
                                <div className="text-sm font-medium">In-Person</div>
                            </button>
                        </div>
                    </div>

                    {/* Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Method *</label>
                        <select
                            value={formData.method}
                            onChange={(e) => setFormData((prev) => ({ ...prev, method: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                            {(formData.type === 'video' ? videoMethods : inPersonMethods).map((method) => (
                                <option key={method} value={method}>
                                    {methodLabels[method]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input
                                type="date"
                                value={formData.assessmentDate}
                                onChange={(e) => setFormData((prev) => ({ ...prev, assessmentDate: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                            <input
                                type="time"
                                value={formData.assessmentTime}
                                onChange={(e) => setFormData((prev) => ({ ...prev, assessmentTime: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Postcodes */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Postcode</label>
                            <input
                                type="text"
                                value={formData.fromPostcode}
                                onChange={(e) => setFormData((prev) => ({ ...prev, fromPostcode: e.target.value }))}
                                placeholder="e.g., NN1 1AA"
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Postcode</label>
                            <input
                                type="text"
                                value={formData.toPostcode}
                                onChange={(e) => setFormData((prev) => ({ ...prev, toPostcode: e.target.value }))}
                                placeholder="e.g., MK9 2BB"
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            placeholder="Additional notes..."
                            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.leadId}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
