import React, { useEffect, useState } from 'react';
import {
  X, User, Mail, Phone, CreditCard, MapPin,
  CalendarDays, Clock, CheckCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { usersAPI, attendanceAPI } from '../../utils/api';
import { format } from 'date-fns';

interface Props {
  userId: string;
  onClose: () => void;
}

const fmt = (d: string | null | undefined) =>
  d ? format(new Date(d), 'h:mm a') : '—';

const fmtMins = (mins: number) => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const statusBadge = (status: string) => {
  if (status === 'approved') return <span className="badge-approved">Approved</span>;
  if (status === 'pending')  return <span className="badge-pending">Pending</span>;
  return <span className="badge-rejected">Rejected</span>;
};

const UserDetailModal: React.FC<Props> = ({ userId, onClose }) => {
  const [user, setUser]             = useState<any>(null);
  const [records, setRecords]       = useState<any[]>([]);
  const [loadingUser, setLoadingUser]     = useState(true);
  const [loadingAttend, setLoadingAttend] = useState(true);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);
  const [expanded, setExpanded]     = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, [userId]);

  useEffect(() => {
    loadAttendance();
  }, [userId, page]);

  const loadUser = async () => {
    setLoadingUser(true);
    try {
      const { data } = await usersAPI.getById(userId);
      setUser(data);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadAttendance = async () => {
    setLoadingAttend(true);
    try {
      const { data } = await attendanceAPI.getAll({ userId, page, limit: 10 });
      setRecords(data.records);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoadingAttend(false);
    }
  };

  const totalMinutesAll = records.reduce((s, r) => s + (r.totalMinutes || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Member Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────── */}
        <div className="overflow-y-auto flex-1 scrollbar-thin">

          {/* Profile section */}
          {loadingUser ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : user && (
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-bold">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {user.firstName} {user.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {statusBadge(user.status)}
                    <span className="text-xs text-gray-400">
                      Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{user.phone}</span>
                </div>
                {user.owwaId && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{user.owwaId}</span>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{user.address}</span>
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-blue-800">{total}</div>
                  <div className="text-xs text-blue-600 mt-0.5">Days Attended</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-green-700">{fmtMins(totalMinutesAll)}</div>
                  <div className="text-xs text-green-600 mt-0.5">Total Time</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-purple-700">{user.attendanceCount ?? total}</div>
                  <div className="text-xs text-purple-600 mt-0.5">Total Records</div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Records */}
          <div className="px-6 py-5">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-700" />
              Attendance History
              {total > 0 && (
                <span className="text-xs text-gray-400 font-normal">({total} records)</span>
              )}
            </h4>

            {loadingAttend ? (
              <div className="flex items-center justify-center h-24">
                <div className="w-7 h-7 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No attendance records yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((r) => {
                  const isOpen = expanded === r._id;
                  return (
                    <div
                      key={r._id}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      {/* Row header — click to expand */}
                      <button
                        onClick={() => setExpanded(isOpen ? null : r._id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {format(new Date(r.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {r.totalMinutes > 0
                                ? `⏱ ${fmtMins(r.totalMinutes)} total`
                                : 'Incomplete'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Mini slot indicators */}
                          <div className="hidden sm:flex items-center gap-1">
                            {[
                              { key: 'morningIn',    label: 'AM In',  color: 'bg-blue-500'   },
                              { key: 'morningOut',   label: 'AM Out', color: 'bg-blue-300'   },
                              { key: 'afternoonIn',  label: 'PM In',  color: 'bg-orange-500' },
                              { key: 'afternoonOut', label: 'PM Out', color: 'bg-orange-300' },
                            ].map(s => (
                              <div
                                key={s.key}
                                title={s.label}
                                className={`w-2 h-2 rounded-full ${r[s.key] ? s.color : 'bg-gray-200'}`}
                              />
                            ))}
                          </div>
                          {isOpen
                            ? <ChevronUp   className="w-4 h-4 text-gray-400" />
                            : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                          <div className="grid grid-cols-2 gap-3">
                            {/* Morning */}
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
                                🌅 Morning
                              </p>
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 text-xs">Time In</span>
                                  <span className={`font-semibold ${r.morningIn ? 'text-blue-700' : 'text-gray-300'}`}>
                                    {fmt(r.morningIn)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 text-xs">Time Out</span>
                                  <span className={`font-semibold ${r.morningOut ? 'text-blue-700' : 'text-gray-300'}`}>
                                    {fmt(r.morningOut)}
                                  </span>
                                </div>
                                {r.morningIn && r.morningOut && (
                                  <div className="flex justify-between items-center pt-1 border-t border-blue-100">
                                    <span className="text-gray-500 text-xs">Duration</span>
                                    <span className="font-semibold text-blue-600 text-xs">
                                      {fmtMins(Math.round((new Date(r.morningOut).getTime() - new Date(r.morningIn).getTime()) / 60000))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Afternoon */}
                            <div className="bg-orange-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wide">
                                🌇 Afternoon
                              </p>
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 text-xs">Time In</span>
                                  <span className={`font-semibold ${r.afternoonIn ? 'text-orange-700' : 'text-gray-300'}`}>
                                    {fmt(r.afternoonIn)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 text-xs">Time Out</span>
                                  <span className={`font-semibold ${r.afternoonOut ? 'text-orange-700' : 'text-gray-300'}`}>
                                    {fmt(r.afternoonOut)}
                                  </span>
                                </div>
                                {r.afternoonIn && r.afternoonOut && (
                                  <div className="flex justify-between items-center pt-1 border-t border-orange-100">
                                    <span className="text-gray-500 text-xs">Duration</span>
                                    <span className="font-semibold text-orange-600 text-xs">
                                      {fmtMins(Math.round((new Date(r.afternoonOut).getTime() - new Date(r.afternoonIn).getTime()) / 60000))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Total */}
                          {r.totalMinutes > 0 && (
                            <div className="mt-3 bg-green-50 rounded-lg px-4 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-green-700 text-sm font-semibold">
                                <Clock className="w-4 h-4" />
                                Total Time
                              </div>
                              <span className="text-green-700 font-bold">{fmtMins(r.totalMinutes)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-between pt-3">
                    <p className="text-xs text-gray-500">Page {page} of {pages}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(pages, p + 1))}
                        disabled={page === pages}
                        className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary w-full text-sm py-2.5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
