import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, GraduationCap } from 'lucide-react';
import { Field, ErrorBox, SuccessBox } from '../components/ui';
import api, { errMsg } from '../lib/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password: form.password });
      setSuccess(data.message);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="box-border flex min-h-dvh w-full items-start justify-center bg-night bg-ask-radial px-4 py-6 sm:items-center sm:px-6 sm:py-8">
      <div className="card box-border w-full min-w-0 max-w-md px-4 py-6 sm:px-7 sm:py-8">
        <div className="mb-5 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-glow/20 bg-leaf sm:h-14 sm:w-14">
            <GraduationCap className="text-glow" size={28} />
          </span>
          <h1 className="font-heading text-xl font-bold text-mist sm:text-2xl">Set a New Password</h1>
          <p className="mt-2 text-sm text-soft">Choose a strong password you don&apos;t use elsewhere.</p>
        </div>
        <form onSubmit={submit} className="w-full min-w-0 space-y-3.5">
          <ErrorBox message={error} />
          <SuccessBox message={success} />
          <Field label="New Password" icon={Lock} type="password" required minLength={6} placeholder="Create a password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Field label="Confirm Password" icon={Lock} type="password" required placeholder="Confirm your password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-soft">
          <Link to="/login" className="font-semibold text-glow hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
