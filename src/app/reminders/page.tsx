'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { StatCard, DataTable, StatusBadge, Pagination, Modal, LoadingSpinner } from '@/components/ui';
import { Bell, Send, Clock, CheckCircle, Plus } from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';
import { remindersApi, patientsApi } from '@/lib/api';
import type { Reminder, Patient, PaginatedResponse } from '@/types';

const typeIcons: Record<string, string> = {
  refill: '\u{1F48A}',
  adherence: '\u23F0',
  follow_up: '\u{1F4CB}',
  pickup: '\u{1F3EA}',
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
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-brand-700">{getPatientName(item.patient_id).charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800">{getPatientName(item.patient_id)}</p>
            {getPatientPhone(item.patient_id) && <p className="text-xs text-surface-400">{getPatientPhone(item.patient_id)}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: Reminder) => (
        <span className="text-sm capitalize flex items-center gap-1.5">
          {typeIcons[item.reminder_type]} {item.reminder_type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (item: Reminder) => <span className="text-sm text-surface-600">{item.product_id || '\u2014'}</span>,
    },
    {
      key: 'scheduled_at',
      header: 'Scheduled',
      render: (item: Reminder) => <span className="text-sm">{formatDateTime(item.scheduled_at)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Reminder) => <StatusBadge status={item.status} />,
    },
    {
      key: 'response',
      header: 'Response',
      render: (item: Reminder) => item.response ? (
        <span className="badge bg-brand-100 text-brand-700">{item.response}</span>
      ) : (
        <span className="text-xs text-surface-300">{'\u2014'}</span>
      ),
    },
  ];

  return (
    <>
      <Header title="Patient Reminders" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Pending" value={pendingCount} icon={Clock} color="warning" />
          <StatCard label="Sent/Delivered" value={sentCount} icon={Send} color="info" />
          <StatCard label="Responded" value={respondedCount} icon={CheckCircle} color="brand" />
        </div>

        {error && (
          <div className="bg-danger-500/10 text-danger-600 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
        )}

        <div className="card">
          <div className="px-5 py-4 border-b border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-1 overflow-x-auto">
              {['all', 'pending', 'sent', 'delivered', 'responded', 'failed'].map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap', filter === s ? 'bg-brand-600 text-white' : 'text-surface-500 hover:bg-surface-100')}>
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> New Reminder
            </button>
          </div>

          {loading ? <LoadingSpinner /> : (
            <>
              <DataTable columns={columns} data={reminders?.items || []} />
              {reminders && <Pagination page={reminders.page} pages={reminders.pages} total={reminders.total} onPageChange={setPage} />}
            </>
          )}
        </div>
      </div>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Schedule Reminder">
        <div className="space-y-4">
          {createError && <div className="bg-danger-500/10 text-danger-600 px-4 py-3 rounded-xl text-sm font-medium">{createError}</div>}
          <div>
            <label className="label">Patient</label>
            <select className="input" value={formData.patient_id} onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}>
              <option value="">Select patient...</option>
              {patients.map((p) => (<option key={p.id} value={p.id}>{p.full_name} - {p.phone}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Reminder Type</label>
              <select className="input" value={formData.reminder_type} onChange={(e) => setFormData({ ...formData, reminder_type: e.target.value as any })}>
                <option value="refill">Refill</option>
                <option value="adherence">Adherence</option>
                <option value="follow_up">Follow Up</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>
            <div>
              <label className="label">Product ID (optional)</label>
              <input className="input" placeholder="e.g. product UUID" value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Send Date & Time</label>
              <input type="datetime-local" className="input" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} />
            </div>
            <div>
              <label className="label">Recurrence</label>
              <select className="input" value={formData.recurrence_rule} onChange={(e) => setFormData({ ...formData, recurrence_rule: e.target.value })}>
                <option value="">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="every_30_days">Every 30 days</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Custom Message (optional)</label>
            <textarea className="input" rows={3} placeholder="Leave blank to use default template" value={formData.message_template} onChange={(e) => setFormData({ ...formData, message_template: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary text-sm">
              {creating ? 'Scheduling...' : (<><Bell className="w-4 h-4" /> Schedule Reminder</>)}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
