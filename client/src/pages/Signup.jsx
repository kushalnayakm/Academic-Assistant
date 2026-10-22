import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Field, ErrorBox } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib/api';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const { register } = useAuth(); const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => { e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true); try { await register(form); navigate('/'); } catch (err) { setError(errMsg(err)); } finally { setLoading(false); } };
  return (
    <AuthLayout heading="Join Our Community" subheading="Create your account and get access to all features of the Academic Assistant." showBooks>
      <h2 className="font-heading text-[26px] font-bold text-navy">Create Account</h2>
      <p className="text-sm text-muted mt-1 mb-6">Start your academic journey with us</p>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Full Name" icon={User} required placeholder="John Doe" value={form.name} onChange={set('name')} />
        <Field label="Email Address" icon={Mail} type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} />
        <Field label="Password" icon={Lock} type="password" required minLength={6} placeholder="Create a password" value={form.password} onChange={set('password')} />
        <Field label="Confirm Password" icon={Lock} type="password" required placeholder="Confirm your password" value={form.confirmPassword} onChange={set('confirmPassword')} />
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Creating account...' : <>Sign Up <ArrowRight size={16} /></>}</button>
      </form>
      <p className="text-sm text-muted text-center mt-6">Already have an account? <Link to="/login" className="text-accent font-semibold hover:underline">Login</Link></p>
    </AuthLayout>
  );
}
