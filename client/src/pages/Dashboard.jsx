import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, FolderOpen, MessageCircleQuestion, Settings, FileText, ChevronRight, Search, ShieldCheck, Zap, Target, Send, HelpCircle } from 'lucide-react';
import api, { errMsg } from '../lib/api';
import { useAuth, formatSize, formatDate } from '../context/AuthContext';
import { BooksIllustration, Spinner, ErrorBox, StatusBadge } from '../components/ui';

const fileColor = (t) => ({ PDF: 'bg-red-50 text-red-500', DOCX: 'bg-blue-50 text-accent', TXT: 'bg-emerald-50 text-emerald-600' }[t] || 'bg-slate-100 text-slate-500');
const quick = [
  { to: '/upload', icon: Upload, title: 'Upload Document', desc: 'Add your academic files (PDF, DOCX, TXT)', bg: 'bg-blue-50 text-accent' },
  { to: '/documents', icon: FolderOpen, title: 'View My Documents', desc: 'Browse your uploaded files', bg: 'bg-emerald-50 text-emerald-600' },
  { to: '/ask', icon: MessageCircleQuestion, title: 'Ask a Question', desc: 'Get answers from your academic documents', bg: 'bg-violet-50 text-violet-600' },
  { to: '/settings', icon: Settings, title: 'Settings', desc: 'Manage your preferences and account', bg: 'bg-amber-50 text-amber-600' },
];
const features = [
  { icon: Upload, title: 'Upload Documents', desc: 'PDF, DOCX, TXT & more' },
  { icon: Search, title: 'Search Your Content', desc: 'Find info instantly' },
  { icon: Target, title: 'Get Accurate Answers', desc: 'With references' },
  { icon: Zap, title: 'Save Time & Stay Focused', desc: 'Study smarter' },
];

export default function Dashboard() {
  const { user } = useAuth(); const navigate = useNavigate();
  const [docs, setDocs] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [question, setQuestion] = useState('');
  useEffect(() => { api.get('/documents').then(({ data }) => setDocs(data.documents)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false)); }, []);
  const firstName = user?.name?.split(' ')[0] || 'there';
  return (
    <div className="grid xl:grid-cols-[1fr_320px] gap-5 items-start">
      <div className="space-y-5 min-w-0">
        <section className="card p-6 sm:p-7 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted">Welcome Back,</p>
              <h1 className="font-heading text-[26px] sm:text-3xl font-bold text-navy mt-0.5">{user?.name}</h1>
              <p className="text-sm text-muted mt-2 max-w-md leading-relaxed">Get instant answers to your academic questions. Upload your documents, or ask directly — we're here to help!</p>
            </div>
            <BooksIllustration className="w-36 sm:w-44 shrink-0 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-2.5 items-start"><span className="w-9 h-9 rounded-full bg-blue-50 text-accent flex items-center justify-center shrink-0"><Icon size={16}/></span><span><span className="block text-[12px] font-semibold text-slate-800 leading-tight">{title}</span><span className="block text-[11px] text-muted mt-0.5">{desc}</span></span></div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-navy mb-3">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {quick.map(({ to, icon: Icon, title, desc, bg }) => (
              <Link key={to} to={to} className="card p-5 hover:shadow-card hover:-translate-y-0.5 transition">
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${bg}`}><Icon size={20}/></span>
                <span className="block font-semibold text-sm text-slate-800">{title}</span>
                <span className="block text-xs text-muted mt-1 leading-relaxed">{desc}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-navy"><MessageCircleQuestion className="text-accent" size={20}/> Ask a Question</h2>
          <p className="text-xs text-muted mt-1 mb-4">Type your question below and get instant answers from your documents.</p>
          <form onSubmit={(e) => { e.preventDefault(); navigate(question.trim() ? `/ask?q=${encodeURIComponent(question.trim())}` : '/ask'); }} className="flex gap-3 items-end">
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} placeholder="e.g. What is the attendance criteria? When is the next exam?" className="input-plain resize-none flex-1" />
            <button className="btn-accent" aria-label="Ask question"><Send size={18}/></button>
          </form>
        </section>
      </div>

      <div className="space-y-5">
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="font-heading font-bold text-navy">Recent Documents</h2><Link to="/documents" className="text-xs text-accent font-semibold hover:underline">View all</Link></div>
          <ErrorBox message={error} />
          {loading ? <Spinner label="Loading documents..." /> : docs.length === 0 ? (
            <div className="text-center py-6"><FileText className="mx-auto text-slate-300 mb-2" size={32}/><p className="text-sm text-muted">No documents yet.</p><Link to="/upload" className="text-sm text-accent font-semibold hover:underline">Upload your first document</Link></div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {docs.slice(0, 5).map((d) => (
                <li key={d._id}><Link to="/documents" className="flex items-center gap-3 py-3 group">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${fileColor(d.fileType)}`}><FileText size={17}/></span>
                  <span className="flex-1 min-w-0"><span className="block text-[13px] font-medium text-slate-800 truncate group-hover:text-accent">{d.originalName}</span><span className="block text-[11px] text-muted">Uploaded {formatDate(d.createdAt)} • {formatSize(d.size)}</span></span>
                  <StatusBadge status={d.status} /><ChevronRight size={15} className="text-slate-300" />
                </Link></li>
              ))}
            </ul>
          )}
          <p className="hidden xl:block text-center text-[11px] text-muted mt-4 italic">Hi {firstName}, better questions, better understanding.<br/>A smarter you.</p>
        </section>

        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-heading font-bold text-navy mb-3"><HelpCircle className="text-accent" size={18}/> Need Help?</h2>
          <ul className="space-y-2.5 text-[13px] text-muted">
            <li className="flex gap-2"><Upload size={15} className="text-accent shrink-0 mt-0.5"/> Upload your academic documents (PDF, DOCX, TXT)</li>
            <li className="flex gap-2"><MessageCircleQuestion size={15} className="text-accent shrink-0 mt-0.5"/> Ask questions in natural language</li>
            <li className="flex gap-2"><Target size={15} className="text-accent shrink-0 mt-0.5"/> Get accurate answers with references</li>
            <li className="flex gap-2"><ShieldCheck size={15} className="text-accent shrink-0 mt-0.5"/> Your data stays private and secure</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
