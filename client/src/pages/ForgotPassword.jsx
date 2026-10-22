import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, GraduationCap, ExternalLink } from 'lucide-react';
import { Field, ErrorBox, SuccessBox } from '../components/ui';
import api, { errMsg } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [devUrl, setDevUrl] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (e) => { e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try { const { data } = await api.post('/auth/forgot-password', { email }); setSuccess(data.message); if (data.devResetUrl) setDevUrl(data.devResetUrl); }
    catch (err) { setError(errMsg(err)); } finally { setLoading(false); } };
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-card border border-slate-100 px-6 sm:px-10 py-9">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-navy font-medium"><ArrowLeft size={15}/> Back to Login</Link>
        <div className="text-center mt-6 mb-7">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-navy flex items-center justify-center mb-4"><GraduationCap className="text-white" size={30}/></span>
          <h1 className="font-heading text-[26px] font-bold text-navy">Reset Your Password</h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">Enter your email address and we'll send you<br className="hidden sm:block"/> a link to reset your password</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <ErrorBox message={error} /><SuccessBox message={success} />
          {devUrl && <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm"><p className="font-semibold text-navy mb-1">Developer mode — reset link:</p><a href={devUrl} className="text-accent break-all hover:underline inline-flex gap-1 flex-wrap">{devUrl} <ExternalLink size={14}/></a><p className="text-xs text-muted mt-1">In production this link is emailed instead of shown here.</p></div>}
          <Field label="Email Address" icon={Mail} type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
        </form>
        <p className="text-sm text-muted text-center mt-7">Remember your password? <Link to="/login" className="text-accent font-semibold hover:underline">Login</Link></p>
      </div>
    </div>
  );
}
