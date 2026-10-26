import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Send, Loader2, FileText, FileType, ChevronDown, ChevronUp, Copy, Check,
  Sparkles, X, Search, Plus, RotateCcw, AlertCircle, BookOpen,
} from 'lucide-react';
import api, { errMsg, errMeta } from '../lib/api';

const SUGGESTED = [
  'What is the attendance criteria?',
  'When is the next exam?',
  'What are the grading components?',
  'Can you explain the syllabus for this course?',
  'What is the exam pattern?',
];

const UNAVAILABLE_MSG =
  'Document content is not available for answering yet. Connect document text extraction and the AI question-answering service to generate an accurate answer.';

function fileIcon(typeOrName) {
  const t = String(typeOrName || '').toUpperCase();
  const ext = t.includes('.') ? t.split('.').pop() : t;
  if (ext === 'PDF') return { Icon: FileText, color: 'text-red-500 bg-red-50' };
  if (ext === 'DOCX' || ext === 'DOC') return { Icon: FileType, color: 'text-sky-600 bg-sky-50' };
  return { Icon: BookOpen, color: 'text-glow bg-leaf' };
}

function statusLabel(status) {
  if (status === 'Processed') return { text: 'Ready', className: 'text-forest' };
  if (status === 'Processing') return { text: 'Processing…', className: 'text-amber-600' };
  if (status === 'Failed') return { text: 'Indexing failed', className: 'text-red-600' };
  return { text: status || 'Unknown', className: 'text-soft' };
}

