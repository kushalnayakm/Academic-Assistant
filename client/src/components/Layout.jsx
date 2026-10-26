import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Upload, MessageCircleQuestion, Settings, LogOut, Search, Menu, X, GraduationCap, Bell } from 'lucide-react';
import { useState } from 'react';
import { useAuth, initials } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/documents', label: 'My Documents', icon: FolderOpen },
  { to: '/upload', label: 'Upload Document', icon: Upload },
  { to: '/ask', label: 'Ask a Question', icon: MessageCircleQuestion },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ onNavigate, compact = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full bg-white border-r border-line min-w-0">
      <div className={`pt-6 pb-5 flex items-center gap-2.5 min-w-0 ${compact ? 'px-3' : 'px-5'}`}>
        <span className="bg-leaf rounded-xl p-2 shrink-0">
          <GraduationCap className="text-glow" size={22} />
        </span>
        <span className="min-w-0">
          <span className="block text-mist font-heading font-bold text-[13px] lg:text-[14px] leading-tight truncate">Academic Assistant</span>
          <span className="block text-[9px] text-soft truncate">Your University Info, Simplified</span>
        </span>
      </div>
      <nav className={`space-y-1 flex-1 min-w-0 ${compact ? 'px-2' : 'px-3'}`}>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            title={label}
            className={({ isActive }) =>
              `flex items-center gap-2.5 lg:gap-3 px-2.5 lg:px-3.5 py-2.5 rounded-xl text-[12px] lg:text-[13px] font-medium transition border-l-[3px] min-w-0 ${
                isActive
                  ? 'bg-leaf text-forest border-glow'
                  : 'text-soft border-transparent hover:bg-panel hover:text-mist'
              }`
            }
          >
            <Icon size={17} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={`border-t border-line min-w-0 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-2.5 px-1 mb-3 min-w-0">
          <span className="w-10 h-10 rounded-full bg-glow text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials(user?.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-mist text-[13px] font-semibold truncate">{user?.name}</span>
            <span className="block text-soft text-[11px] truncate">{user?.course || user?.email}</span>
          </span>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-soft hover:text-mist transition min-h-[44px] w-full"
        >
          <LogOut size={16} className="shrink-0" /> Logout
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/ask?q=${encodeURIComponent(query.trim())}` : '/ask');
  };

  return (
    <div className="min-h-screen md:flex bg-night text-mist bg-leaf-shape overflow-x-hidden">
      <aside className="hidden md:block w-[200px] lg:w-[240px] shrink-0 sticky top-0 h-screen">
        <SidebarContent compact />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[min(270px,85vw)] shadow-card bg-white">
            <button type="button" className="absolute right-3 top-4 text-soft z-10 p-1" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={20} />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col max-w-full">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-line px-3 sm:px-5 lg:px-7 py-3 flex items-center gap-2 sm:gap-3">
          <button type="button" className="md:hidden text-mist p-1.5 -ml-1 shrink-0" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <form onSubmit={submitSearch} className="relative flex-1 min-w-0 max-w-xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-soft pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or ask…"
              className="w-full bg-panel border border-line rounded-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 text-sm text-mist placeholder:text-soft outline-none focus:border-glow focus:ring-4 focus:ring-glow/15 min-h-[44px]"
            />
          </form>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              className="inline-flex w-10 h-10 items-center justify-center rounded-full border border-line bg-white text-soft hover:text-mist hover:border-glow/40 transition"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>
            <span className="hidden sm:block text-right max-w-[120px] lg:max-w-[160px]">
              <span className="block text-[13px] font-semibold text-mist leading-tight truncate">{user?.name}</span>
              <span className="block text-[11px] text-soft truncate">{user?.course || 'Student'}</span>
            </span>
            <span className="w-10 h-10 rounded-full bg-glow text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initials(user?.name)}
            </span>
          </div>
        </header>

        <main key={location.pathname} className="px-3 sm:px-5 lg:px-7 py-4 sm:py-6 max-w-[1200px] mx-auto w-full flex-1 min-w-0">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line flex justify-around py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-1 min-w-0 flex-1 min-h-[48px] text-[9px] ${isActive ? 'text-glow' : 'text-soft'}`
              }
            >
              <Icon size={18} />
              <span className="truncate max-w-full px-0.5">{label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
        <div className="h-16 md:hidden shrink-0" />
      </div>
    </div>
  );
}
