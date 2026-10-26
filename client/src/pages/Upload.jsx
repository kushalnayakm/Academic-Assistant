import { useEffect, useRef, useState } from 'react';
import { CloudUpload, Loader2, CheckCircle2 } from 'lucide-react';
import api, { errMsg, errMeta } from '../lib/api';
import { Spinner, ErrorBox, SuccessBox } from '../components/ui';
import { DocumentsTable } from './Documents';

const ACCEPTED = ['pdf', 'docx', 'txt'];

export default function Upload() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef(null);
  const uploadingRef = useRef(false);
  const load = () =>
    api
      .get('/documents')
      .then(({ data }) => setDocs(data.documents))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const uploadFile = async (file) => {
    if (uploadingRef.current) return;
    setError('');
    setSuccess('');
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) return setError('Invalid file type. Please upload a PDF, DOCX or TXT file.');
    if (file.size > 10 * 1024 * 1024) return setError('File is too large. Maximum size is 10 MB.');
    uploadingRef.current = true;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/documents', form);
      const doc = data.document;
      if (!doc || doc.status !== 'Processed') {
        setError(data.message || `"${file.name}" was uploaded but indexing did not complete. It is not ready for questions.`);
        if (doc) setDocs((prev) => [doc, ...prev.filter((d) => d._id !== doc._id)]);
        else load();
        return;
      }
      setDocs((prev) => [doc, ...prev]);
      setSuccess(`"${file.name}" uploaded and processed. You can now ask questions about it.`);
    } catch (e) {
      const meta = errMeta(e);
      const failedDoc = e.response?.data?.document;
      if (failedDoc) {
        setDocs((prev) => [failedDoc, ...prev.filter((d) => d._id !== failedDoc._id)]);
      } else {
        load();
      }
      setError(meta.message || errMsg(e));
      setSuccess('');
    } finally {
      uploadingRef.current = false;
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (doc) => {
    if (!confirm(`Delete "${doc.originalName}"?`)) return;
    setDeletingId(doc._id);
    try {
      await api.delete(`/documents/${doc._id}`);
      setDocs(docs.filter((d) => d._id !== doc._id));
      setSuccess('Document deleted.');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-w-0">
      <h1 className="page-title">Upload Document</h1>
      <p className="page-sub mb-5">Add your academic files to get started.</p>
      <div className="space-y-3 mb-5">
        <ErrorBox message={error} />
        <SuccessBox message={success} />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] gap-4 sm:gap-5 items-start">
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            uploadFile(e.dataTransfer.files[0]);
          }}
          className={`card border-2 border-dashed px-4 sm:px-6 py-10 sm:py-14 text-center cursor-pointer transition min-w-0 touch-manipulation ${
            drag ? 'border-glow bg-leaf shadow-glow-sm' : 'border-glow/50 hover:border-glow hover:bg-leaf/50'
          }`}
        >
          <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => uploadFile(e.target.files[0])} />
          {uploading ? (
            <Loader2 size={44} className="mx-auto text-glow animate-spin" />
          ) : (
            <CloudUpload size={44} className="mx-auto text-glow" />
          )}
          <p className="font-semibold text-mist mt-4">
            {uploading ? (
              'Uploading & indexing your document...'
            ) : (
              <>
                Drag & drop your file here
                <br />
                <span className="text-glow">or click to browse</span>
              </>
            )}
          </p>
          <p className="text-xs text-soft mt-2">
            Supported formats: PDF, DOCX, TXT
            <br />
            Max file size: 10 MB
          </p>
          {!uploading && (
            <span className="inline-flex mt-5 btn-primary !w-auto pointer-events-none">Choose Files</span>
          )}
        </div>

        <aside className="card p-5">
          <h2 className="font-heading font-bold text-mist mb-3">Why Upload?</h2>
          <ul className="space-y-3 text-sm text-soft">
            {[
              'Ground answers in your own notes and handbooks',
              'Keep sources private to your account',
              'Ask follow-up questions anytime',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <CheckCircle2 size={16} className="text-glow shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <h2 className="font-heading text-base sm:text-lg font-bold text-mist mt-8 mb-3">Uploaded Files</h2>
      <section className="card p-4 sm:p-6 min-w-0">
        {loading ? <Spinner label="Loading documents..." /> : <DocumentsTable docs={docs} onDelete={remove} deletingId={deletingId} />}
      </section>
    </div>
  );
}
