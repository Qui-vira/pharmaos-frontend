'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/layout/Header';
import { StatusBadge, Modal, LoadingSpinner } from '@/components/ui';
import { MessageSquare, User, Bot, Stethoscope, CheckCircle, Clock, AlertCircle, Plus, Trash2, Send, Loader2 } from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';
import { consultationsApi, patientsApi } from '@/lib/api';
import type { Consultation, Patient, PaginatedResponse } from '@/types';

interface DrugPlanItem {
  drug_name: string;
  dosage: string;
  instructions: string;
  price: number;
}

export default function ConsultationsPage() {
  // List state
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Detail state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Patient name cache
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [drugPlan, setDrugPlan] = useState<DrugPlanItem[]>([{ drug_name: '', dosage: '', instructions: '', price: 0 }]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  // Fetch consultations list
  const fetchList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const data: PaginatedResponse<Consultation> = await consultationsApi.list(page, statusFilter);
      setConsultations(data.items);
      setTotalPages(data.pages);
    } catch (err: any) {
      setListError(err.message || 'Failed to load consultations');
    } finally {
      setListLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Fetch patient names for consultations
  useEffect(() => {
    const missingIds = consultations
      .map((c) => c.patient_id)
      .filter((id) => id && !patientNames[id]);
    const uniqueIds = Array.from(new Set(missingIds));

    uniqueIds.forEach(async (id) => {
      try {
        const patient = await patientsApi.get(id);
        setPatientNames((prev) => ({ ...prev, [id]: patient.full_name }));
      } catch {
        setPatientNames((prev) => ({ ...prev, [id]: `Patient #${id.slice(0, 8)}` }));
      }
    });
  }, [consultations, patientNames]);

  // Fetch single consultation detail
  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setSendError(null);
    try {
      const data = await consultationsApi.get(id);
      setSelected(data);
      // Fetch patient name if not cached
      if (data.patient_id && !patientNames[data.patient_id]) {
        try {
          const patient = await patientsApi.get(data.patient_id);
          setPatientNames((prev) => ({ ...prev, [data.patient_id]: patient.full_name }));
        } catch { /* use fallback */ }
      }
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load consultation');
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }, [patientNames]);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    } else {
      setSelected(null);
    }
  }, [selectedId, fetchDetail]);

  // Auto-select first consultation when list loads
  useEffect(() => {
    if (consultations.length > 0 && !selectedId) {
      setSelectedId(consultations[0].id);
    }
  }, [consultations, selectedId]);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages]);

  // Send pharmacist reply
  const handleSendReply = async () => {
    if (!selectedId || !replyText.trim()) return;

    setSending(true);
    setSendError(null);
    try {
      const updated = await consultationsApi.sendMessage(selectedId, replyText.trim());
      setSelected(updated);
      setReplyText('');
      await fetchList();
    } catch (err: any) {
      setSendError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Drug plan helpers
  const addDrugRow = () => {
    setDrugPlan([...drugPlan, { drug_name: '', dosage: '', instructions: '', price: 0 }]);
  };

  const removeDrugRow = (index: number) => {
    if (drugPlan.length > 1) {
      setDrugPlan(drugPlan.filter((_, i) => i !== index));
    }
  };

  const updateDrugRow = (index: number, field: keyof DrugPlanItem, value: string | number) => {
    const updated = [...drugPlan];
    updated[index] = { ...updated[index], [field]: value };
    setDrugPlan(updated);
  };

  // Recalculate total price from drug plan
  useEffect(() => {
    const sum = drugPlan.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    setTotalPrice(sum);
  }, [drugPlan]);

  // Reset modal form
  const resetForm = () => {
    setDiagnosis('');
    setDrugPlan([{ drug_name: '', dosage: '', instructions: '', price: 0 }]);
    setTotalPrice(0);
    setNotes('');
    setSubmitError(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowActionModal(true);
  };

  // Submit pharmacist action
  const handleSubmitAction = async () => {
    if (!selectedId || !diagnosis.trim()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await consultationsApi.submitAction(selectedId, {
        diagnosis: diagnosis.trim(),
        drug_plan: drugPlan.filter(d => d.drug_name.trim()),
        total_price: totalPrice,
        notes: notes.trim() || undefined,
      });
      setShowActionModal(false);
      resetForm();
      await fetchDetail(selectedId);
      await fetchList();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit action');
    } finally {
      setSubmitting(false);
    }
  };

  // Approve consultation
  const handleApprove = async () => {
    if (!selectedId) return;

    setApproving(true);
    setSubmitError(null);
    try {
      await consultationsApi.approve(selectedId);
      setShowActionModal(false);
      resetForm();
      await fetchDetail(selectedId);
      await fetchList();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to approve consultation');
    } finally {
      setApproving(false);
    }
  };

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

  const senderLabels: Record<string, string> = {
    customer: 'Patient',
    ai: 'AI Assistant',
    pharmacist: 'Pharmacist',
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'intake', label: 'Intake' },
    { value: 'ai_processing', label: 'AI Processing' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'pharmacist_reviewing', label: 'Pharmacist Reviewing' },
    { value: 'approved', label: 'Approved' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const getPatientName = (patientId: string) => patientNames[patientId] || `Patient #${patientId.slice(0, 8)}`;

  const isConsultationOpen = selected && !['completed', 'cancelled'].includes(selected.status);

  return (
    <>
      <Header title="Consultations" />

      <div className="p-6">
        <div className="card flex h-[calc(100vh-8rem)] overflow-hidden">
          {/* List */}
          <div className="w-80 border-r border-surface-200 overflow-y-auto flex-shrink-0 flex flex-col">
            <div className="p-3 border-b border-surface-200 space-y-2">
              <h3 className="font-bold text-surface-900 text-sm">Active Cases</h3>
              <select
                className="input text-xs py-1.5"
                value={statusFilter || ''}
                onChange={(e) => {
                  setStatusFilter(e.target.value || undefined);
                  setPage(1);
                  setSelectedId(null);
                }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              {listLoading ? (
                <LoadingSpinner />
              ) : listError ? (
                <div className="p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-danger-500 mx-auto mb-2" />
                  <p className="text-sm text-danger-600">{listError}</p>
                  <button onClick={fetchList} className="text-xs text-brand-600 mt-2 hover:underline">Retry</button>
                </div>
              ) : consultations.length === 0 ? (
                <div className="p-4 text-center text-surface-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No consultations found</p>
                </div>
              ) : (
                consultations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-surface-100 transition-colors',
                      selectedId === c.id ? 'bg-brand-50' : 'hover:bg-surface-50',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-surface-800">{getPatientName(c.patient_id)}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-surface-400 line-clamp-1">{c.symptom_summary || 'Intake in progress...'}</p>
                    <p className="text-xs text-surface-300 mt-1">{formatRelativeTime(c.created_at)}</p>
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-2 border-t border-surface-200 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-xs font-medium px-2 py-1 rounded hover:bg-surface-100 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs text-surface-500">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="text-xs font-medium px-2 py-1 rounded hover:bg-surface-100 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Detail */}
          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : detailError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-danger-500">
              <AlertCircle className="w-10 h-10 mb-2" />
              <p className="text-sm">{detailError}</p>
              <button onClick={() => selectedId && fetchDetail(selectedId)} className="text-xs text-brand-600 mt-2 hover:underline">Retry</button>
            </div>
          ) : selected ? (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="px-5 py-3 border-b border-surface-200 flex items-center justify-between bg-surface-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-brand-700">
                      {getPatientName(selected.patient_id).charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900">{getPatientName(selected.patient_id)}</h3>
                    <p className="text-xs text-surface-400">#{selected.id.slice(0, 8)} &middot; {selected.channel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  {(selected.status === 'pending_review' || selected.status === 'pharmacist_reviewing') && !selected.pharmacist_action && (
                    <button onClick={handleOpenModal} className="btn-primary text-xs">
                      <Stethoscope className="w-3.5 h-3.5" /> Pharmacist Action
                    </button>
                  )}
                  {selected.status === 'pharmacist_reviewing' && selected.pharmacist_action && !selected.pharmacist_action.is_approved && (
                    <button onClick={handleApprove} disabled={approving} className="btn-primary text-xs">
                      {approving ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving...</>
                      ) : (
                        <><CheckCircle className="w-3.5 h-3.5" /> Approve</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* AI Summary */}
              {selected.symptom_summary && (
                <div className="px-5 py-3 bg-info-500/5 border-b border-info-500/10">
                  <p className="text-xs font-semibold text-info-600 mb-1">AI Summary</p>
                  <p className="text-sm text-surface-700">{selected.symptom_summary}</p>
                </div>
              )}

              {/* Pharmacist Action Display */}
              {selected.pharmacist_action && (
                <div className="px-5 py-3 bg-brand-50/50 border-b border-brand-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-brand-700">Pharmacist Action</p>
                    {selected.pharmacist_action.is_approved ? (
                      <span className="badge bg-brand-100 text-brand-700">Approved</span>
                    ) : (
                      <span className="badge bg-warning-500/10 text-warning-600">Pending Approval</span>
                    )}
                  </div>
                  <p className="text-sm text-surface-700 mb-1"><strong>Diagnosis:</strong> {selected.pharmacist_action.diagnosis}</p>
                  {selected.pharmacist_action.drug_plan && selected.pharmacist_action.drug_plan.length > 0 && (
                    <div className="text-sm text-surface-700 mb-1">
                      <strong>Drug Plan:</strong>
                      <ul className="ml-4 mt-1 list-disc">
                        {selected.pharmacist_action.drug_plan.map((drug: any, i: number) => (
                          <li key={i}>{drug.drug_name || drug.product_name} - {drug.dosage} ({drug.instructions})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-sm text-surface-700">
                    <strong>Total:</strong> {'\u20A6'}{selected.pharmacist_action.total_price?.toLocaleString()}
                  </p>
                  {selected.pharmacist_action.notes && (
                    <p className="text-sm text-surface-500 mt-1"><em>{selected.pharmacist_action.notes}</em></p>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selected.messages && selected.messages.length > 0 ? (
                  selected.messages.map((msg) => {
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
                          isCustomer
                            ? 'bg-surface-100 rounded-tl-sm'
                            : msg.sender_type === 'pharmacist'
                              ? 'bg-brand-100 rounded-tr-sm'
                              : 'bg-info-500/5 rounded-tr-sm',
                        )}>
                          <p className="text-[10px] font-semibold text-surface-400 mb-0.5">
                            {senderLabels[msg.sender_type] || msg.sender_type}
                          </p>
                          <p className="text-sm text-surface-800 whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-[10px] text-surface-400 mt-1">{formatRelativeTime(msg.sent_at)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-full text-surface-400">
                    <p className="text-sm">No messages yet</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input or status bar */}
              {isConsultationOpen ? (
                <div className="px-4 py-3 border-t border-surface-200 bg-white">
                  {sendError && (
                    <p className="text-xs text-danger-500 mb-2">{sendError}</p>
                  )}
                  <div className="flex items-end gap-2">
                    <textarea
                      className="input flex-1 resize-none text-sm"
                      rows={1}
                      placeholder="Type a message to the patient..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleReplyKeyDown}
                      disabled={sending}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={sending || !replyText.trim()}
                      className="btn-primary text-sm px-3 py-2.5 flex-shrink-0"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-3 border-t border-surface-200 bg-surface-50 flex items-center justify-center gap-2">
                  {selected.status === 'completed' && (
                    <p className="text-sm text-brand-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Consultation completed
                    </p>
                  )}
                  {selected.status === 'cancelled' && (
                    <p className="text-sm text-danger-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Consultation cancelled
                    </p>
                  )}
                </div>
              )}
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
              Your diagnosis and drug plan will be sent to the customer only after you approve.
            </p>
          </div>

          {submitError && (
            <div className="bg-danger-500/5 border border-danger-500/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-danger-600">{submitError}</p>
            </div>
          )}

          <div>
            <label className="label">Diagnosis</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Enter your clinical assessment..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Drug Plan</label>
            <div className="space-y-2">
              {drugPlan.map((drug, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="input col-span-4"
                    placeholder="Drug name"
                    value={drug.drug_name}
                    onChange={(e) => updateDrugRow(index, 'drug_name', e.target.value)}
                  />
                  <input
                    className="input col-span-3"
                    placeholder="Dosage"
                    value={drug.dosage}
                    onChange={(e) => updateDrugRow(index, 'dosage', e.target.value)}
                  />
                  <input
                    className="input col-span-3"
                    placeholder="Instructions"
                    value={drug.instructions}
                    onChange={(e) => updateDrugRow(index, 'instructions', e.target.value)}
                  />
                  <input
                    type="number"
                    className="input col-span-1"
                    placeholder="Price"
                    value={drug.price || ''}
                    onChange={(e) => updateDrugRow(index, 'price', Number(e.target.value))}
                  />
                  <button
                    onClick={() => removeDrugRow(index)}
                    disabled={drugPlan.length <= 1}
                    className="col-span-1 flex items-center justify-center text-danger-400 hover:text-danger-600 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={addDrugRow} className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add another drug
              </button>
            </div>
          </div>

          <div>
            <label className="label">Total Price ({'\u20A6'})</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={totalPrice || ''}
              onChange={(e) => setTotalPrice(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Additional notes for the patient..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowActionModal(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitAction}
              disabled={submitting || !diagnosis.trim()}
              className="btn-primary text-sm"
            >
              {submitting ? 'Saving...' : (<><Stethoscope className="w-4 h-4" /> Save Action</>)}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
