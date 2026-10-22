import { GraduationCap, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function Logo({ light = false, center = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${center ? 'flex-col text-center' : ''}`}>
      <span className="bg-white/10 border border-white/15 rounded-xl p-2 shrink-0"><GraduationCap className="text-white" size={26} /></span>
      <span>
        <span className={`block font-heading font-bold leading-tight ${light ? 'text-white' : 'text-navy'} text-[17px]`}>Academic Assistant</span>
        <span className={`block text-[10px] tracking-wide ${light ? 'text-blue-200' : 'text-muted'}`}>Your University Info, Simplified</span>
      </span>
    </div>
  );
}

export function Field({ label, icon: Icon, type = 'text', ...props }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        <input {...props} type={isPw ? (show ? 'text' : 'password') : type} className="input" style={!Icon ? { paddingLeft: 16 } : undefined} />
        {isPw && <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy">{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button>}
      </div>
    </div>
  );
}

export const Spinner = ({ label = 'Loading...' }) => <span className="inline-flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="animate-spin" />{label}</span>;
export const ErrorBox = ({ message }) => message ? <div className="alert-error"><AlertCircle size={17} className="shrink-0 mt-0.5" /><span>{message}</span></div> : null;
export const SuccessBox = ({ message }) => message ? <div className="alert-success"><CheckCircle2 size={17} className="shrink-0 mt-0.5" /><span>{message}</span></div> : null;

export function StatusBadge({ status }) {
  const styles = { Processed: 'bg-emerald-50 text-emerald-600', Processing: 'bg-amber-50 text-amber-600', Failed: 'bg-red-50 text-red-600' };
  return <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${styles[status] || styles.Processing}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{status}</span>;
}

export function BooksIllustration({ className = 'w-44' }) {
  return (
    <svg viewBox="0 0 220 150" className={className} fill="none" aria-hidden="true">
      <ellipse cx="110" cy="138" rx="82" ry="8" fill="#DBEAFE"/>
      <rect x="52" y="98" width="116" height="20" rx="5" fill="#3B82F6"/>
      <rect x="60" y="78" width="104" height="20" rx="5" fill="#0F2058"/>
      <rect x="72" y="58" width="84" height="20" rx="5" fill="#60A5FA"/>
      <path d="M42 52 L110 22 L178 52 L110 82 Z" fill="#0F2058"/>
      <path d="M76 64 v22 c0 10 68 10 68 0 V64 L110 78 Z" fill="#16296B"/>
      <path d="M172 52 v34" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="172" cy="92" r="5" fill="#F59E0B"/>
      <path d="M168 108 c14-16 30-10 30-10 c-2 16-18 22-30 10Z" fill="#22C55E"/>
      <path d="M168 108 c-4-16 8-24 8-24 c8 12 2 24-8 24Z" fill="#4ADE80"/>
    </svg>
  );
}
