import { useEffect, useRef, useState } from 'react';
import { CloudUpload, Loader2 } from 'lucide-react';
import api, { errMsg } from '../lib/api';
import { Spinner, ErrorBox, SuccessBox } from '../components/ui';
import { DocumentsTable } from './Documents';

const ACCEPTED = ['pdf', 'docx', 'txt'];
export default function Upload() {
  const [docs, setDocs] = useState([]); const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); const [drag, setDrag] = useState(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef(null);
  const load = () => api.get('/documents').then(({ data }) => setDocs(data.documents)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const uploadFile = async (file) => {
    setError(''); setSuccess('');
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) return setError('Invalid file type. Please upload a PDF, DOCX or TXT file.');
    if (file.size > 10 * 1024 * 1024) return setError('File is too large. Maximum size is 10 MB.');
    setUploading(true);
    try {
      const form = new FormData(); form.append('file', file);
      const { data } = await api.post('/documents', form);
      setDocs((prev) => [data.document, ...prev]);
      setSuccess(`"${file.name}" uploaded and processed. You can now ask questions about it.`);
    } catch (e) { setError(errMsg(e)); load(); } finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  };
  const remove = async (doc) => { if (!confirm(`Delete "${doc.originalName}"?`)) return; setDeletingId(doc._id); try { await api.delete(`/documents/${doc._id}`); setDocs(docs.filter(d => d._id !== doc._id)); setSuccess('Document deleted.'); } catch (e) { setError(errMsg(e)); } finally { setDeletingId(null); } };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">Upload Document</h1>
      <p className="text-sm text-muted mt-0.5 mb-5">Add your academic files to get started.</p>
      <div className="space-y-4 mb-6"><ErrorBox message={error}/><SuccessBox message={success}/></div>

      <div onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); uploadFile(e.dataTransfer.files[0]); }}
        className={`bg-white border-2 border-dashed rounded-2xl px-6 py-14 text-center cursor-pointer transition ${drag ? 'border-accent bg-blue-50/60' : 'border-slate-200 hover:border-accent/60 hover:bg-bg/60'}`}>
        <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => uploadFile(e.target.files[0])} />
        {uploading ? <Loader2 size={44} className="mx-auto text-accent animate-spin" /> : <CloudUpload size={44} className="mx-auto text-accent" />}
        <p className="font-semibold text-slate-800 mt-4">{uploading ? 'Uploading & indexing your document...' : <>Drag & drop your file here<br/><span className="text-accent">or click to browse</span></>}</p>
        <p className="text-xs text-muted mt-2">Supported formats: PDF, DOCX, TXT<br/>Max file size: 10 MB</p>
      </div>

      <h2 className="font-heading text-lg font-bold text-navy mt-8 mb-3">Uploaded Files</h2>
      <section className="card p-5 sm:p-6">{loading ? <Spinner label="Loading documents..."/> : <DocumentsTable docs={docs} onDelete={remove} deletingId={deletingId}/>}</section>
    </div>
  );
}
