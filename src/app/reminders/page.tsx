'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { StatCard, DataTable, StatusBadge, Modal } from '@/components/ui';
import { Bell, Send, Clock, CheckCircle, Plus, MessageCircle } from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';

const mockReminders = [
  { id: '1', patient: 'John Okafor', phone: '+2348012345678', type: 'refill', product: 'Amlodipine 5mg', scheduled_at: new Date(Date.now() + 3600000).toISOString(), status: 'pending', response: null },
  { id: '2', patient: 'Mary Adebayo', phone: '+2348098765432', type: 'adherence', product: 'Metformin 500mg', scheduled_at: new Date(Date.now() - 1800000).toISOString(), status: 'sent', response: null },
  { id: '3', patient: 'Chioma Adeyemi', phone: '+2348033445566', type: 'follow_up', product: null, scheduled_at: new Date(Date.now() - 86400000).toISOString(), status: 'delivered', response: null },
  { id: '4', patient: 'Emeka Okonkwo', phone: '+2348055667788', type: 'refill', product: 'Omeprazole 20mg', scheduled_at: new Date(Date.now() - 172800000).toISOString(), status: 'responded', response: 'PICKUP' },
  { id: '5', patient: 'Fatima Bello', phone: '+2347099887766', type: 'pickup', product: null, scheduled_at: new Date(Date.now() - 259200000).toISOString(), status: 'failed', response: null },
];

const typeIcons: Record<string, string> = {
  refill: '💊',
  adherence: '⏰',
  follow_up: '📋',
  pickup: '🏪',
};

export default function RemindersPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? mockReminders : mockReminders.filter(r => r.status === filter);

  const pendingCount = mockReminders.filter(r => r.status === 'pending').length;
  const sentCount = mockReminders.filter(r => r.status === 'sent' || r.status === 'delivered').length;
  const respondedCount = mockReminders.filter(r => r.status === 'responded').length;

  const columns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-brand-700">{item.patient.charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800">{item.patient}</p>
            <p className="text-xs text-surface-400">{item.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: any) => (
        <span className="text-sm capitalize flex items-center gap-1.5">
          {typeIcons[item.type]} {item.type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (item: any) => <span className="text-sm text-surface-600">{item.product || '—'}</span>,
    },
    {
      key: 'scheduled_at',
      header: 'Scheduled',
      render: (item: any) => <span className="text-sm">{formatDateTime(item.scheduled_at)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      key: 'response',
      header: 'Response',
      render: (item: any) => item.response ? (
        <span className="badge bg-brand-100 text-brand-700">{item.response}</span>
      ) : (
        <span className="text-xs text-surface-300">—</span>
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

        <div className="card">
          <div className="px-5 py-4 border-b border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-1 overflow-x-auto">
              {['all', 'pending', 'sent', 'delivered', 'responded', 'failed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap',
                    filter === s ? 'bg-brand-600 text-white' : 'text-surface-500 hover:bg-surface-100',
                  )}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> New Reminder
            </button>
          </div>

          <DataTable columns={columns} data={filtered} />
        </div>
      </div>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Schedule Reminder">
        <div className="space-y-4">
          <div>
            <label className="label">Patient</label>
            <select className="input">
              <option>Select patient...</option>
              <option>John Okafor - 08012345678</option>
              <option>Mary Adebayo - 08098765432</option>
              <option>Chioma Adeyemi - 08033445566</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Reminder Type</label>
              <select className="input">
                <option value="refill">Refill</option>
                <option value="adherence">Adherence</option>
                <option value="follow_up">Follow Up</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>
            <div>
              <label className="label">Product (optional)</label>
              <input className="input" placeholder="e.g. Amlodipine 5mg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Send Date & Time</label>
              <input type="datetime-local" className="input" />
            </div>
            <div>
              <label className="label">Recurrence</label>
              <select className="input">
                <option value="">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="every_30_days">Every 30 days</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Custom Message (optional)</label>
            <textarea className="input" rows={3} placeholder="Leave blank to use default template" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button className="btn-primary text-sm">
              <Bell className="w-4 h-4" /> Schedule Reminder
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
