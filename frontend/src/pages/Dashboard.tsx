import { useEffect, useState } from 'react';
import api from '../services/api';
import {
    Users,
    Mail,
    PhoneCall,
    CheckCircle,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    type LucideIcon
} from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: LucideIcon;
    color: string;
}

const StatCard = ({ title, value, change, icon: Icon, color }: StatCardProps) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            {change && (
                <div className={`flex items-center text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                    {Math.abs(change)}%
                </div>
            )}
        </div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/overview');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const metrics = stats?.contactMetrics || { totalLeads: 0, contactedPercent: 0, respondedPercent: 0 };
    const funnel = stats?.conversionFunnel || { surveyBooked: 0, quoteAccepted: 0 };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Leads"
                    value={metrics.totalLeads}
                    change={12}
                    icon={Users}
                    color="text-primary-600 bg-primary-600"
                />
                <StatCard
                    title="Contact Rate"
                    value={`${metrics.contactedPercent}%`}
                    change={5.4}
                    icon={Mail}
                    color="text-blue-600 bg-blue-600"
                />
                <StatCard
                    title="Surveys Booked"
                    value={funnel.surveyBooked}
                    change={-2}
                    icon={PhoneCall}
                    color="text-purple-600 bg-purple-600"
                />
                <StatCard
                    title="Quotes Accepted"
                    value={funnel.quoteAccepted}
                    change={8.1}
                    icon={CheckCircle}
                    color="text-green-600 bg-green-600"
                />
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-slate-900">Conversion Funnel</h2>
                        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600">Leads</span>
                                <span className="text-sm font-bold text-slate-900">{funnel.totalLeads}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600">Surveys</span>
                                <span className="text-sm font-bold text-slate-900">{funnel.surveyBooked}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-primary-500 h-2 rounded-full opacity-80" style={{ width: `${funnel.surveyBookedPercent}%` }}></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600">Quotes</span>
                                <span className="text-sm font-bold text-slate-900">{funnel.quoteSent}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-primary-500 h-2 rounded-full opacity-60" style={{ width: `${funnel.quoteSentPercent}%` }}></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600">Accepted</span>
                                <span className="text-sm font-bold text-slate-900">{funnel.quoteAccepted}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${funnel.quoteAcceptedPercent}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-slate-900">Method Breakdown</h2>
                        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
                    </div>
                    <div className="p-6 flex items-center justify-center h-64 text-slate-400">
                        Charts coming soon...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
