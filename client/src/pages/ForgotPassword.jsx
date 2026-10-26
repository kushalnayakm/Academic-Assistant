import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, GraduationCap, ExternalLink } from 'lucide-react';
import { Field, ErrorBox, SuccessBox } from '../components/ui';
import api, { errMsg } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devUrl, setDevUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(data.message);
      if (data.devResetUrl) setDevUrl(data.devResetUrl);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="box-border flex min-h-dvh w-full items-start justify-center bg-night bg-ask-radial px-4 py-6 sm:items-center sm:px-6 sm:py-8">
      <div className="card box-border w-full min-w-0 max-w-md px-4 py-6 sm:px-7 sm:py-8">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-soft hover:text-mist">
          <ArrowLeft size={15} /> Back to Login
        </Link>
        <div className="mb-5 mt-5 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-glow/20 bg-leaf sm:h-14 sm:w-14">
            <GraduationCap className="text-glow" size={28} />
          </span>
          <h1 className="font-heading text-xl font-bold text-mist sm:text-2xl">Reset Your Password</h1>
          <p className="mt-2 text-sm leading-relaxed text-soft">
            Enter your email and we&apos;ll send a link to reset your password.
          </p>
        </div>
        <form onSubmit={submit} className="w-full min-w-0 space-y-3.5">
          <ErrorBox message={error} />
          <SuccessBox message={success} />
          {devUrl && (
            <div className="break-words rounded-lg border border-line bg-elevated px-3 py-3 text-sm">
              <p className="mb-1 font-semibold text-mist">Developer mode — reset link:</p>
              <a href={devUrl} className="inline break-all text-glow hover:underline">
                {devUrl} <ExternalLink size={14} className="inline" />
              </a>
            </div>
          )}
          <Field label="Email Address" icon={Mail} type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-soft">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-glow hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
