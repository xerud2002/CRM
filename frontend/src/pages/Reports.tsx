import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    TrendingUp,
    Users,
    DollarSign,
    Phone,
    Mail,
    Calendar,
    MapPin,
    RefreshCw,
    ArrowDownRight,
    Download,
    ChevronDown,
} from 'lucide-react';

interface ReportSummary {
    period: { start: string; end: string };
    summary: {
        totalLeads: number;
        totalWon: number;
        conversionRate: number;
        revenue: number;
        avgDealValue: number;
        quotesSent: number;
        quotesAccepted: number;
        totalCalls: number;
        totalEmails: number;
        assessments: number;
    };
    leadsBySource: Array<{
        source: string;
        count: number;
        won: number;
        lost: number;
        conversionRate: number;
    }>;
    funnel: Array<{
        name: string;
        count: number;
        percent: number;
    }>;
}

interface StaffPerformance {
    userId: string;
    name: string;
    totalLeads: number;
    won: number;
    lost: number;
    contacted: number;
    calls: number;
    conversionRate: number;
}

interface LocationData {
    postcodeArea: string;
    total: number;
    won: number;
    avgQuoteValue: number;
    conversionRate: number;
}

type Period = 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'custom';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatPercent = (value: number) => `${value}%`;

const Reports = () => {
    const [period, setPeriod] = useState<Period>('this_month');
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'staff' | 'locations'>('overview');
    const [exportMenuOpen, setExportMenuOpen] = useState(false);

    const handleExport = (type: 'leads' | 'quotes' | 'calls' | 'assessments' | 'summary') => {
        const baseUrl = 'http://localhost:3001/api/reports/export';
        const token = localStorage.getItem('token');
        const url = `${baseUrl}/${type}?period=${period}`;
        
        // Create a temporary link to trigger download with auth header
        fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.blob())
            .then(blob => {
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
            })
            .catch(err => console.error('Export failed:', err));
        
        setExportMenuOpen(false);
    };

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, staffRes, locationsRes] = await Promise.all([
                api.get('/reports/summary', { params: { period } }),
                api.get('/reports/staff-performance', { params: { period } }),
                api.get('/reports/locations', { params: { period } }),
            ]);
            setSummary(summaryRes.data);
            setStaffPerformance(staffRes.data);
            setLocations(locationsRes.data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const periodLabels: Record<Period, string> = {
        this_week: 'This Week',
        this_month: 'This Month',
        this_quarter: 'This Quarter',
        this_year: 'This Year',
        custom: 'Custom Range',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
                    <p className="text-slate-500">Track performance and conversion metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as Period)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        {Object.entries(periodLabels).filter(([k]) => k !== 'custom').map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <button
                        onClick={fetchReports}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                    {/* Export Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setExportMenuOpen(!exportMenuOpen)}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Download size={18} />
                            Export CSV
                            <ChevronDown size={16} />
                        </button>
                        {exportMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                                <button
                                    onClick={() => handleExport('summary')}
                                    className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm"
                                >
                                    Summary Report
                                </button>
                                <button
                                    onClick={() => handleExport('leads')}
                                    className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm"
                                >
                                    Leads Data
                                </button>
                                <button
                                    onClick={() => handleExport('quotes')}
                                    className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm"
                                >
                                    Quotes Data
                                </button>
                                <button
                                    onClick={() => handleExport('calls')}
                                    className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm"
                                >
                                    Calls Data
                                </button>
                                <button
                                    onClick={() => handleExport('assessments')}
                                    className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm"
                                >
                                    Assessments Data
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{summary?.summary.totalLeads || 0}</p>
                            <p className="text-sm text-slate-500">Total Leads</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <TrendingUp size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{formatPercent(summary?.summary.conversionRate || 0)}</p>
                            <p className="text-sm text-slate-500">Conversion Rate</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <DollarSign size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary?.summary.revenue || 0)}</p>
                            <p className="text-sm text-slate-500">Revenue</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Phone size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{summary?.summary.totalCalls || 0}</p>
                            <p className="text-sm text-slate-500">Calls Made</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                            <Calendar size={20} className="text-teal-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{summary?.summary.assessments || 0}</p>
                            <p className="text-sm text-slate-500">Assessments</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 flex">
                    {(['overview', 'funnel', 'staff', 'locations'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                                activeTab === tab
                                    ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab === 'staff' ? 'Staff Performance' : tab}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Leads by Source */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Leads by Source</h3>
                                <div className="space-y-3">
                                    {summary?.leadsBySource.map((source) => (
                                        <div key={source.source} className="bg-slate-50 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-900 capitalize">
                                                    {source.source.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-sm text-slate-500">{source.count} leads</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-green-600">{source.won} won</span>
                                                <span className="text-red-600">{source.lost} lost</span>
                                                <span className="text-slate-500">{source.conversionRate}% conv.</span>
                                            </div>
                                            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${source.conversionRate}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {(!summary?.leadsBySource || summary.leadsBySource.length === 0) && (
                                        <p className="text-slate-500 text-center py-4">No data available</p>
                                    )}
                                </div>
                            </div>

                            {/* Quote Stats */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quote Performance</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-slate-900">{summary?.summary.quotesSent || 0}</p>
                                        <p className="text-sm text-slate-500">Quotes Sent</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-green-600">{summary?.summary.quotesAccepted || 0}</p>
                                        <p className="text-sm text-slate-500">Accepted</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-slate-900">{formatCurrency(summary?.summary.avgDealValue || 0)}</p>
                                        <p className="text-sm text-slate-500">Avg Deal Value</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-slate-900">{summary?.summary.totalWon || 0}</p>
                                        <p className="text-sm text-slate-500">Jobs Won</p>
                                    </div>
                                </div>

                                {/* Activity Summary */}
                                <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-4">Activity Summary</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
                                        <Phone size={18} className="text-orange-600" />
                                        <span className="font-medium">{summary?.summary.totalCalls || 0} calls</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                                        <Mail size={18} className="text-blue-600" />
                                        <span className="font-medium">{summary?.summary.totalEmails || 0} emails</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg">
                                        <Calendar size={18} className="text-teal-600" />
                                        <span className="font-medium">{summary?.summary.assessments || 0} assessments</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Funnel Tab */}
                    {activeTab === 'funnel' && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Conversion Funnel</h3>
                            <div className="space-y-2">
                                {summary?.funnel.map((stage, index) => (
                                    <div key={stage.name} className="relative">
                                        <div 
                                            className="bg-primary-100 rounded-lg p-4 transition-all"
                                            style={{ 
                                                marginLeft: `${index * 2}%`,
                                                marginRight: `${index * 2}%`,
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-slate-900">{stage.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl font-bold text-primary-600">{stage.count}</span>
                                                    <span className="text-sm text-slate-500">({stage.percent}%)</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary-500 rounded-full transition-all"
                                                    style={{ width: `${stage.percent}%` }}
                                                />
                                            </div>
                                        </div>
                                        {index < (summary?.funnel.length || 0) - 1 && (
                                            <div className="flex justify-center py-1">
                                                <ArrowDownRight size={20} className="text-slate-300" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Staff Performance Tab */}
                    {activeTab === 'staff' && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Staff Performance</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left border-b border-slate-200">
                                            <th className="pb-3 font-medium text-slate-500">Name</th>
                                            <th className="pb-3 font-medium text-slate-500 text-right">Leads</th>
                                            <th className="pb-3 font-medium text-slate-500 text-right">Contacted</th>
                                            <th className="pb-3 font-medium text-slate-500 text-right">Calls</th>
                                            <th className="pb-3 font-medium text-slate-500 text-right">Won</th>
                                            <th className="pb-3 font-medium text-slate-500 text-right">Lost</th>
                                            <th className="pb-3 font-medium text-slate-500 text-right">Conv. Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffPerformance.map((staff) => (
                                            <tr key={staff.userId} className="border-b border-slate-100">
                                                <td className="py-3 font-medium text-slate-900">{staff.name}</td>
                                                <td className="py-3 text-right">{staff.totalLeads}</td>
                                                <td className="py-3 text-right">{staff.contacted}</td>
                                                <td className="py-3 text-right">{staff.calls}</td>
                                                <td className="py-3 text-right text-green-600">{staff.won}</td>
                                                <td className="py-3 text-right text-red-600">{staff.lost}</td>
                                                <td className="py-3 text-right">
                                                    <span className={`px-2 py-1 rounded-full text-sm ${
                                                        staff.conversionRate >= 20 ? 'bg-green-100 text-green-700' :
                                                        staff.conversionRate >= 10 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {staff.conversionRate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {staffPerformance.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-slate-500">
                                                    No staff data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Locations Tab */}
                    {activeTab === 'locations' && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance by Location</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {locations.map((loc) => (
                                    <div key={loc.postcodeArea} className="bg-slate-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin size={18} className="text-slate-400" />
                                            <span className="text-lg font-bold text-slate-900">{loc.postcodeArea}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-slate-500">Total Leads</p>
                                                <p className="font-semibold">{loc.total}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Won</p>
                                                <p className="font-semibold text-green-600">{loc.won}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Avg Quote</p>
                                                <p className="font-semibold">{formatCurrency(loc.avgQuoteValue)}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Conv. Rate</p>
                                                <p className="font-semibold">{loc.conversionRate}%</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {locations.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-slate-500">
                                        No location data available
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
