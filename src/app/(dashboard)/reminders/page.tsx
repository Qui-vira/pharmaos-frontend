'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { StatCard, DataTable, StatusBadge, Pagination, LoadingSpinner } from '@/components/ui';
import { Bell, Send, Clock, CheckCircle, Plus, X, AlertCircle } from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';
import { remindersApi, patientsApi } from '@/lib/api';
import type { Reminder, Patient, PaginatedResponse } from '@/types';

const typeIcons: Record<string, string> = {
  refill: '\u{1F48A}',
  adherence: '\u23F0',
  follow_up: '\u{1F4CB}',
  pickup: '\u{1F3EA}',
};

const typeAccentColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  refill: {
    bg: 'bg-blue-50/80 dark:bg-blue-900/20',
    border: 'border-blue-200/60 dark:border-blue-700/40',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  adherence: {
    bg: 'bg-amber-50/80 dark:bg-amber-900/20',
    border: 'border-amber-200/60 dark:border-amber-700/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  follow_up: {
    bg: 'bg-violet-50/80 dark:bg-violet-900/20',
    border: 'border-violet-200/60 dark:border-violet-700/40',
    text: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  pickup: {
    bg: 'bg-emerald-50/80 dark:bg-emerald-900/20',
    border: 'border-emerald-200/60 dark:border-emerald-700/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
};

const statusIndicatorColors: Record<string, { dot: string; pulse: string; label: string }> = {
  pending: {
    dot: 'bg-amber-500',
    pulse: 'bg-amber-400',
    label: 'text-amber-600 dark:text-amber-400',
  },
  sent: {
    dot: 'bg-blue-500',
    pulse: 'bg-blue-400',
    label: 'text-blue-600 dark:text-blue-400',
  },
  delivered: {
    dot: 'bg-emerald-500',
    pulse: 'bg-emerald-400',
    label: 'text-emerald-600 dark:text-emerald-400',
  },
  responded: {
    dot: 'bg-brand-500',
    pulse: 'bg-brand-400',
    label: 'text-brand-600 dark:text-brand-400',
  },
  failed: {
    dot: 'bg-danger-500',
    pulse: 'bg-danger-400',
    label: 'text-danger-600 dark:text-danger-400',
  },
};

export default function RemindersPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [reminders, setReminders] = useState<PaginatedResponse<Reminder> | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [respondedCount, setRespondedCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    reminder_type: 'refill' as 'refill' | 'adherence' | 'follow_up' | 'pickup',
    product_id: '',
    scheduled_at: '',
    recurrence_rule: '',
    message_template: '',
  });

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = filter === 'all' ? undefined : filter;
      const data = await remindersApi.list(page, statusParam);
      setReminders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const [pendingRes, sentRes, deliveredRes, respondedRes] = await Promise.all([
        remindersApi.list(1, 'pending'),
        remindersApi.list(1, 'sent'),
        remindersApi.list(1, 'delivered'),
        remindersApi.list(1, 'responded'),
      ]);
      setPendingCount(pendingRes.total);
      setSentCount(sentRes.total + deliveredRes.total);
      setRespondedCount(respondedRes.total);
    } catch { /* non-critical */ }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await patientsApi.list(1);
      setPatients(data.items);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);
  useEffect(() => { fetchStats(); fetchPatients(); }, [fetchStats, fetchPatients]);
  useEffect(() => { setPage(1); }, [filter]);

  const handleCreate = async () => {
    if (!formData.patient_id || !formData.scheduled_at) {
      setCreateError('Patient and scheduled time are required.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await remindersApi.create({
        patient_id: formData.patient_id,
        reminder_type: formData.reminder_type,
        product_id: formData.product_id || undefined,
        scheduled_at: formData.scheduled_at,
        recurrence_rule: formData.recurrence_rule || undefined,
        message_template: formData.message_template || undefined,
      });
      setShowCreateModal(false);
      setFormData({ patient_id: '', reminder_type: 'refill', product_id: '', scheduled_at: '', recurrence_rule: '', message_template: '' });
      fetchReminders();
      fetchStats();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create reminder');
    } finally {
      setCreating(false);
    }
  };

  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.full_name || id;
  const getPatientPhone = (id: string) => patients.find((p) => p.id === id)?.phone || '';

  const columns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (item: Reminder) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-brand-700 dark:text-brand-300">{getPatientName(item.patient_id).charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{getPatientName(item.patient_id)}</p>
            {getPatientPhone(item.patient_id) && <p className="text-xs text-surface-400 dark:text-surface-500">{getPatientPhone(item.patient_id)}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: Reminder) => {
        const accent = typeAccentColors[item.reminder_type] || typeAccentColors.refill;
        return (
          <span className={cn('text-sm capitalize flex items-center gap-1.5 font-medium', accent.text)}>
            {typeIcons[item.reminder_type]} {item.reminder_type.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      key: 'product',
      header: 'Product',
      render: (item: Reminder) => <span className="text-sm text-surface-600 dark:text-surface-400">{item.product_id || '\u2014'}</span>,
    },
    {
      key: 'scheduled_at',
      header: 'Scheduled',
      render: (item: Reminder) => <span className="text-sm text-surface-700 dark:text-surface-300">{formatDateTime(item.scheduled_at)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Reminder) => {
        const indicator = statusIndicatorColors[item.status] || statusIndicatorColors.pending;
        return (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', indicator.pulse)} />
              <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', indicator.dot)} />
            </span>
            <StatusBadge status={item.status} />
          </div>
        );
      },
    },
    {
      key: 'response',
      header: 'Response',
      render: (item: Reminder) => item.response ? (
        <span className="badge bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">{item.response}</span>
      ) : (
        <span className="text-xs text-surface-300 dark:text-surface-600">{'\u2014'}</span>
      ),
    },
  ];

  const filterTabs = ['all', 'pending', 'sent', 'delivered', 'responded', 'failed'];

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900">
      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BlurFade delay={0.05}>
            <StatCard label="Pending" value={pendingCount} icon={Clock} color="warning" />
          </BlurFade>
          <BlurFade delay={0.1}>
            <StatCard label="Sent/Delivered" value={sentCount} icon={Send} color="info" />
          </BlurFade>
          <BlurFade delay={0.15}>
            <StatCard label="Responded" value={respondedCount} icon={CheckCircle} color="brand" />
          </BlurFade>
        </div>

        {/* Error banner */}
        {error && (
          <BlurFade delay={0.05}>
            <div className="bg-danger-500/10 dark:bg-danger-500/20 text-danger-600 dark:text-danger-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          </BlurFade>
        )}

        {/* Main table card */}
        <BlurFade delay={0.2}>
          <div className="card bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex gap-1 overflow-x-auto relative">
                {filterTabs.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn(
                      'relative px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap z-10',
                      filter === s
                        ? 'text-white'
                        : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700',
                    )}
                  >
                    {filter === s && (
                      <motion.div
                        layoutId="reminders-tab-indicator"
                        className="absolute inset-0 bg-brand-600 dark:bg-brand-500 rounded-lg"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10">{s === 'all' ? 'All' : s}</span>
                  </button>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="btn-primary text-sm"
              >
                <Plus className="w-4 h-4" /> New Reminder
              </motion.button>
            </div>

            {loading ? <LoadingSpinner /> : (
              <>
                <DataTable columns={columns} data={reminders?.items || []} />
                {reminders && <Pagination page={reminders.page} pages={reminders.pages} total={reminders.total} onPageChange={setPage} />}
              </>
            )}
          </div>
        </BlurFade>

        {/* Glass reminder cards */}
        {!loading && reminders?.items && reminders.items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reminders.items.map((item: Reminder, idx: number) => {
              const accent = typeAccentColors[item.reminder_type] || typeAccentColors.refill;
              const statusInd = statusIndicatorColors[item.status] || statusIndicatorColors.pending;

              return (
                <BlurFade key={item.id || idx} delay={0.05 * idx}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * idx, duration: 0.35 }}
                    className={cn(
                      'relative rounded-2xl border p-4 backdrop-blur-sm shadow-lg transition-all',
                      accent.bg,
                      accent.border,
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                            {getPatientName(item.patient_id).charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                            {getPatientName(item.patient_id)}
                          </p>
                          {getPatientPhone(item.patient_id) && (
                            <p className="text-xs text-surface-400 dark:text-surface-500">
                              {getPatientPhone(item.patient_id)}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={cn('text-lg')}>{typeIcons[item.reminder_type]}</span>
                    </div>

                    {/* Type label */}
                    <div className={cn('text-xs font-semibold capitalize mb-2', accent.text)}>
                      <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1.5', accent.dot)} />
                      {item.reminder_type.replace('_', ' ')}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-surface-600 dark:text-surface-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateTime(item.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Animated delivery status dot */}
                        <span className="relative flex h-2 w-2">
                          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', statusInd.pulse)} />
                          <span className={cn('relative inline-flex rounded-full h-2 w-2', statusInd.dot)} />
                        </span>
                        <span className={cn('font-medium capitalize', statusInd.label)}>{item.status}</span>
                      </div>
                    </div>

                    {item.response && (
                      <div className="mt-3 px-2.5 py-1.5 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-xs text-brand-700 dark:text-brand-300 font-medium">
                        Response: {item.response}
                      </div>
                    )}
                  </motion.div>
                </BlurFade>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-up create modal with AnimatePresence */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowCreateModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-lg"
            >
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
                {/* Modal header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Schedule Reminder</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 dark:text-surface-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {createError && (
                    <div className="bg-danger-500/10 dark:bg-danger-500/20 text-danger-600 dark:text-danger-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {createError}
                    </div>
                  )}

                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">Patient</label>
                    <select
                      className="input bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-900 dark:text-surface-50"
                      value={formData.patient_id}
                      onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    >
                      <option value="">Select patient...</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>{p.full_name} - {p.phone}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-surface-700 dark:text-surface-300">Reminder Type</label>
                      <select
                        className="input bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-900 dark:text-surface-50"
                        value={formData.reminder_type}
                        onChange={(e) => setFormData({ ...formData, reminder_type: e.target.value as any })}
                      >
                        <option value="refill">Refill</option>
                        <option value="adherence">Adherence</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="pickup">Pickup</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-surface-700 dark:text-surface-300">Product ID (optional)</label>
                      <input
                        className="input bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-900 dark:text-surface-50"
                        placeholder="e.g. product UUID"
                        value={formData.product_id}
                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-surface-700 dark:text-surface-300">Send Date & Time</label>
                      <input
                        type="datetime-local"
                        className="input bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-900 dark:text-surface-50"
                        value={formData.scheduled_at}
                        onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label text-surface-700 dark:text-surface-300">Recurrence</label>
                      <select
                        className="input bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-900 dark:text-surface-50"
                        value={formData.recurrence_rule}
                        onChange={(e) => setFormData({ ...formData, recurrence_rule: e.target.value })}
                      >
                        <option value="">One-time</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="every_30_days">Every 30 days</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">Custom Message (optional)</label>
                    <textarea
                      className="input bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-900 dark:text-surface-50"
                      rows={3}
                      placeholder="Leave blank to use default template"
                      value={formData.message_template}
                      onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="btn-secondary text-sm text-surface-700 dark:text-surface-300"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreate}
                      disabled={creating}
                      className="btn-primary text-sm"
                    >
                      {creating ? 'Scheduling...' : (<><Bell className="w-4 h-4" /> Schedule Reminder</>)}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
