import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, MoreVertical, Upload } from 'lucide-react';
import api, { errMsg } from '../lib/api';
import { formatSize, formatDate } from '../context/AuthContext';
import { Spinner, ErrorBox, SuccessBox, StatusBadge } from '../components/ui';

function DocActions({ d, onDelete, deletingId }) {
  return (
    <button
      onClick={() => onDelete(d)}
      disabled={deletingId === d._id}
      className="text-soft hover:text-red-600 disabled:opacity-50 p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
      title="Delete document"
      aria-label={`Delete ${d.originalName}`}
    >
      {deletingId === d._id ? <MoreVertical size={17} className="animate-pulse" /> : <Trash2 size={17} />}
    </button>
  );
}

export function DocumentsTable({ docs, onDelete, deletingId }) {
  if (!docs.length) {
    return (
      <div className="text-center py-10 px-2">
        <FileText className="mx-auto text-line mb-2" size={36} />
        <p className="text-sm text-soft">No documents uploaded yet.</p>
        <Link to="/upload" className="text-sm text-glow font-semibold hover:underline">
          Upload a document
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <ul className="md:hidden space-y-3">
        {docs.map((d) => (
          <li key={d._id} className="rounded-xl border border-line bg-panel/60 p-3.5">
            <div className="flex items-start gap-3 min-w-0">
              <span className="w-10 h-10 rounded-lg bg-leaf text-glow flex items-center justify-center shrink-0">
                <FileText size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-mist break-content">{d.originalName}</p>
                <p className="text-[11px] text-soft mt-0.5">
                  {d.fileType} · {formatSize(d.size)} · {formatDate(d.createdAt)}
                </p>
                {d.status === 'Failed' && d.error && (
                  <p className="text-[11px] text-red-600 mt-1 break-content">{d.error}</p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <StatusBadge status={d.status} />
                  <DocActions d={d} onDelete={onDelete} deletingId={deletingId} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop / tablet table */}
      <div className="hidden md:block overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-soft border-b border-line">
              {['File Name', 'Type', 'Size', 'Uploaded On', 'Status', ''].map((h) => (
                <th key={h || 'actions'} className="py-3 pr-4 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d._id} className="border-b border-line/70 hover:bg-elevated/50 transition">
                <td className="py-3.5 pr-4 max-w-[280px]">
                  <span className="flex items-center gap-2.5 font-medium text-mist min-w-0">
                    <FileText size={16} className="text-glow shrink-0" />
                    <span className="truncate" title={d.originalName}>{d.originalName}</span>
                  </span>
                  {d.status === 'Failed' && d.error && (
                    <span className="block text-[11px] text-red-600 mt-0.5 ml-6 break-content">{d.error}</span>
                  )}
                </td>
                <td className="py-3.5 pr-4 text-soft whitespace-nowrap">{d.fileType}</td>
                <td className="py-3.5 pr-4 text-soft whitespace-nowrap">{formatSize(d.size)}</td>
                <td className="py-3.5 pr-4 text-soft whitespace-nowrap">{formatDate(d.createdAt)}</td>
                <td className="py-3.5 pr-4">
                  <StatusBadge status={d.status} />
                </td>
                <td className="py-3.5 text-right">
                  <DocActions d={d} onDelete={onDelete} deletingId={deletingId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const load = () =>
    api
      .get('/documents')
      .then(({ data }) => setDocs(data.documents))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const remove = async (doc) => {
    if (!confirm(`Delete "${doc.originalName}"? It will no longer be used to answer questions.`)) return;
    setDeletingId(doc._id);
    setError('');
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

  const pdfCount = docs.filter((d) => d.fileType === 'PDF').length;
  const docxCount = docs.filter((d) => d.fileType === 'DOCX').length;
  const otherCount = docs.length - pdfCount - docxCount;

  return (
    <div className="min-w-0">
      <div className="flex flex-col xs:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <h1 className="page-title">My Documents</h1>
          <p className="page-sub">All your uploaded academic files in one place.</p>
        </div>
        <Link to="/upload" className="btn-primary !w-full sm:!w-auto justify-center">
          <Upload size={16} /> Upload
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
        {[
          { label: 'Total Documents', value: docs.length },
          { label: 'PDF Files', value: pdfCount },
          { label: 'DOCX Files', value: docxCount },
          { label: 'Other Files', value: otherCount },
        ].map((s) => (
          <div key={s.label} className="card px-3 sm:px-4 py-3 min-w-0">
            <p className="text-[10px] sm:text-[11px] text-soft uppercase tracking-wide leading-tight">{s.label}</p>
            <p className="text-lg sm:text-xl font-bold text-mist mt-1">{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      <section className="card p-4 sm:p-6 min-w-0">
        <div className="space-y-3 mb-3">
          <ErrorBox message={error} />
          <SuccessBox message={success} />
        </div>
        {loading ? <Spinner label="Loading documents..." /> : <DocumentsTable docs={docs} onDelete={remove} deletingId={deletingId} />}
      </section>
    </div>
  );
}
