import { GraduationCap, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function Logo({ light = false, center = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${center ? 'flex-col text-center' : ''}`}>
      <span className="bg-leaf border border-glow/20 rounded-xl p-2 shrink-0">
        <GraduationCap className={light ? 'text-white' : 'text-glow'} size={26} />
      </span>
      <span>
        <span className={`block font-heading font-bold leading-tight text-[17px] ${light ? 'text-white' : 'text-mist'}`}>
          Academic Assistant
        </span>
        <span className={`block text-[10px] tracking-wide ${light ? 'text-white/80' : 'text-soft'}`}>
          Your University Info, Simplified
        </span>
      </span>
    </div>
  );
}

export function Field({ label, icon: Icon, type = 'text', ...props }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <div className="w-full min-w-0">
      {label && <label className="label">{label}</label>}
      <div className="relative w-full min-w-0">
        {Icon && <Icon size={17} className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-soft" />}
        <input
          {...props}
          type={isPw ? (show ? 'text' : 'password') : type}
          className="input"
          style={!Icon ? { paddingLeft: 16 } : undefined}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center text-soft hover:text-mist"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
    </div>
  );
}

export const Spinner = ({ label = 'Loading...' }) => (
  <span className="inline-flex items-center gap-2 text-sm text-soft">
    <Loader2 size={16} className="animate-spin text-glow" />
    {label}
  </span>
);
export const ErrorBox = ({ message }) =>
  message ? (
    <div className="alert-error">
      <AlertCircle size={17} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  ) : null;
export const SuccessBox = ({ message }) =>
  message ? (
    <div className="alert-success">
      <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  ) : null;

export function StatusBadge({ status }) {
  const styles = {
    Processed: 'bg-leaf text-forest border border-glow/25',
    Processing: 'bg-sun text-amber-700 border border-violet/40',
    Failed: 'bg-red-50 text-red-600 border border-red-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${styles[status] || styles.Processing}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function BooksIllustration({ className = 'w-44' }) {
  return (
    <svg viewBox="0 0 220 150" className={className} fill="none" aria-hidden="true">
      <ellipse cx="110" cy="138" rx="82" ry="8" fill="#DCFCE7" />
      <path d="M18 120c20-28 38-20 48-8 8-22 28-28 40-12 14-18 36-14 44 4 10-16 30-14 42 6" stroke="#86EFAC" strokeWidth="10" strokeLinecap="round" opacity=".55" />
      <path d="M150 118c16-22 34-18 44-4" stroke="#FDE68A" strokeWidth="10" strokeLinecap="round" opacity=".7" />
      <rect x="52" y="98" width="116" height="20" rx="5" fill="#16A34A" />
      <rect x="60" y="78" width="104" height="20" rx="5" fill="#22C55E" />
      <rect x="72" y="58" width="84" height="20" rx="5" fill="#FACC15" />
      <path d="M42 52 L110 22 L178 52 L110 82 Z" fill="#087F43" />
      <path d="M76 64 v22 c0 10 68 10 68 0 V64 L110 78 Z" fill="#14532D" />
      <path d="M110 22 v60" stroke="#DCFCE7" strokeWidth="1.5" />
      <circle cx="168" cy="48" r="10" fill="#FEF9C3" opacity=".9" />
    </svg>
  );
}
