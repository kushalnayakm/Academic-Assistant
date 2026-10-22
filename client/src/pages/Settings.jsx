import { useEffect, useState } from 'react';
import { User, Shield, LogOut, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { useAuth, initials } from '../context/AuthContext';
import { Field, ErrorBox, SuccessBox } from '../components/ui';

export default function Settings() {
  const { user, setUser, logout } = useAuth(); const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ name: user?.name || '', course: user?.course || '', institution: user?.institution || '', email: user?.email || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [saving, setSaving] = useState(false);

  const applyUser = (u) => { setUser(u); setProfile({ name: u.name || '', course: u.course || '', institution: u.institution || '', email: u.email || '' }); };

  // Load the saved profile from the server so the form always matches MongoDB.
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => applyUser(data.user)).catch((err) => setError(errMsg(err)));
  }, []);

  const saveProfile = async (e) => { e.preventDefault(); setError(''); setSuccess(''); setSaving(true);
    try {
      const { name, course, institution } = profile;
      const { data } = await api.put('/auth/profile', { name, course, institution });
      applyUser(data.user); // refresh form + stored user from the saved document
      setSuccess(data.message); // shown only after the backend confirms the save
    } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  const changePassword = async (e) => { e.preventDefault(); setError(''); setSuccess('');
    if (pw.newPassword !== pw.confirmPassword) return setError('New passwords do not match.');
    setSaving(true); try { const { data } = await api.put('/auth/change-password', pw); setSuccess(data.message); setPw({ currentPassword: '', newPassword: '', confirmPassword: '' }); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };

  const tabs = [{ id: 'profile', label: 'Profile', icon: User }, { id: 'security', label: 'Security', icon: Shield }];
  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-navy">Settings</h1>
      <p className="text-sm text-muted mt-0.5 mb-5">Manage your account and preferences</p>
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setTab(id); setError(''); setSuccess(''); }} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${tab===id ? 'bg-navy text-white' : 'bg-white border border-slate-200 text-muted hover:text-navy'}`}><Icon size={16}/>{label}</button>)}
      </div>
      <div className="space-y-4"><ErrorBox message={error}/><SuccessBox message={success}/></div>

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="card p-6 sm:p-7 mt-4">
          <h2 className="font-heading font-bold text-navy mb-5">Profile Information</h2>
          <div className="flex items-center gap-4 mb-6">
            <span className="w-16 h-16 rounded-full bg-navy text-white flex items-center justify-center font-heading font-bold text-lg">{initials(profile.name)}</span>
            <div><p className="font-semibold text-slate-800">{profile.name}</p><p className="text-sm text-muted">{profile.email}</p><p className="text-xs text-muted mt-0.5">Your initials are used as your avatar.</p></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="input-plain" required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your full name"/></div>
            <div><label className="label">Email Address</label><input className="input-plain bg-surface text-muted" value={profile.email} disabled /><p className="text-[11px] text-muted mt-1">Email cannot be changed.</p></div>
            <div><label className="label">Course / Program</label><input className="input-plain" value={profile.course} onChange={(e) => setProfile({ ...profile, course: e.target.value })} placeholder="e.g. BCA Data Science"/></div>
            <div><label className="label">Institution</label><input className="input-plain" value={profile.institution} onChange={(e) => setProfile({ ...profile, institution: e.target.value })} placeholder="e.g. Presidency University"/></div>
          </div>
          <button className="btn-primary mt-6" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      )}

      {tab === 'security' && (
        <div className="space-y-5 mt-4">
          <form onSubmit={changePassword} className="card p-6 sm:p-7">
            <h2 className="font-heading font-bold text-navy mb-1">Change Password</h2>
            <p className="text-sm text-muted mb-5">Use a strong password of at least 6 characters.</p>
            <div className="space-y-4 max-w-md">
              <Field label="Current Password" icon={Lock} type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} placeholder="Enter current password"/>
              <Field label="New Password" icon={Lock} type="password" required minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder="Enter new password"/>
              <Field label="Confirm New Password" icon={Lock} type="password" required value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} placeholder="Confirm new password"/>
            </div>
            <button className="btn-primary mt-6" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</button>
          </form>
          <section className="card p-6 sm:p-7">
            <h2 className="font-heading font-bold text-navy mb-1">Account</h2>
            <p className="text-sm text-muted mb-4">Signed in as {user?.email}. Your documents are private and only visible to you.</p>
            <button onClick={() => { logout(); navigate('/login'); }} className="inline-flex items-center gap-2 border border-red-200 text-red-600 font-semibold rounded-lg px-5 py-3 text-sm hover:bg-red-50 transition"><LogOut size={16}/> Log Out</button>
          </section>
        </div>
      )}
    </div>
  );
}
