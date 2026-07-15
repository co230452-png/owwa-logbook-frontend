import React, { useEffect, useState } from 'react';
import {
  CalendarDays, Download, Search, Trash2, RefreshCw, Pencil, X, Save, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import UserDetailModal from '../../components/admin/UserDetailModal';
import { format } from 'date-fns';

const SLOTS = [
  { key: 'morningIn',    label: '🌅 Morning In',    color: 'text-blue-700'  },
  { key: 'morningOut',   label: '🌅 Morning Out',   color: 'text-blue-500'  },
  { key: 'afternoonIn',  label: '🌇 Afternoon In',  color: 'text-orange-600'},
  { key: 'afternoonOut', label: '🌇 Afternoon Out', color: 'text-orange-500'},
];

const fmt = (d: string | null | undefined) =>
  d ? format(new Date(d), 'h:mm a') : '—';

const toTimeInput = (d: string | null | undefined) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
};

const fmtMins = (mins: number) => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

interface EditModal {
  record: any;
  slots: { key: string; label: string; value: string }[];
}

const AttendanceRecordsPage: React.FC = () => {
  const [records, setRecords]     = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [exporting, setExporting] = useState(false);
  const [editModal, setEditModal]   = useState<EditModal | null>(null);
  const [saving, setSaving]         = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  useEffect(() => { loadRecords(); }, [page]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      const { data } = await attendanceAPI.getAll(params);
      setRecords(data.records);
      setTotal(data.total);
      setPages(data.pages);
    } catch { toast.error('Failed to load records'); }
    finally  { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); loadRecords(); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entire attendance record for the day?')) return;
    try {
      await attendanceAPI.delete(id);
      toast.success('Record deleted');
      loadRecords();
    } catch { toast.error('Failed to delete'); }
  };

  // Open edit modal pre-filled with current times
  const openEdit = (record: any) => {
    setEditModal({
      record,
      slots: SLOTS.map(s => ({
        key:   s.key,
        label: s.label,
        value: toTimeInput(record[s.key]),
      })),
    });
  };

  const updateSlotValue = (key: string, value: string) => {
    setEditModal(prev => prev ? {
      ...prev,
      slots: prev.slots.map(s => s.key === key ? { ...s, value } : s),
    } : null);
  };

  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      let updatedRecord = editModal.record;
      for (const s of editModal.slots) {
        const original = toTimeInput(editModal.record[s.key]);
        if (s.value !== original) {
          const { data } = await attendanceAPI.editSlot(
            editModal.record._id,
            s.key,
            s.value || null
          );
          updatedRecord = data.record;
        }
      }
      toast.success('Attendance updated successfully');
      setEditModal(null);
      // Update the record in the list without full reload
      setRecords(prev => prev.map(r => r._id === updatedRecord._id ? updatedRecord : r));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleClearSlot = async (recordId: string, slot: string, label: string) => {
    if (!confirm(`Clear ${label}? This will remove that time entry.`)) return;
    try {
      const { data } = await attendanceAPI.clearSlot(recordId, slot);
      toast.success(`${label} cleared`);
      setRecords(prev => prev.map(r => r._id === recordId ? data.record : r));
      // Update modal if open
      if (editModal?.record._id === recordId) {
        setEditModal(prev => prev ? {
          ...prev,
          record: data.record,
          slots: prev.slots.map(s => s.key === slot ? { ...s, value: '' } : s),
        } : null);
      }
    } catch { toast.error('Failed to clear slot'); }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params: any = { page: 1, limit: 10000 };
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      const { data } = await attendanceAPI.getAll(params);

      const headers = [
        '#','Full Name','OWWA ID','Email','Phone','Date',
        'Morning In','Morning Out','Afternoon In','Afternoon Out','Total Time',
      ];
      const rows = data.records.map((r: any, i: number) => [
        i + 1,
        `${r.userId?.firstName || ''} ${r.userId?.lastName || ''}`.trim(),
        r.userId?.owwaId || '',
        r.userId?.email  || '',
        r.userId?.phone  || '',
        r.date,
        r.morningIn    ? format(new Date(r.morningIn),    'h:mm a') : '',
        r.morningOut   ? format(new Date(r.morningOut),   'h:mm a') : '',
        r.afternoonIn  ? format(new Date(r.afternoonIn),  'h:mm a') : '',
        r.afternoonOut ? format(new Date(r.afternoonOut), 'h:mm a') : '',
        fmtMins(r.totalMinutes),
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map((c: unknown) => `"${String(c).replace(/"/g,'""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `owwa-attendance-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.records.length} records`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
        <p className="text-gray-500 text-sm mt-1">View, edit, and export all attendance logs</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label text-xs">From Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input text-sm py-2" />
          </div>
          <div>
            <label className="form-label text-xs">To Date</label>
            <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)}   className="form-input text-sm py-2" />
          </div>
          <button onClick={handleSearch} className="btn-primary flex items-center gap-2 py-2">
            <Search className="w-4 h-4" /> Filter
          </button>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setTimeout(loadRecords, 50); }}
              className="btn-secondary text-sm py-2 px-3">Clear</button>
          )}
          <button onClick={handleExportCSV} disabled={exporting || records.length === 0}
            className="btn-success flex items-center gap-2 ml-auto py-2 disabled:opacity-50">
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
          <CalendarDays className="inline w-4 h-4 text-blue-600 mr-1" />
          <span className="font-semibold text-gray-900">{total}</span> total records
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-header">#</th>
                    <th className="table-header">Name</th>
                    <th className="table-header hidden sm:table-cell">OWWA ID</th>
                    <th className="table-header">Date</th>
                    <th className="table-header bg-blue-50 text-blue-700">🌅 AM In</th>
                    <th className="table-header bg-blue-50 text-blue-700">🌅 AM Out</th>
                    <th className="table-header bg-orange-50 text-orange-700">🌇 PM In</th>
                    <th className="table-header bg-orange-50 text-orange-700">🌇 PM Out</th>
                    <th className="table-header bg-green-50 text-green-700">⏱ Total</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r, idx) => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell text-gray-400 text-xs">{(page-1)*25+idx+1}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => r.userId?._id && setDetailUserId(r.userId._id)}
                          className="font-medium text-gray-800 hover:text-blue-700 text-left"
                        >
                          {r.userId?.firstName} {r.userId?.lastName}
                        </button>
                        <div className="text-xs text-gray-400 sm:hidden">{r.userId?.owwaId || ''}</div>
                      </td>
                      <td className="table-cell hidden sm:table-cell text-gray-500">{r.userId?.owwaId || '—'}</td>
                      <td className="table-cell font-medium">{r.date}</td>
                      <td className="table-cell bg-blue-50/40">
                        {r.morningIn    ? <span className="badge-approved">{fmt(r.morningIn)}</span>    : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="table-cell bg-blue-50/40">
                        {r.morningOut   ? <span className="badge-approved">{fmt(r.morningOut)}</span>   : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="table-cell bg-orange-50/40">
                        {r.afternoonIn  ? <span className="badge-approved">{fmt(r.afternoonIn)}</span>  : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="table-cell bg-orange-50/40">
                        {r.afternoonOut ? <span className="badge-approved">{fmt(r.afternoonOut)}</span> : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="table-cell bg-green-50/40">
                        {r.totalMinutes > 0
                          ? <span className="font-semibold text-green-700">{fmtMins(r.totalMinutes)}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(r)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit time slots">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(r._id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete record">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(page-1)*25+1}–{Math.min(page*25, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">← Prev</button>
                  <span className="flex items-center text-sm text-gray-600 px-2">{page} / {pages}</span>
                  <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}
                    className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit Modal ─────────────────────────────────────────── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Edit Attendance</h2>
                <p className="text-sm text-gray-500">
                  {editModal.record.userId?.firstName} {editModal.record.userId?.lastName} — {editModal.record.date}
                </p>
              </div>
              <button onClick={() => setEditModal(null)} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slot editors */}
            <div className="px-6 py-5 space-y-4">
              {editModal.slots.map((s) => (
                <div key={s.key}>
                  <label className="form-label text-xs font-semibold">{s.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={s.value}
                      onChange={e => updateSlotValue(s.key, e.target.value)}
                      className="form-input flex-1 text-sm py-2"
                    />
                    {/* Clear individual slot button */}
                    {(s.value || editModal.record[s.key]) && (
                      <button
                        onClick={() => handleClearSlot(editModal.record._id, s.key, s.label)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title={`Clear ${s.label}`}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                💡 Leave a field blank to clear that time entry. Total time will be recalculated automatically.
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditModal(null)}
                className="flex-1 btn-secondary text-sm py-2.5">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50">
                {saving
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                  : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    {/* User Detail Modal */}
    {detailUserId && (
      <UserDetailModal
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
    )}

    </AdminLayout>
  );
};

export default AttendanceRecordsPage;