export default function Ask() {
  const [params] = useSearchParams();
  const [question, setQuestion] = useState(params.get('q') || '');
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryable, setRetryable] = useState(false);
  const [result, setResult] = useState(null);
  const [unavailable, setUnavailable] = useState('');
  const [expandedSources, setExpandedSources] = useState({});
  const [copied, setCopied] = useState(false);
  const pickerRef = useRef(null);
  const askedOnce = useRef(false);
  const askingRef = useRef(false);
  const lastAskRef = useRef({ question: '', documentIds: [] });

  useEffect(() => {
    let cancelled = false;
    setDocsLoading(true);
    setDocsError('');
    api.get('/documents')
      .then(({ data }) => {
        if (cancelled) return;
        setDocuments(data.documents || []);
      })
      .catch((e) => {
        if (cancelled) return;
        setDocuments([]);
        setDocsError(errMsg(e));
      })
      .finally(() => { if (!cancelled) setDocsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selectedDocs = useMemo(
    () => documents.filter((d) => selectedIds.includes(d._id)),
    [documents, selectedIds],
  );
  const readySelected = useMemo(
    () => selectedDocs.filter((d) => d.status === 'Processed'),
    [selectedDocs],
  );

  const filteredDocs = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => d.originalName.toLowerCase().includes(q));
  }, [documents, docSearch]);

  const toggleDoc = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const removeDoc = (id) => setSelectedIds((prev) => prev.filter((x) => x !== id));

  const canSend = question.trim().length > 0 && !loading;

  const ask = async (overrideQuestion) => {
    if (askingRef.current) return;
    const text = (overrideQuestion ?? question).trim();
    if (!text) {
      setError('Type a question first.');
      setRetryable(false);
      return;
    }
    if (!selectedDocs.length) {
      setError('Select at least one document to ask about.');
      setRetryable(false);
      return;
    }

    setQuestion(text);
    setError('');
    setRetryable(false);
    setUnavailable('');
    setResult(null);
    setCopied(false);

    // No invented answers: only ask when selected docs are actually Processed.
    if (!readySelected.length) {
      setUnavailable(UNAVAILABLE_MSG);
      return;
    }

    const documentIds = readySelected.map((d) => d._id);
    lastAskRef.current = { question: text, documentIds };
    askingRef.current = true;
    setLoading(true);
    try {
      const { data } = await api.post('/ask', { question: text, documentIds });
      if (!data.answer?.trim()) {
        setUnavailable(UNAVAILABLE_MSG);
        return;
      }

      // Only genuine citations from the API — never invent filenames, pages, or quotes.
      const citations = (Array.isArray(data.citations) ? data.citations : [])
        .filter((c) => c && (c.fileName || c.quote))
        .map((c) => ({
          fileId: c.fileId || c.documentId || null,
          fileName: c.fileName || 'Uploaded document',
          quote: typeof c.quote === 'string' ? c.quote : '',
          page: c.page || c.pageNumber || null,
        }));

      setResult({
        isLive: true,
        question: text,
        answer: data.answer.trim(),
        citations,
        selectedNames: readySelected.map((d) => d.originalName),
      });
      setExpandedSources(Object.fromEntries(citations.map((_, i) => [i, i === 0])));
    } catch (e) {
      const meta = errMeta(e);
      const msg = meta.message;
      // Missing docs / indexing — not a fake answer path. Quota stays as an error with optional retry.
      if (/no (processed|indexed)|not available|upload a document/i.test(msg) && meta.status !== 429) {
        setUnavailable(UNAVAILABLE_MSG);
      } else {
        setError(msg);
        setRetryable(meta.retryable || meta.status === 429 || meta.status === 503);
      }
    } finally {
      askingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = params.get('q');
    if (q && !askedOnce.current && !docsLoading && documents.length) {
      askedOnce.current = true;
      // Prefill only — do not auto-submit with invented answers.
      setQuestion(q);
    }
  }, [params, docsLoading, documents.length]);

  const copyAnswer = async () => {
    if (!result?.answer) return;
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const newQuestion = () => {
    setResult(null);
    setUnavailable('');
    setQuestion('');
    setError('');
    setRetryable(false);
    setCopied(false);
  };

  return (
    <div className="max-w-4xl mx-auto min-w-0 w-full">
      <div className="mb-5 sm:mb-6">
        <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-mist">Ask a Question</h1>
        <p className="text-sm text-soft mt-1">Get instant answers from your academic documents.</p>
      </div>

      {docsError && (
        <div className="mb-4 flex gap-2 items-start rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>Could not load your documents: {docsError}</span>
        </div>
      )}

      {!docsLoading && !docsError && documents.length === 0 && (
        <div className="mb-4 flex gap-2 items-start rounded-xl border border-line bg-panel px-4 py-3 text-sm text-soft">
          <AlertCircle size={16} className="text-glow shrink-0 mt-0.5" />
          <span>
            You have no uploaded documents yet.{' '}
            <Link to="/upload" className="text-glow underline">Upload a document</Link>
            {' '}first. Answers are never invented from filenames.
          </span>
        </div>
      )}

      <section className="rounded-2xl border border-line bg-white shadow-soft p-4 sm:p-6 min-w-0">
        <div className="relative" ref={pickerRef}>
          <label className="block text-[13px] font-semibold text-mist mb-2">Source documents</label>
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-line bg-panel px-3 sm:px-4 py-3 text-left text-sm text-mist hover:border-glow/50 transition min-h-[44px]"
          >
            <span className="flex items-center gap-2 text-soft min-w-0">
              <Plus size={16} className="text-glow shrink-0" />
              <span className="truncate">
                {selectedDocs.length
                  ? `${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''} selected`
                  : 'Search & select uploaded files…'}
              </span>
            </span>
            <ChevronDown size={16} className={`text-soft shrink-0 transition ${pickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {pickerOpen && (
            <div className="absolute z-20 mt-2 w-full rounded-xl border border-line bg-white shadow-card overflow-hidden">
              <div className="p-2 border-b border-line">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-soft" />
                  <input
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Search by filename…"
                    className="w-full rounded-lg bg-panel border border-line pl-9 pr-3 py-2 text-sm text-mist placeholder:text-soft outline-none focus:border-glow"
                  />
                </div>
              </div>
              <ul className="max-h-56 overflow-y-auto py-1">
                {docsLoading && (
                  <li className="px-4 py-6 text-center text-sm text-soft flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Loading documents…
                  </li>
                )}
                {!docsLoading && filteredDocs.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-soft">
                    No documents match.{' '}
                    <Link to="/upload" className="text-glow underline">Upload one</Link>
                  </li>
                )}
                {filteredDocs.map((d) => {
                  const { Icon, color } = fileIcon(d.fileType);
                  const on = selectedIds.includes(d._id);
                  const st = statusLabel(d.status);
                  return (
                    <li key={d._id}>
                      <button
                        type="button"
                        onClick={() => toggleDoc(d._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                          on ? 'bg-leaf text-mist' : 'text-soft hover:bg-panel hover:text-mist'
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-mist">{d.originalName}</span>
                          <span className="block text-[11px] text-soft">
                            {d.fileType || 'FILE'} · <span className={st.className}>{st.text}</span>
                            {typeof d.chunkCount === 'number' && d.status === 'Processed'
                              ? ` · ${d.chunkCount} chunk${d.chunkCount === 1 ? '' : 's'}`
                              : ''}
                          </span>
                        </span>
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          on ? 'bg-glow border-glow text-white' : 'border-line'
                        }`}>
                          {on ? '✓' : ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {selectedDocs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedDocs.map((d) => {
              const { Icon, color } = fileIcon(d.fileType);
              const st = statusLabel(d.status);
              return (
                <span
                  key={d._id}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-panel pl-2 pr-2 py-1.5 text-xs text-mist max-w-full"
                >
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={12} />
                  </span>
                  <span className="max-w-[120px] sm:max-w-[180px] truncate">{d.originalName}</span>
                  <span className={st.className}>{st.text}</span>
                  <button
                    type="button"
                    onClick={() => removeDoc(d._id)}
                    className="text-soft hover:text-mist p-0.5"
                    aria-label={`Remove ${d.originalName}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {selectedDocs.length > 0 && !readySelected.length && (
          <p className="mt-3 text-xs text-amber-700 bg-sun border border-violet/40 rounded-lg px-3 py-2">
            Selected file(s) are not processed yet, so no document text is available for answering.
          </p>
        )}

        <label className="block text-[13px] font-semibold text-mist mt-5 mb-2">Your question</label>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={1000}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend) ask();
              }
            }}
            placeholder="Ask something that appears in your selected document…"
            className="flex-1 min-w-0 resize-none rounded-xl border border-line bg-panel px-4 py-3 text-sm text-mist placeholder:text-soft/60 outline-none focus:border-glow focus:ring-4 focus:ring-glow/15"
          />
          <button
            type="button"
            onClick={() => ask()}
            disabled={!canSend}
            aria-label="Send question"
            className="shrink-0 self-end sm:self-auto inline-flex items-center justify-center rounded-full w-12 h-12 min-w-[48px] min-h-[48px] bg-glow text-white shadow-glow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-forest transition"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-[11px] text-soft mt-2">Press Enter to ask · Shift + Enter for a new line</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex gap-2 items-start">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
            </div>
            {retryable && (
              <button
                type="button"
                disabled={loading}
                onClick={() => ask(lastAskRef.current.question || question)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <RotateCcw size={13} /> Retry
              </button>
            )}
          </div>
        )}

        <h2 className="text-[13px] font-semibold text-mist mt-6 mb-2">Suggested questions</h2>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setQuestion(s); setError(''); setRetryable(false); setUnavailable(''); }}
              className="rounded-full border border-line bg-panel px-3.5 py-2 text-[12px] text-soft hover:text-mist hover:border-glow/50 transition max-w-full text-left break-content"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <div className="mt-5 rounded-2xl border border-line bg-white px-5 py-8 flex flex-col items-center gap-3 text-soft shadow-soft">
          <Loader2 className="animate-spin text-glow" size={28} />
          <p className="text-sm">Searching your selected documents for an accurate answer…</p>
        </div>
      )}

      {!loading && unavailable && (
        <div className="mt-5 rounded-2xl border border-violet/50 bg-sun px-5 py-6">
          <p className="text-[11px] uppercase tracking-wider text-soft font-semibold mb-2">Your question</p>
          <p className="text-mist font-medium mb-4">{question}</p>
          <div className="flex gap-2 items-start text-sm text-amber-800">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{unavailable}</span>
          </div>
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-mist mb-2 flex items-center gap-2">
              <BookOpen size={16} className="text-glow" /> Sources
            </h2>
            <p className="text-sm text-soft">No verified sources available.</p>
          </div>
        </div>
      )}

      {!loading && !result && !unavailable && (
        <div className="mt-5 rounded-2xl border border-dashed border-line bg-panel px-5 py-10 text-center">
          <Sparkles className="mx-auto text-glow mb-3" size={28} />
          <p className="text-mist font-semibold">Your answer will appear here</p>
          <p className="text-sm text-soft mt-1 max-w-md mx-auto">
            Select a processed document, ask a question, and only real answers from document content will be shown.
          </p>
        </div>
      )}

      {!loading && result && (
        <section className="mt-5 space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-soft font-semibold">Your question</p>
                <p className="text-mist font-medium mt-1">{result.question}</p>
                {result.selectedNames?.length > 0 && (
                  <p className="text-[11px] text-soft mt-1">
                    Asked using: {result.selectedNames.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyAnswer}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-2 text-xs font-medium text-soft hover:text-mist transition"
                >
                  {copied ? <Check size={14} className="text-glow" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy answer'}
                </button>
                <button
                  type="button"
                  onClick={newQuestion}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-2 text-xs font-medium text-soft hover:text-mist transition"
                >
                  <RotateCcw size={14} /> New question
                </button>
              </div>
            </div>

            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-leaf border border-glow/25 px-2.5 py-1 text-[11px] text-forest">
              Live answer from your documents
            </p>

            <div className="text-[14px] sm:text-[15px] leading-relaxed text-mist space-y-3 whitespace-pre-wrap break-content">
              {result.answer}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-mist mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-glow" /> Sources
            </h2>
            {result.citations.length === 0 ? (
              <p className="text-sm text-soft">No verified sources available.</p>
            ) : (
              <ul className="space-y-3">
                {result.citations.map((c, i) => {
                  const open = expandedSources[i];
                  const { Icon, color } = fileIcon(c.fileName);
                  return (
                    <li key={i} className="rounded-xl border border-line bg-white overflow-hidden shadow-soft">
                      <button
                        type="button"
                        onClick={() => setExpandedSources((s) => ({ ...s, [i]: !s[i] }))}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-panel transition"
                      >
                        <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-mist truncate">{c.fileName}</span>
                          <span className="block text-[11px] text-soft">
                            {c.page ? `Page ${c.page}` : (c.quote ? 'Source passage' : 'Cited document')}
                          </span>
                        </span>
                        {c.quote ? (open ? <ChevronUp size={16} className="text-soft" /> : <ChevronDown size={16} className="text-soft" />) : null}
                      </button>
                      {open && c.quote && (
                        <div className="px-4 pb-4">
                          <p className="rounded-lg bg-panel border border-line px-3 py-2.5 text-xs text-soft leading-relaxed">
                            {c.quote}
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
