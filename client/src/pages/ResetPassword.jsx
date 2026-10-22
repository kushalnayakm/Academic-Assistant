import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, GraduationCap } from 'lucide-react';
import { Field, ErrorBox, SuccessBox } from '../components/ui';
import api, { errMsg } from '../lib/api';

export default function ResetPassword() {
  const { token } = useParams(); const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (e) => { e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true); try { const { data } = await api.post(`/auth/reset-password/${token}`, { password: form.password }); setSuccess(data.message); setTimeout(() => navigate('/login'), 1200); }
    catch (err) { setError(errMsg(err)); } finally { setLoading(false); } };
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-card border border-slate-100 px-6 sm:px-10 py-9">
        <div className="text-center mb-7">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-navy flex items-center justify-center mb-4"><GraduationCap className="text-white" size={30}/></span>
          <h1 className="font-heading text-[26px] font-bold text-navy">Set a New Password</h1>
          <p className="text-sm text-muted mt-2">Choose a strong password you don't use elsewhere.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <ErrorBox message={error} /><SuccessBox message={success} />
          <Field label="New Password" icon={Lock} type="password" required minLength={6} placeholder="Create a password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Field label="Confirm Password" icon={Lock} type="password" required placeholder="Confirm your password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>
        <p className="text-sm text-muted text-center mt-7"><Link to="/login" className="text-accent font-semibold hover:underline">Back to Login</Link></p>
      </div>
    </div>
  );
}
