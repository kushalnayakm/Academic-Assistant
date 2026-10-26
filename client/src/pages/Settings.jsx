import { useEffect, useState } from 'react';
import { User, Shield, LogOut, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { useAuth, initials } from '../context/AuthContext';
import { Field, ErrorBox, SuccessBox } from '../components/ui';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    course: user?.course || '',
    institution: user?.institution || '',
    email: user?.email || '',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const applyUser = (u) => {
    setUser(u);
    setProfile({ name: u.name || '', course: u.course || '', institution: u.institution || '', email: u.email || '' });
  };

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => applyUser(data.user)).catch((err) => setError(errMsg(err)));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { name, course, institution } = profile;
      const { data } = await api.put('/auth/profile', { name, course, institution });
      applyUser(data.user);
      setSuccess(data.message);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (pw.newPassword !== pw.confirmPassword) return setError('New passwords do not match.');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/change-password', pw);
      setSuccess(data.message);
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-3xl min-w-0 w-full">
      <h1 className="page-title">Settings</h1>
      <p className="page-sub mb-5">Manage your account and preferences</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setError('');
              setSuccess('');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition min-h-[44px] ${
              tab === id
                ? 'bg-glow text-white shadow-glow-sm'
                : 'bg-white border border-line text-soft hover:text-mist hover:bg-panel'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <ErrorBox message={error} />
        <SuccessBox message={success} />
      </div>

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="card p-4 sm:p-6 lg:p-7 mt-4 min-w-0">
          <h2 className="font-heading font-bold text-mist mb-5">Profile Information</h2>
          <div className="flex items-center gap-3 sm:gap-4 mb-6 min-w-0">
            <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-glow text-white flex items-center justify-center font-heading font-bold text-lg shrink-0">
              {initials(profile.name)}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-mist truncate">{profile.name}</p>
              <p className="text-sm text-soft truncate">{profile.email}</p>
              <p className="text-xs text-soft mt-0.5">Your initials are used as your avatar.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input-plain"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input-plain bg-elevated text-soft cursor-not-allowed" value={profile.email} disabled />
              <p className="text-[11px] text-soft mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <label className="label">Course / Program</label>
              <input
                className="input-plain"
                value={profile.course}
                onChange={(e) => setProfile({ ...profile, course: e.target.value })}
                placeholder="e.g. BCA Data Science"
              />
            </div>
            <div>
              <label className="label">Institution</label>
              <input
                className="input-plain"
                value={profile.institution}
                onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                placeholder="e.g. Presidency University"
              />
            </div>
          </div>
          <button className="btn-primary mt-6 !w-full sm:!w-auto" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {tab === 'security' && (
        <div className="space-y-5 mt-4 min-w-0">
          <form onSubmit={changePassword} className="card p-4 sm:p-6 lg:p-7 min-w-0">
            <h2 className="font-heading font-bold text-mist mb-1">Change Password</h2>
            <p className="text-sm text-soft mb-5">Use a strong password of at least 6 characters.</p>
            <div className="space-y-4 max-w-md">
              <Field
                label="Current Password"
                icon={Lock}
                type="password"
                required
                value={pw.currentPassword}
                onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
              <Field
                label="New Password"
                icon={Lock}
                type="password"
                required
                minLength={6}
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
              <Field
                label="Confirm New Password"
                icon={Lock}
                type="password"
                required
                value={pw.confirmPassword}
                onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
            <button className="btn-primary mt-6 !w-full sm:!w-auto" disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
          <section className="card p-4 sm:p-6 lg:p-7 min-w-0">
            <h2 className="font-heading font-bold text-mist mb-1">Account</h2>
            <p className="text-sm text-soft mb-4 break-content">Signed in as {user?.email}. Your documents are private and only visible to you.</p>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 font-semibold rounded-xl px-5 py-3 text-sm hover:bg-red-50 transition min-h-[44px] w-full sm:w-auto"
            >
              <LogOut size={16} /> Log Out
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
