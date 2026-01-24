import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Search,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Database,
  Users,
} from 'lucide-react';
import { NetworkStatusBadge, OfflineBanner } from '../ui';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/admin/upload', icon: Upload, label: 'Upload Document' },
  { path: '/admin/documents', icon: FileText, label: 'Documents' },
  { path: '/admin/search', icon: Search, label: 'Vector Search' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOnline, isSyncing } = useNetworkStatus();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('profile_access_token');
    navigate('/login');
  };

  const NavItem = ({ item, mobile = false }) => (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={() => mobile && setMobileMenuOpen(false)}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-xl
        transition-all duration-200 group
        ${isActive
          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
          : 'text-white/60 hover:text-white hover:bg-white/10'
        }
      `}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <AnimatePresence>
        {(sidebarOpen || mobile) && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="font-medium whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 100, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white/5 backdrop-blur-xl border-r border-white/10 z-40"
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-white whitespace-nowrap">
                      DigiMaster<span className="text-violet-400">Ji</span>
                    </h1>
                    {/* Network Status Badge - Desktop Sidebar */}
                    <NetworkStatusBadge variant="minimal" size="sm" />
                  </div>
                  <p className="text-xs text-white/50 whitespace-nowrap">Admin Portal</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Network Status - Collapsed Sidebar */}
        <AnimatePresence>
          {!sidebarOpen && (!isOnline || isSyncing) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 flex justify-center"
            >
              <NetworkStatusBadge variant="minimal" size="md" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => navigate('/profiles')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium whitespace-nowrap overflow-hidden"
                >
                  Switch to User
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium whitespace-nowrap overflow-hidden"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center shadow-lg hover:bg-violet-500 transition-colors"
        >
          <ChevronRight className={`w-4 h-4 text-white transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </motion.aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40">
        {/* Offline Banner */}
        <OfflineBanner />
        
        <div className="h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">
                  DigiMaster<span className="text-violet-400">Ji</span>
                </h1>
                {/* Network Status Badge - Mobile */}
                <NetworkStatusBadge variant="minimal" size="sm" />
              </div>
              <p className="text-xs text-white/50">Admin Portal</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="lg:hidden fixed inset-0 top-16 bg-slate-950/95 backdrop-blur-xl z-30"
          >
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <NavItem key={item.path} item={item} mobile />
              ))}
              <hr className="border-white/10 my-4" />
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/profiles');
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-white/60"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Switch to User</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-rose-400"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 lg:ml-${sidebarOpen ? '[260px]' : '[80px]'} mt-16 lg:mt-0 p-6 relative z-10 transition-all duration-300`}
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (sidebarOpen ? 260 : 80) : 0 }}
      >
        <Outlet />
      </main>
    </div>
  );
}
