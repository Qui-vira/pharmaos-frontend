'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { StatusBadge, Modal } from '@/components/ui';
import { MessageSquare, User, Bot, Stethoscope, CheckCircle, Clock, Send } from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';

const mockConsultations = [
  {
    id: '1', patient: 'Chioma Adeyemi', phone: '+2348012345678', status: 'pending_review',
    created_at: new Date(Date.now() - 900000).toISOString(),
    symptom_summary: 'Patient reports persistent headache for 3 days, mild fever, and fatigue. No known allergies. Currently taking no medications.',
    messages: [
      { id: 'm1', sender_type: 'customer', message: 'Good morning, I have been having a headache for 3 days now. It won\'t go away.', sent_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 'm2', sender_type: 'ai', message: 'I\'m sorry to hear that. Let me ask you a few questions to help the pharmacist understand your situation better. How severe is the headache on a scale of 1-10?', sent_at: new Date(Date.now() - 3500000).toISOString() },
      { id: 'm3', sender_type: 'customer', message: 'About 6 or 7. It\'s mostly on the right side.', sent_at: new Date(Date.now() - 3400000).toISOString() },
      { id: 'm4', sender_type: 'ai', message: 'Do you have any other symptoms like fever, nausea, or sensitivity to light?', sent_at: new Date(Date.now() - 3300000).toISOString() },
      { id: 'm5', sender_type: 'customer', message: 'Yes, I feel a bit warm and very tired.', sent_at: new Date(Date.now() - 3200000).toISOString() },
      { id: 'm6', sender_type: 'ai', message: 'Thank you. Are you currently taking any medications or do you have any known allergies?', sent_at: new Date(Date.now() - 3100000).toISOString() },
      { id: 'm7', sender_type: 'customer', message: 'No medications and no allergies.', sent_at: new Date(Date.now() - 3000000).toISOString() },
    ],
  },
  {
    id: '2', patient: 'Emeka Okonkwo', phone: '+2348098765432', status: 'pharmacist_reviewing',
    created_at: new Date(Date.now() - 2700000).toISOString(),
    symptom_summary: 'Stomach pain with vomiting for 2 days. Patient has history of ulcer. Currently taking omeprazole.',
    messages: [
      { id: 'm1', sender_type: 'customer', message: 'My stomach has been paining me since yesterday and I\'m vomiting.', sent_at: new Date(Date.now() - 5400000).toISOString() },
      { id: 'm2', sender_type: 'ai', message: 'I\'m sorry you\'re not feeling well. Can you describe where exactly the pain is?', sent_at: new Date(Date.now() - 5300000).toISOString() },
      { id: 'm3', sender_type: 'customer', message: 'It\'s in the upper part of my stomach. I have ulcer history.', sent_at: new Date(Date.now() - 5200000).toISOString() },
    ],
  },
  {
    id: '3', patient: 'Fatima Bello', phone: '+2347033445566', status: 'intake',
    created_at: new Date(Date.now() - 600000).toISOString(),
    symptom_summary: null,
    messages: [
      { id: 'm1', sender_type: 'customer', message: 'Hello, I have cough and fever since this morning.', sent_at: new Date(Date.now() - 600000).toISOString() },
    ],
  },
  {
    id: '4', patient: 'Tunde Bakare', phone: '+2348055667788', status: 'completed',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    symptom_summary: 'Skin rash on arms and chest. No medication history.',
    messages: [],
  },
];

