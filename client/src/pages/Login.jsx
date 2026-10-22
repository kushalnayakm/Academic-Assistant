import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Field, ErrorBox } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const { login } = useAuth(); const navigate = useNavigate();
  const submit = async (e) => { e.preventDefault(); setError(''); setLoading(true); try { await login(form.email, form.password); navigate('/'); } catch (err) { setError(errMsg(err)); } finally { setLoading(false); } };
  return (
    <AuthLayout heading={<>Learn Smarter,<br/>Not Harder</>} subheading="Get instant answers to your academic questions. Upload your documents, and access information anytime, anywhere.">
      <h2 className="font-heading text-[26px] font-bold text-navy">Welcome Back</h2>
      <p className="text-sm text-muted mt-1 mb-6">Sign in to continue to your account</p>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Email Address" icon={Mail} type="email" required placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label="Password" icon={Lock} type="password" required placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="flex items-center justify-between text-[13px]">
          <label className="flex items-center gap-2 text-muted cursor-pointer"><input type="checkbox" className="accent-[#3B82F6] w-4 h-4" /> Remember me</label>
          <Link to="/forgot-password" className="text-accent font-medium hover:underline">Forgot password?</Link>
        </div>
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in...' : <>Sign In <ArrowRight size={16} /></>}</button>
      </form>
      <div className="flex items-center gap-3 my-5"><span className="h-px bg-slate-200 flex-1"/><span className="text-xs text-muted">or</span><span className="h-px bg-slate-200 flex-1"/></div>
      <Link to="/signup" className="btn-outline">Create a new account</Link>
      <p className="text-[11px] text-muted text-center mt-6">By continuing, you agree to our Terms of Service<br/>and Privacy Policy.</p>
    </AuthLayout>
  );
}
