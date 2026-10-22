import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Send, Loader2, FileText, Quote } from 'lucide-react';
import api, { errMsg } from '../lib/api';
import { ErrorBox } from '../components/ui';

const SUGGESTED = ['What is the attendance criteria?', 'When is the next exam?', 'What are the grading components?', 'Can you explain the syllabus for this course?', 'What is the exam pattern?'];

export default function Ask() {
  const [params] = useSearchParams();
  const [question, setQuestion] = useState(params.get('q') || '');
  const [answer, setAnswer] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const [docCount, setDocCount] = useState(null);
  const askedOnce = useRef(false);
  useEffect(() => { api.get('/documents').then(({ data }) => setDocCount(data.documents.filter(d => d.status === 'Processed').length)).catch(() => setDocCount(0)); }, []);

  const ask = async (q) => {
    const text = (q ?? question).trim();
    if (!text) return setError('Type a question first.');
    setQuestion(text); setError(''); setLoading(true); setAnswer(null);
    try { const { data } = await api.post('/ask', { question: text }); setAnswer(data); }
    catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
  };
  useEffect(() => { const q = params.get('q'); if (q && !askedOnce.current) { askedOnce.current = true; ask(q); } }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-navy">Ask a Question</h1>
      <p className="text-sm text-muted mt-0.5 mb-5">Get instant answers from your uploaded documents.</p>

      {docCount === 0 && <div className="alert-error mb-5">You have no processed documents yet. <Link to="/upload" className="font-semibold underline ml-1">Upload a document first</Link></div>}

      <section className="card p-5 sm:p-6">
        <label className="label">Type your question here...</label>
        <div className="flex gap-3 items-end">
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} maxLength={1000}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
            placeholder="e.g. What is the attendance criteria?" className="input-plain resize-none flex-1" />
          <button onClick={() => ask()} disabled={loading} className="btn-accent" aria-label="Send question">{loading ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}</button>
        </div>
        <p className="text-[11px] text-muted mt-2">Press Enter to ask, Shift + Enter for a new line.</p>
        <div className="mt-5"><ErrorBox message={error}/></div>

        {loading && <div className="mt-6 flex items-center gap-3 text-sm text-muted"><Loader2 className="animate-spin text-accent" size={18}/> Searching your documents and preparing an answer...</div>}

        {answer && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Answer</h2>
            <div className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{answer.answer}</div>
            {answer.citations?.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Sources</h3>
                <ul className="space-y-2">{answer.citations.map((c, i) => (
                  <li key={i} className="flex gap-3 bg-bg rounded-xl px-4 py-3">
                    <FileText size={17} className="text-accent shrink-0 mt-0.5"/>
                    <span><span className="block text-sm font-semibold text-navy">{c.fileName}</span>{c.quote && <span className="flex gap-1.5 text-xs text-muted mt-1 leading-relaxed"><Quote size={12} className="shrink-0 mt-0.5"/>{c.quote}</span>}</span>
                  </li>))}
                </ul>
              </div>
            ) : <p className="text-xs text-muted mt-4">No specific source citation was returned for this answer.</p>}
          </div>
        )}
      </section>

      <h2 className="text-sm font-semibold text-slate-700 mt-7 mb-3">Suggested Questions</h2>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED.map((s) => <button key={s} onClick={() => ask(s)} disabled={loading} className="bg-white border border-slate-200 hover:border-accent hover:text-accent rounded-full px-4 py-2 text-[13px] text-slate-600 transition disabled:opacity-60">{s}</button>)}
      </div>
    </div>
  );
}