export default function ConsultationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(mockConsultations[0].id);
  const [showActionModal, setShowActionModal] = useState(false);
  const selected = mockConsultations.find(c => c.id === selectedId);

  const senderIcons = {
    customer: User,
    ai: Bot,
    pharmacist: Stethoscope,
  };

  const senderColors = {
    customer: 'bg-surface-100',
    ai: 'bg-info-500/10',
    pharmacist: 'bg-brand-100',
  };

  return (
    <>
      <Header title="Consultations" />

      <div className="p-6">
        <div className="card flex h-[calc(100vh-8rem)] overflow-hidden">
          {/* List */}
          <div className="w-80 border-r border-surface-200 overflow-y-auto flex-shrink-0">
            <div className="p-3 border-b border-surface-200">
              <h3 className="font-bold text-surface-900 text-sm">Active Cases</h3>
            </div>
            {mockConsultations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-surface-100 transition-colors',
                  selectedId === c.id ? 'bg-brand-50' : 'hover:bg-surface-50',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-surface-800">{c.patient}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-surface-400 line-clamp-1">{c.symptom_summary || 'Intake in progress...'}</p>
                <p className="text-xs text-surface-300 mt-1">{formatRelativeTime(c.created_at)}</p>
              </button>
            ))}
          </div>

          {/* Detail */}
          {selected ? (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="px-5 py-3 border-b border-surface-200 flex items-center justify-between bg-surface-50">
                <div>
                  <h3 className="font-bold text-surface-900">{selected.patient}</h3>
                  <p className="text-xs text-surface-400">{selected.phone} · via WhatsApp</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  {(selected.status === 'pending_review' || selected.status === 'pharmacist_reviewing') && (
                    <button onClick={() => setShowActionModal(true)} className="btn-primary text-xs">
                      <Stethoscope className="w-3.5 h-3.5" /> Take Action
                    </button>
                  )}
                </div>
              </div>

              {/* Summary */}
              {selected.symptom_summary && (
                <div className="px-5 py-3 bg-info-500/5 border-b border-info-500/10">
                  <p className="text-xs font-semibold text-info-600 mb-1">AI Summary</p>
                  <p className="text-sm text-surface-700">{selected.symptom_summary}</p>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selected.messages.map((msg) => {
                  const Icon = senderIcons[msg.sender_type as keyof typeof senderIcons];
                  const isCustomer = msg.sender_type === 'customer';

                  return (
                    <div
                      key={msg.id}
                      className={cn('flex gap-3 stagger-item', !isCustomer && 'flex-row-reverse')}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        senderColors[msg.sender_type as keyof typeof senderColors],
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2.5',
                        isCustomer ? 'bg-surface-100 rounded-tl-sm' : 'bg-brand-50 rounded-tr-sm',
                      )}>
                        <p className="text-sm text-surface-800">{msg.message}</p>
                        <p className="text-[10px] text-surface-400 mt-1">{formatRelativeTime(msg.sent_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status bar */}
              <div className="px-5 py-3 border-t border-surface-200 bg-surface-50 flex items-center justify-center gap-2">
                {selected.status === 'intake' && (
                  <p className="text-sm text-surface-400 flex items-center gap-2">
                    <Bot className="w-4 h-4 animate-pulse-subtle" /> AI is gathering patient information...
                  </p>
                )}
                {selected.status === 'pending_review' && (
                  <p className="text-sm text-warning-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Waiting for pharmacist review
                  </p>
                )}
                {selected.status === 'completed' && (
                  <p className="text-sm text-brand-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Consultation completed
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-surface-400">
              <p>Select a consultation to view</p>
            </div>
          )}
        </div>
      </div>

      {/* Pharmacist Action Modal */}
      <Modal open={showActionModal} onClose={() => setShowActionModal(false)} title="Pharmacist Action">
        <div className="space-y-4">
          <div className="bg-warning-500/5 border border-warning-500/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-warning-600">
              ⚠ Your diagnosis and drug plan will be sent to the customer only after you approve.
            </p>
          </div>

          <div>
            <label className="label">Diagnosis</label>
            <textarea className="input" rows={3} placeholder="Enter your clinical assessment..." />
          </div>

          <div>
            <label className="label">Drug Plan</label>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <input className="input col-span-4" placeholder="Drug name" />
                <input className="input col-span-3" placeholder="Dosage" />
                <input className="input col-span-3" placeholder="Instructions" />
                <input type="number" className="input col-span-2" placeholder="Price" />
              </div>
              <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">+ Add another drug</button>
            </div>
          </div>

          <div>
            <label className="label">Total Price (₦)</label>
            <input type="number" className="input" placeholder="0" />
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={2} placeholder="Additional notes for the patient..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowActionModal(false)} className="btn-secondary text-sm">Save Draft</button>
            <button className="btn-primary text-sm">
              <CheckCircle className="w-4 h-4" /> Approve & Send to Patient
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
