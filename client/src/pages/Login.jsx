import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Field, ErrorBox } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading={<>Learn Smarter,<br />Not Harder</>}
      subheading="Get instant answers to your academic questions. Upload your documents, and access information anytime, anywhere."
    >
      <div className="w-full min-w-0">
        <h2 className="font-heading text-xl font-bold text-mist sm:text-2xl">Welcome Back</h2>
        <p className="mt-1 mb-4 text-sm text-soft">Sign in to continue to your account</p>
        <form onSubmit={submit} className="w-full min-w-0 space-y-3.5">
          <ErrorBox message={error} />
          <Field
            label="Email Address"
            icon={Mail}
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Field
            label="Password"
            icon={Lock}
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <label className="flex cursor-pointer items-center gap-2 text-soft">
              <input type="checkbox" className="h-4 w-4 shrink-0 accent-[#16A34A]" />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-medium text-glow hover:underline">
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>
        <div className="my-4 flex items-center gap-3">
          <span className="h-px min-w-0 flex-1 bg-line" />
          <span className="shrink-0 text-xs text-soft">or</span>
          <span className="h-px min-w-0 flex-1 bg-line" />
        </div>
        <Link to="/signup" className="btn-outline">Create a new account</Link>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-soft">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </AuthLayout>
  );
}
