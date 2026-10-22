import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, MoreVertical, Upload } from 'lucide-react';
import api, { errMsg } from '../lib/api';
import { formatSize, formatDate } from '../context/AuthContext';
import { Spinner, ErrorBox, SuccessBox, StatusBadge } from '../components/ui';

export function DocumentsTable({ docs, onDelete, deletingId }) {
  if (!docs.length) return <div className="text-center py-10"><FileText className="mx-auto text-slate-300 mb-2" size={36}/><p className="text-sm text-muted">No documents uploaded yet.</p><Link to="/upload" className="text-sm text-accent font-semibold hover:underline">Upload a document</Link></div>;
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full text-sm min-w-[640px]">
        <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-slate-100">{['File Name','Type','Size','Uploaded On','Status',''].map(h => <th key={h} className="py-3 pr-4 font-semibold">{h}</th>)}</tr></thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d._id} className="border-b border-slate-50 hover:bg-bg/60">
              <td className="py-3.5 pr-4"><span className="flex items-center gap-2.5 font-medium text-slate-800"><FileText size={16} className="text-accent shrink-0"/><span className="truncate max-w-[220px]">{d.originalName}</span></span>{d.status==='Failed' && d.error && <span className="block text-[11px] text-red-500 mt-0.5 ml-6">{d.error}</span>}</td>
              <td className="py-3.5 pr-4 text-muted">{d.fileType}</td><td className="py-3.5 pr-4 text-muted">{formatSize(d.size)}</td><td className="py-3.5 pr-4 text-muted">{formatDate(d.createdAt)}</td>
              <td className="py-3.5 pr-4"><StatusBadge status={d.status}/></td>
              <td className="py-3.5 text-right"><button onClick={() => onDelete(d)} disabled={deletingId===d._id} className="text-slate-400 hover:text-red-500 disabled:opacity-50 p-1" title="Delete document">{deletingId===d._id ? <MoreVertical size={17} className="animate-pulse"/> : <Trash2 size={17}/>}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Documents() {
  const [docs, setDocs] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [deletingId, setDeletingId] = useState(null);
  const load = () => api.get('/documents').then(({ data }) => setDocs(data.documents)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const remove = async (doc) => { if (!confirm(`Delete "${doc.originalName}"? It will no longer be used to answer questions.`)) return; setDeletingId(doc._id); setError(''); try { await api.delete(`/documents/${doc._id}`); setDocs(docs.filter(d => d._id !== doc._id)); setSuccess('Document deleted.'); } catch (e) { setError(errMsg(e)); } finally { setDeletingId(null); } };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5"><div className="flex-1"><h1 className="font-heading text-2xl font-bold text-navy">My Documents</h1><p className="text-sm text-muted mt-0.5">All your uploaded academic files in one place.</p></div><Link to="/upload" className="btn-primary !w-auto"><Upload size={16}/> Upload</Link></div>
      <section className="card p-5 sm:p-6"><ErrorBox message={error}/><SuccessBox message={success}/>{loading ? <Spinner label="Loading documents..."/> : <DocumentsTable docs={docs} onDelete={remove} deletingId={deletingId}/>}</section>
    </div>
  );
}
