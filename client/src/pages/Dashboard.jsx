import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, FolderOpen, MessageCircleQuestion, Settings, FileText, ChevronRight, Search, ShieldCheck, Zap, Target, Send, HelpCircle } from 'lucide-react';
import api, { errMsg } from '../lib/api';
import { useAuth, formatSize, formatDate } from '../context/AuthContext';
import { BooksIllustration, Spinner, ErrorBox, StatusBadge } from '../components/ui';

const fileColor = (t) =>
  ({
    PDF: 'bg-red-50 text-red-500',
    DOCX: 'bg-sky-50 text-sky-600',
    TXT: 'bg-leaf text-glow',
  }[t] || 'bg-panel text-soft');

const quick = [
  { to: '/upload', icon: Upload, title: 'Upload Document', desc: 'Add your academic files (PDF, DOCX, TXT)', bg: 'bg-leaf text-glow', featured: true },
  { to: '/documents', icon: FolderOpen, title: 'View My Documents', desc: 'Browse your uploaded files', bg: 'bg-sun text-amber-600' },
  { to: '/ask', icon: MessageCircleQuestion, title: 'Ask a Question', desc: 'Get answers from your academic documents', bg: 'bg-leaf text-glow' },
  { to: '/settings', icon: Settings, title: 'Settings', desc: 'Manage your preferences and account', bg: 'bg-sun text-amber-600' },
];

const features = [
  { icon: Upload, title: 'Upload Documents', desc: 'PDF, DOCX, TXT & more', tone: 'bg-sun text-amber-600' },
  { icon: Search, title: 'Search Your Content', desc: 'Find info instantly', tone: 'bg-leaf text-glow' },
  { icon: Target, title: 'Get Accurate Answers', desc: 'With references', tone: 'bg-sun text-amber-600' },
  { icon: Zap, title: 'Save Time & Stay Focused', desc: 'Study smarter', tone: 'bg-leaf text-glow' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');
  useEffect(() => {
    api.get('/documents').then(({ data }) => setDocs(data.documents)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, []);
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] gap-4 sm:gap-5 items-start min-w-0">
      <div className="space-y-4 sm:space-y-5 min-w-0">
        <section className="card p-4 sm:p-6 lg:p-7 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-glow/10 via-transparent to-violet/10 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-soft">Welcome Back,</p>
              <h1 className="font-heading text-[22px] sm:text-[26px] lg:text-3xl font-bold text-mist mt-0.5 break-content">
                {user?.name?.split(' ')[0]}
                <span className="text-glow">!</span>
              </h1>
              <p className="text-sm text-soft mt-2 max-w-md leading-relaxed">
                Get instant answers to your academic questions. Upload your documents, or ask directly — we're here to help!
              </p>
              <div className="flex flex-col xs:flex-row flex-wrap gap-2.5 sm:gap-3 mt-5">
                <Link to="/ask" className="btn-primary !w-full sm:!w-auto justify-center">Ask a Question</Link>
                <Link to="/upload" className="btn-outline !w-full sm:!w-auto justify-center">Upload Document</Link>
              </div>
            </div>
            <BooksIllustration className="w-32 sm:w-40 lg:w-44 max-w-full shrink-0 mx-auto" />
          </div>
          <div className="relative grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-6">
            {features.map(({ icon: Icon, title, desc, tone }) => (
              <div key={title} className="flex gap-2.5 items-start rounded-xl bg-panel border border-line p-3 min-w-0">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-mist leading-tight">{title}</span>
                  <span className="block text-[11px] text-soft mt-0.5">{desc}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0">
          <h2 className="font-heading text-base sm:text-lg font-bold text-mist mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {quick.map(({ to, icon: Icon, title, desc, bg, featured }) => (
              <Link
                key={to}
                to={to}
                className={`card p-4 sm:p-5 hover:-translate-y-0.5 transition min-w-0 ${
                  featured ? 'ring-2 ring-glow/30 shadow-glow-sm bg-leaf/40' : 'hover:border-glow/40'
                }`}
              >
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                  <Icon size={20} />
                </span>
                <span className="block font-semibold text-sm text-mist">{title}</span>
                <span className="block text-xs text-soft mt-1 leading-relaxed">{desc}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card p-4 sm:p-6 min-w-0">
          <h2 className="flex items-center gap-2 font-heading text-base sm:text-lg font-bold text-mist">
            <MessageCircleQuestion className="text-glow shrink-0" size={20} /> Ask a Question
          </h2>
          <p className="text-xs text-soft mt-1 mb-4">Type your question below and get instant answers from your documents.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(question.trim() ? `/ask?q=${encodeURIComponent(question.trim())}` : '/ask');
            }}
            className="flex flex-col sm:flex-row gap-3 sm:items-end"
          >
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              placeholder="e.g. What is the attendance criteria? When is the next exam?"
              className="input-plain resize-none flex-1 min-w-0"
            />
            <button className="btn-accent self-end sm:self-auto" aria-label="Ask question">
              <Send size={18} />
            </button>
          </form>
        </section>
      </div>

      <div className="space-y-4 sm:space-y-5 min-w-0">
        <section className="card p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-heading font-bold text-mist">Recent Documents</h2>
            <Link to="/documents" className="text-xs text-glow font-semibold hover:underline">
              View all
            </Link>
          </div>
          <ErrorBox message={error} />
          {loading ? (
            <Spinner label="Loading documents..." />
          ) : docs.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="mx-auto text-line mb-2" size={32} />
              <p className="text-sm text-soft">No documents yet.</p>
              <Link to="/upload" className="text-sm text-glow font-semibold hover:underline">
                Upload your first document
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {docs.slice(0, 5).map((d) => (
                <li key={d._id}>
                  <Link to="/documents" className="flex items-center gap-3 py-3 group">
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${fileColor(d.fileType)}`}>
                      <FileText size={17} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium text-mist truncate group-hover:text-glow" title={d.originalName}>{d.originalName}</span>
                      <span className="block text-[11px] text-soft">
                        Uploaded {formatDate(d.createdAt)} • {formatSize(d.size)}
                      </span>
                    </span>
                    <StatusBadge status={d.status} />
                    <ChevronRight size={15} className="text-soft" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="hidden xl:block text-center text-[11px] text-soft mt-4 italic">
            Hi {firstName}, better questions, better understanding.
            <br />A smarter you.
          </p>
        </section>

        <section className="card p-4 sm:p-5 min-w-0">
          <h2 className="flex items-center gap-2 font-heading font-bold text-mist mb-3">
            <HelpCircle className="text-glow shrink-0" size={18} /> Need Help?
          </h2>
          <ul className="space-y-2.5 text-[13px] text-soft">
            <li className="flex gap-2">
              <Upload size={15} className="text-glow shrink-0 mt-0.5" /> Upload your academic documents (PDF, DOCX, TXT)
            </li>
            <li className="flex gap-2">
              <MessageCircleQuestion size={15} className="text-glow shrink-0 mt-0.5" /> Ask questions in natural language
            </li>
            <li className="flex gap-2">
              <Target size={15} className="text-glow shrink-0 mt-0.5" /> Get accurate answers with references
            </li>
            <li className="flex gap-2">
              <ShieldCheck size={15} className="text-glow shrink-0 mt-0.5" /> Your data stays private and secure
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
