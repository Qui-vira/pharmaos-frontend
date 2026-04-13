'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { AnimatedList } from '@/components/shadcn/animated-list';
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
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <BlurFade delay={0.05}>
        <div className="p-6">
          <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm">
            {/* Consultation List Sidebar */}
            <div className="w-80 border-r border-surface-200 dark:border-surface-700 overflow-y-auto flex-shrink-0 flex flex-col bg-white dark:bg-surface-800">
              <div className="p-4 border-b border-surface-200 dark:border-surface-700 space-y-3">
                <h3 className="font-bold text-surface-900 dark:text-surface-50 text-sm tracking-tight">Active Cases</h3>
                <select
                  className="w-full rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-xs py-2 px-3 outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
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
                    <p className="text-sm text-danger-600 dark:text-danger-400">{listError}</p>
                    <button onClick={fetchList} className="text-xs text-brand-600 dark:text-brand-400 mt-2 hover:underline">Retry</button>
                  </div>
                ) : consultations.length === 0 ? (
                  <div className="p-4 text-center text-surface-400 dark:text-surface-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No consultations found</p>
                  </div>
                ) : (
                  <AnimatedList delay={600}>
                    {consultations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={cn(
                          'w-full text-left px-4 py-3 border-b border-surface-100 dark:border-surface-700/50 transition-all duration-200',
                          selectedId === c.id
                            ? 'bg-brand-50 dark:bg-brand-500/10 border-l-2 border-l-brand-500'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-700/50',
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">{getPatientName(c.patient_id)}</span>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="text-xs text-surface-400 dark:text-surface-500 line-clamp-1">{c.symptom_summary || 'Intake in progress...'}</p>
                        <p className="text-xs text-surface-300 dark:text-surface-600 mt-1">{formatRelativeTime(c.created_at)}</p>
                      </button>
                    ))}
                  </AnimatedList>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-2 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="text-xs font-medium px-2 py-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 disabled:opacity-40 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-surface-500 dark:text-surface-400">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="text-xs font-medium px-2 py-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Detail Panel */}
            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center bg-white dark:bg-surface-800">
                <LoadingSpinner />
              </div>
            ) : detailError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-danger-500 bg-white dark:bg-surface-800">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p className="text-sm">{detailError}</p>
                <button onClick={() => selectedId && fetchDetail(selectedId)} className="text-xs text-brand-600 dark:text-brand-400 mt-2 hover:underline">Retry</button>
              </div>
            ) : selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex-1 flex flex-col bg-white dark:bg-surface-800"
              >
                {/* Chat Header */}
                <div className="px-5 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                        {getPatientName(selected.patient_id).charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-surface-900 dark:text-surface-50">{getPatientName(selected.patient_id)}</h3>
                      <p className="text-xs text-surface-400 dark:text-surface-500">#{selected.id.slice(0, 8)} &middot; {selected.channel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selected.status} />
                    {(selected.status === 'pending_review' || selected.status === 'pharmacist_reviewing') && !selected.pharmacist_action && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleOpenModal}
                        className="btn-primary text-xs"
                      >
                        <Stethoscope className="w-3.5 h-3.5" /> Pharmacist Action
                      </motion.button>
                    )}
                    {selected.status === 'pharmacist_reviewing' && selected.pharmacist_action && !selected.pharmacist_action.is_approved && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleApprove}
                        disabled={approving}
                        className="btn-primary text-xs"
                      >
                        {approving ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving...</>
                        ) : (
                          <><CheckCircle className="w-3.5 h-3.5" /> Approve</>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* AI Summary */}
                {selected.symptom_summary && (
                  <BlurFade delay={0.1}>
                    <div className="px-5 py-3 bg-info-500/5 dark:bg-info-500/10 border-b border-info-500/10 dark:border-info-500/20">
                      <p className="text-xs font-semibold text-info-600 dark:text-info-400 mb-1">AI Summary</p>
                      <p className="text-sm text-surface-700 dark:text-surface-300">{selected.symptom_summary}</p>
                    </div>
                  </BlurFade>
                )}

                {/* Pharmacist Action Display */}
                {selected.pharmacist_action && (
                  <BlurFade delay={0.15}>
                    <div className="px-5 py-3 bg-brand-50/50 dark:bg-brand-500/5 border-b border-brand-100 dark:border-brand-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">Pharmacist Action</p>
                        {selected.pharmacist_action.is_approved ? (
                          <span className="badge bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">Approved</span>
                        ) : (
                          <span className="badge bg-warning-500/10 text-warning-600 dark:text-warning-400">Pending Approval</span>
                        )}
                      </div>
                      <p className="text-sm text-surface-700 dark:text-surface-300 mb-1"><strong>Diagnosis:</strong> {selected.pharmacist_action.diagnosis}</p>
                      {selected.pharmacist_action.drug_plan && selected.pharmacist_action.drug_plan.length > 0 && (
                        <div className="text-sm text-surface-700 dark:text-surface-300 mb-1">
                          <strong>Drug Plan:</strong>
                          <ul className="ml-4 mt-1 list-disc">
                            {selected.pharmacist_action.drug_plan.map((drug: any, i: number) => (
                              <li key={i}>{drug.drug_name || drug.product_name} - {drug.dosage} ({drug.instructions})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-sm text-surface-700 dark:text-surface-300">
                        <strong>Total:</strong> {'\u20A6'}{selected.pharmacist_action.total_price?.toLocaleString()}
                      </p>
                      {selected.pharmacist_action.notes && (
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1"><em>{selected.pharmacist_action.notes}</em></p>
                      )}
                    </div>
                  </BlurFade>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-50/30 dark:bg-surface-900/30">
                  {selected.messages && selected.messages.length > 0 ? (
                    selected.messages.map((msg, msgIndex) => {
                      const Icon = senderIcons[msg.sender_type as keyof typeof senderIcons];
                      const isCustomer = msg.sender_type === 'customer';
                      const isAI = msg.sender_type === 'ai';

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: msgIndex * 0.03 }}
                          className={cn('flex gap-3', !isCustomer && 'flex-row-reverse')}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            isCustomer
                              ? 'bg-surface-100 dark:bg-surface-700'
                              : isAI
                                ? 'bg-info-500/10 dark:bg-info-500/20'
                                : 'bg-brand-100 dark:bg-brand-500/20',
                          )}>
                            <Icon className={cn(
                              'w-4 h-4',
                              isCustomer
                                ? 'text-surface-600 dark:text-surface-300'
                                : isAI
                                  ? 'text-info-600 dark:text-info-400'
                                  : 'text-brand-600 dark:text-brand-400',
                            )} />
                          </div>
                          <div className={cn(
                            'max-w-[70%] rounded-2xl px-4 py-2.5 backdrop-blur-sm border',
                            isCustomer
                              ? 'bg-white/80 dark:bg-surface-700/60 border-surface-200 dark:border-surface-600 rounded-tl-sm'
                              : isAI
                                ? 'bg-white/80 dark:bg-surface-800/60 border-brand-400/30 rounded-tr-sm'
                                : 'bg-brand-50/80 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30 rounded-tr-sm',
                          )}>
                            <p className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 mb-0.5">
                              {senderLabels[msg.sender_type] || msg.sender_type}
                            </p>
                            <p className="text-sm text-surface-800 dark:text-surface-200 whitespace-pre-wrap">{msg.message}</p>
                            <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">{formatRelativeTime(msg.sent_at)}</p>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full text-surface-400 dark:text-surface-500">
                      <p className="text-sm">No messages yet</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply input or status bar */}
                {isConsultationOpen ? (
                  <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
                    {sendError && (
                      <p className="text-xs text-danger-500 mb-2">{sendError}</p>
                    )}
                    <div className="flex items-end gap-2">
                      <textarea
                        className="flex-1 resize-none text-sm rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                        rows={1}
                        placeholder="Type a message to the patient..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleReplyKeyDown}
                        disabled={sending}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendReply}
                        disabled={sending || !replyText.trim()}
                        className="btn-primary text-sm px-3 py-2.5 flex-shrink-0"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 flex items-center justify-center gap-2">
                    {selected.status === 'completed' && (
                      <p className="text-sm text-brand-600 dark:text-brand-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Consultation completed
                      </p>
                    )}
                    {selected.status === 'cancelled' && (
                      <p className="text-sm text-danger-500 dark:text-danger-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Consultation cancelled
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-surface-400 dark:text-surface-500 bg-white dark:bg-surface-800">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a consultation to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </BlurFade>

      {/* Pharmacist Action Modal */}
      <Modal open={showActionModal} onClose={() => setShowActionModal(false)} title="Pharmacist Action">
        <div className="space-y-4">
          <div className="bg-warning-500/5 dark:bg-warning-500/10 border border-warning-500/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-warning-600 dark:text-warning-400">
              Your diagnosis and drug plan will be sent to the customer only after you approve.
            </p>
          </div>

          {submitError && (
            <div className="bg-danger-500/5 dark:bg-danger-500/10 border border-danger-500/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-danger-600 dark:text-danger-400">{submitError}</p>
            </div>
          )}

          <div>
            <label className="label text-surface-700 dark:text-surface-300">Diagnosis</label>
            <textarea
              className="w-full rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
              rows={3}
              placeholder="Enter your clinical assessment..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-surface-700 dark:text-surface-300">Drug Plan</label>
            <div className="space-y-2">
              <AnimatePresence>
                {drugPlan.map((drug, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <input
                      className="col-span-4 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                      placeholder="Drug name"
                      value={drug.drug_name}
                      onChange={(e) => updateDrugRow(index, 'drug_name', e.target.value)}
                    />
                    <input
                      className="col-span-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                      placeholder="Dosage"
                      value={drug.dosage}
                      onChange={(e) => updateDrugRow(index, 'dosage', e.target.value)}
                    />
                    <input
                      className="col-span-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                      placeholder="Instructions"
                      value={drug.instructions}
                      onChange={(e) => updateDrugRow(index, 'instructions', e.target.value)}
                    />
                    <input
                      type="number"
                      className="col-span-1 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                      placeholder="Price"
                      value={drug.price || ''}
                      onChange={(e) => updateDrugRow(index, 'price', Number(e.target.value))}
                    />
                    <button
                      onClick={() => removeDrugRow(index)}
                      disabled={drugPlan.length <= 1}
                      className="col-span-1 flex items-center justify-center text-danger-400 hover:text-danger-600 dark:text-danger-500 dark:hover:text-danger-400 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addDrugRow}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add another drug
              </motion.button>
            </div>
          </div>

          <div>
            <label className="label text-surface-700 dark:text-surface-300">Total Price ({'\u20A6'})</label>
            <input
              type="number"
              className="w-full rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
              placeholder="0"
              value={totalPrice || ''}
              onChange={(e) => setTotalPrice(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="label text-surface-700 dark:text-surface-300">Notes (optional)</label>
            <textarea
              className="w-full rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
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
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmitAction}
              disabled={submitting || !diagnosis.trim()}
              className="btn-primary text-sm"
            >
              {submitting ? 'Saving...' : (<><Stethoscope className="w-4 h-4" /> Save Action</>)}
            </motion.button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
