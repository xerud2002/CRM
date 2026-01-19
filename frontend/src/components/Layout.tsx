import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    LayoutDashboard,
    Users,
    Inbox,
    Mail,
    Calendar,
    Phone,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    BarChart3,
    type LucideIcon
} from 'lucide-react';

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    to: string;
    active: boolean;
    badge?: number;
}

const SidebarItem = ({ icon: Icon, label, to, active, badge }: SidebarItemProps) => (
    <Link
        to={to}
        className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors group ${active
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
    >
        <Icon size={20} className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white'} mr-3`} />
        <span className="font-medium text-sm">{label}</span>
        {badge && badge > 0 ? (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {badge > 99 ? '99+' : badge}
            </span>
        ) : active ? (
            <ChevronRight size={16} className="ml-auto" />
        ) : null}
    </Link>
);

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [inboxCount, setInboxCount] = useState(0);

    // Fetch inbox count
    useEffect(() => {
        const fetchInboxCount = async () => {
            try {
                const response = await api.get('/leads/inbox/count');
                setInboxCount(response.data);
            } catch (error) {
                console.error('Failed to fetch inbox count');
            }
        };
        fetchInboxCount();
        const interval = setInterval(fetchInboxCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
        { icon: Inbox, label: 'Inbox', to: '/inbox', badge: inboxCount },
        { icon: Users, label: 'Leads', to: '/leads' },
        { icon: Mail, label: 'Email', to: '/email' },
        { icon: Calendar, label: 'Assessments', to: '/assessments' },
        { icon: FileText, label: 'Quotes', to: '/quotes' },
        { icon: Phone, label: 'Calls', to: '/calls' },
        { icon: BarChart3, label: 'Reports', to: '/reports' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Logo */}
                <div className="flex items-center h-16 px-6 border-b border-slate-800">
                    <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-lg">H</span>
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">Holdem CRM</span>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="ml-auto lg:hidden text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User Profile */}
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center p-3 bg-slate-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-semibold border border-primary-500/30">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.to}
                            icon={item.icon}
                            label={item.label}
                            to={item.to}
                            active={location.pathname === item.to}
                            badge={'badge' in item ? item.badge : undefined}
                        />
                    ))}
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-slate-800 space-y-2">
                    {user?.role === 'admin' && (
                        <SidebarItem icon={Settings} label="Settings" to="/settings" active={location.pathname === '/settings'} />
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                        <LogOut size={20} className="mr-3" />
                        <span className="font-medium text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header (Mobile Only) */}
                <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="text-slate-500 hover:text-slate-700 p-1"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="ml-3 font-semibold text-slate-900">Holdem CRM</span>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="container mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
