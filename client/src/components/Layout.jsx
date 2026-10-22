import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Upload, MessageCircleQuestion, Settings, LogOut, Search, Menu, X, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useAuth, initials } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/documents', label: 'My Documents', icon: FolderOpen },
  { to: '/upload', label: 'Upload Document', icon: Upload },
  { to: '/ask', label: 'Ask a Question', icon: MessageCircleQuestion },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <span className="bg-white/10 border border-white/15 rounded-lg p-1.5"><GraduationCap className="text-white" size={22} /></span>
        <span><span className="block text-white font-heading font-bold text-[14px] leading-tight">Academic Assistant</span><span className="block text-[9px] text-blue-200">Your University Info, Simplified</span></span>
      </div>
      <nav className="px-3 space-y-1 flex-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate}
            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition ${isActive ? 'bg-accent text-white shadow' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}`}>
            <Icon size={17} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-1 mb-3">
          <span className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shrink-0">{initials(user?.name)}</span>
          <span className="min-w-0"><span className="block text-white text-[13px] font-semibold truncate">{user?.name}</span><span className="block text-blue-200 text-[11px] truncate">{user?.course || user?.email}</span></span>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 px-3 py-2 text-[13px] text-blue-100/80 hover:text-white transition"><LogOut size={16} /> Logout</button>
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
  const submitSearch = (e) => { e.preventDefault(); navigate(query.trim() ? `/ask?q=${encodeURIComponent(query.trim())}` : '/ask'); };
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:block w-[228px] shrink-0 bg-navy sticky top-0 h-screen"><SidebarContent /></aside>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} /><aside className="absolute left-0 top-0 h-full w-[260px] bg-navy shadow-xl"><button className="absolute right-3 top-4 text-white" onClick={() => setOpen(false)}><X size={20}/></button><SidebarContent onNavigate={() => setOpen(false)} /></aside></div>}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-slate-200/70 px-4 sm:px-7 py-3.5 flex items-center gap-3">
          <button className="lg:hidden text-navy" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <form onSubmit={submitSearch} className="relative flex-1 max-w-xl">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your documents or ask a question..." className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
          </form>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="hidden sm:block text-right"><span className="block text-[13px] font-semibold text-slate-800 leading-tight">{user?.name}</span><span className="block text-[11px] text-muted">{user?.course || 'Student'}</span></span>
            <span className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold">{initials(user?.name)}</span>
          </div>
        </header>
        <main key={location.pathname} className="px-4 sm:px-7 py-6 max-w-[1200px] mx-auto w-full"><Outlet /></main>
        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-navy flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 text-[9px] ${isActive ? 'text-white' : 'text-blue-200/70'}`}><Icon size={19} />{label.split(' ')[0]}</NavLink>
          ))}
        </nav>
        <div className="h-16 lg:hidden" />
      </div>
    </div>
  );
}
