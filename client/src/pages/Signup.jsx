import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Field, ErrorBox } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib/api';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Join Our Community"
      subheading="Create your account and get access to all features of the Academic Assistant."
      showBooks
    >
      <div className="w-full min-w-0">
        <h2 className="font-heading text-xl font-bold text-mist sm:text-2xl">Create Account</h2>
        <p className="mt-1 mb-4 text-sm text-soft">Start your academic journey with us</p>
        <form onSubmit={submit} className="w-full min-w-0 space-y-3.5">
          <ErrorBox message={error} />
          <Field label="Full Name" icon={User} required autoComplete="name" placeholder="Enter your full name" value={form.name} onChange={set('name')} />
          <Field label="Email Address" icon={Mail} type="email" required autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          <Field label="Password" icon={Lock} type="password" required minLength={6} autoComplete="new-password" placeholder="Create a password" value={form.password} onChange={set('password')} />
          <Field label="Confirm Password" icon={Lock} type="password" required autoComplete="new-password" placeholder="Confirm your password" value={form.confirmPassword} onChange={set('confirmPassword')} />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : <>Sign Up <ArrowRight size={16} /></>}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-soft">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-glow hover:underline">Login</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
