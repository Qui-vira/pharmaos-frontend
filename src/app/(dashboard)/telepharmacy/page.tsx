'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { LoadingSpinner } from '@/components/ui';
import {
  Video, Phone, MessageSquare, Play, Square, X as XIcon, Clock,
  Users, Activity, Timer, Plus, Search, ChevronLeft, ChevronRight,
  FileText, Mic, Loader2, AlertCircle, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { telepharmacyApi, patientsApi, getStoredUser } from '@/lib/api';
import type { TelepharmacySession, TelepharmacyStats, Patient, PaginatedResponse } from '@/types';

const SESSION_TYPE_META: Record<string, { icon: typeof Video; label: string; color: string; darkColor: string }> = {
  video: { icon: Video, label: 'Video', color: 'text-blue-600 bg-blue-50', darkColor: 'dark:text-blue-400 dark:bg-blue-900/30' },
  voice: { icon: Phone, label: 'Voice', color: 'text-purple-600 bg-purple-50', darkColor: 'dark:text-purple-400 dark:bg-purple-900/30' },
  chat: { icon: MessageSquare, label: 'Chat', color: 'text-brand-600 bg-brand-50', darkColor: 'dark:text-brand-400 dark:bg-brand-900/30' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  waiting: { label: 'Waiting', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  ringing: { label: 'Ringing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'Completed', color: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

function formatDuration(seconds?: number): string {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Start Session Modal ─────────────────────────────────────────────────

function StartSessionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sessionType, setSessionType] = useState<'video' | 'voice' | 'chat'>('video');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const searchPatients = useCallback(async (term: string) => {
    if (term.length < 2) { setPatients([]); return; }
    setSearching(true);
    try {
      const data = await patientsApi.list(1, term);
      setPatients(data.items);
    } catch { setPatients([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(search), 300);
    return () => clearTimeout(timer);
  }, [search, searchPatients]);

  const handleCreate = async () => {
    if (!selectedPatient) return;
    setCreating(true);
    setError('');
    try {
      await telepharmacyApi.createSession({
        patient_id: selectedPatient.id,
        session_type: sessionType,
        notes: notes || undefined,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white dark:bg-surface-900 rounded-2xl shadow-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Start New Session</h3>
            <button onClick={onClose} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
              <XIcon className="w-5 h-5 text-surface-400" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {error && (
              <div className="p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm rounded-xl border border-danger-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Patient Search */}
            <div>
              <label className="label dark:text-surface-300">Patient</label>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-surface-50">{selectedPatient.full_name}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{selectedPatient.phone}</p>
                  </div>
                  <button onClick={() => { setSelectedPatient(null); setSearch(''); }} className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    className="input pl-9 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-50"
                    placeholder="Search patient by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 animate-spin" />}
                  {patients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                      {patients.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPatient(p); setPatients([]); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center justify-between"
                        >
                          <span className="font-medium text-sm text-surface-800 dark:text-surface-100">{p.full_name}</span>
                          <span className="text-xs text-surface-400">{p.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Session Type */}
            <div>
              <label className="label dark:text-surface-300">Session Type</label>
              <div className="grid grid-cols-3 gap-3">
                {(['video', 'voice', 'chat'] as const).map((type) => {
                  const meta = SESSION_TYPE_META[type];
                  const Icon = meta.icon;
                  return (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSessionType(type)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        sessionType === type
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20'
                          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600',
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', meta.color, meta.darkColor)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">{meta.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label dark:text-surface-300">Notes (optional)</label>
              <textarea
                className="input min-h-[80px] resize-none dark:bg-surface-800 dark:border-surface-700 dark:text-surface-50"
                placeholder="Reason for consultation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 p-5 border-t border-surface-100 dark:border-surface-700">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!selectedPatient || creating}
              className="btn-primary flex-1 text-sm"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Start Session</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Session Detail Panel ────────────────────────────────────────────────

function SessionDetail({
  session,
  onClose,
  onRefresh,
}: {
  session: TelepharmacySession;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Prescription form
  const [diagnosis, setDiagnosis] = useState(session.prescription?.diagnosis || '');
  const [drugItems, setDrugItems] = useState<{ product_name: string; dosage: string; quantity: number; unit_price: number; instructions: string }[]>(
    session.prescription?.drug_plan?.map((d: any) => ({
      product_name: d.product_name || '',
      dosage: d.dosage || '',
      quantity: d.quantity || 1,
      unit_price: d.unit_price || 0,
      instructions: d.instructions || '',
    })) || [{ product_name: '', dosage: '', quantity: 1, unit_price: 0, instructions: '' }]
  );
  const [prescNotes, setPrescNotes] = useState(session.prescription?.notes || '');
  const [savingPresc, setSavingPresc] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    setError('');
    try {
      await telepharmacyApi.updateStatus(session.id, newStatus);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSavePrescription = async () => {
    if (!diagnosis || drugItems.length === 0) return;
    setSavingPresc(true);
    setError('');
    try {
      const totalPrice = drugItems.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);
      await telepharmacyApi.enterPrescription(session.id, {
        diagnosis,
        drug_plan: drugItems,
        total_price: totalPrice,
        notes: prescNotes || undefined,
      });
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save prescription');
    } finally {
      setSavingPresc(false);
    }
  };

  const addDrugItem = () => {
    setDrugItems([...drugItems, { product_name: '', dosage: '', quantity: 1, unit_price: 0, instructions: '' }]);
  };

  const updateDrugItem = (index: number, field: string, value: any) => {
    const updated = [...drugItems];
    (updated[index] as any)[field] = value;
    setDrugItems(updated);
  };

  const removeDrugItem = (index: number) => {
    setDrugItems(drugItems.filter((_, i) => i !== index));
  };

  const typeMeta = SESSION_TYPE_META[session.session_type] || SESSION_TYPE_META.video;
  const statusMeta = STATUS_META[session.status] || STATUS_META.waiting;
  const TypeIcon = typeMeta.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white dark:bg-surface-900 rounded-2xl shadow-elevated w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', typeMeta.color, typeMeta.darkColor)}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 dark:text-surface-50">{typeMeta.label} Session</h3>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-md', statusMeta.color)}>{statusMeta.label}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
              <XIcon className="w-5 h-5 text-surface-400" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {error && (
              <div className="p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm rounded-xl border border-danger-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Session Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Created', value: new Date(session.created_at).toLocaleString() },
                { label: 'Started', value: formatTime(session.started_at) },
                { label: 'Duration', value: formatDuration(session.duration_seconds) },
                { label: 'Patient ID', value: `${session.patient_id.slice(0, 8)}...` },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3"
                >
                  <p className="text-xs font-semibold text-surface-500 dark:text-surface-400">{item.label}</p>
                  <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">{item.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Status Actions */}
            {session.status !== 'completed' && session.status !== 'cancelled' && (
              <div className="flex gap-3">
                {session.status === 'waiting' && (
                  <button onClick={() => handleStatusUpdate('ringing')} disabled={updating} className="btn-primary text-sm flex-1">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Phone className="w-4 h-4" /> Ring Pharmacist</>}
                  </button>
                )}
                {session.status === 'ringing' && (
                  <button onClick={() => handleStatusUpdate('active')} disabled={updating} className="btn-primary text-sm flex-1">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Start Call</>}
                  </button>
                )}
                {session.status === 'active' && (
                  <button onClick={() => handleStatusUpdate('completed')} disabled={updating} className="btn-primary text-sm flex-1">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Square className="w-4 h-4" /> End Session</>}
                  </button>
                )}
                <button onClick={() => handleStatusUpdate('cancelled')} disabled={updating} className="btn-danger text-sm">
                  <XIcon className="w-4 h-4" /> Cancel
                </button>
              </div>
            )}

            {/* Notes */}
            {session.notes && (
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1">Session Notes</p>
                <p className="text-sm text-surface-700 dark:text-surface-300">{session.notes}</p>
              </div>
            )}

            {/* Prescription Form (for active/completed sessions) */}
            {(session.status === 'active' || session.status === 'completed') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-surface-200 dark:border-surface-700 rounded-xl p-5 space-y-4 bg-white/50 dark:bg-surface-800/50 backdrop-blur-sm"
              >
                <h4 className="font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Prescription
                </h4>

                <div>
                  <label className="label dark:text-surface-300">Diagnosis</label>
                  <input
                    className="input dark:bg-surface-800 dark:border-surface-700 dark:text-surface-50"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Enter diagnosis..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="label mb-0 dark:text-surface-300">Drug Plan</label>
                    <button onClick={addDrugItem} className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>
                  {drugItems.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="grid grid-cols-12 gap-2 items-end bg-surface-50 dark:bg-surface-800 rounded-xl p-3"
                    >
                      <div className="col-span-3">
                        <label className="text-xs text-surface-500 dark:text-surface-400">Product</label>
                        <input className="input text-sm dark:bg-surface-700 dark:border-surface-600 dark:text-surface-50" value={item.product_name} onChange={(e) => updateDrugItem(i, 'product_name', e.target.value)} placeholder="Name" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-surface-500 dark:text-surface-400">Dosage</label>
                        <input className="input text-sm dark:bg-surface-700 dark:border-surface-600 dark:text-surface-50" value={item.dosage} onChange={(e) => updateDrugItem(i, 'dosage', e.target.value)} placeholder="e.g. 500mg" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-surface-500 dark:text-surface-400">Qty</label>
                        <input type="number" className="input text-sm dark:bg-surface-700 dark:border-surface-600 dark:text-surface-50" value={item.quantity} onChange={(e) => updateDrugItem(i, 'quantity', parseInt(e.target.value) || 1)} min={1} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-surface-500 dark:text-surface-400">Price</label>
                        <input type="number" className="input text-sm dark:bg-surface-700 dark:border-surface-600 dark:text-surface-50" value={item.unit_price} onChange={(e) => updateDrugItem(i, 'unit_price', parseFloat(e.target.value) || 0)} min={0} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-surface-500 dark:text-surface-400">Instructions</label>
                        <input className="input text-sm dark:bg-surface-700 dark:border-surface-600 dark:text-surface-50" value={item.instructions} onChange={(e) => updateDrugItem(i, 'instructions', e.target.value)} placeholder="Optional" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {drugItems.length > 1 && (
                          <button onClick={() => removeDrugItem(i)} className="p-1 text-danger-500 hover:bg-danger-500/10 rounded-lg">
                            <XIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-between bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3 border border-brand-200 dark:border-brand-800">
                  <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Total</span>
                  <span className="text-lg font-extrabold text-brand-700 dark:text-brand-400">
                    {'\u20A6'}{drugItems.reduce((sum, d) => sum + d.quantity * d.unit_price, 0).toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="label dark:text-surface-300">Prescription Notes (optional)</label>
                  <textarea
                    className="input min-h-[60px] resize-none dark:bg-surface-800 dark:border-surface-700 dark:text-surface-50"
                    value={prescNotes}
                    onChange={(e) => setPrescNotes(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleSavePrescription}
                  disabled={!diagnosis || drugItems.length === 0 || savingPresc}
                  className="btn-primary text-sm w-full"
                >
                  {savingPresc ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Prescription'}
                </button>
              </motion.div>
            )}

            {/* Existing Prescription Display */}
            {session.prescription && session.status === 'completed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-brand-50/30 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span className="text-sm font-bold text-brand-700 dark:text-brand-400">Prescription Saved</span>
                </div>
                <p className="text-sm text-surface-700 dark:text-surface-300"><strong>Diagnosis:</strong> {session.prescription.diagnosis}</p>
                <p className="text-sm text-surface-700 dark:text-surface-300 mt-1"><strong>Total:</strong> {'\u20A6'}{parseFloat(session.prescription.total_price).toLocaleString()}</p>
              </motion.div>
            )}

            {/* Recording */}
            {session.recording_url && (
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 flex items-center gap-3">
                <Mic className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">Recording Available</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Session was recorded for compliance.</p>
                </div>
                <a href={session.recording_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                  Play
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STAT_CARDS = [
  { key: 'total_sessions', label: 'Total Sessions', icon: Users, bg: 'bg-brand-50 dark:bg-brand-900/30', iconColor: 'text-brand-600 dark:text-brand-400' },
  { key: 'sessions_today', label: 'Today', icon: Clock, bg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
  { key: 'active_sessions', label: 'Active Now', icon: Activity, bg: 'bg-green-50 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
  { key: 'avg_duration_seconds', label: 'Avg Duration', icon: Timer, bg: 'bg-purple-50 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
];

export default function TelepharmacyPage() {
  const [stats, setStats] = useState<TelepharmacyStats | null>(null);
  const [sessions, setSessions] = useState<TelepharmacySession[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TelepharmacySession | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, sessionsData] = await Promise.all([
        telepharmacyApi.getStats(),
        telepharmacyApi.listSessions(page, statusFilter || undefined),
      ]);
      setStats(statsData);
      setSessions(sessionsData.items);
      setTotal(sessionsData.total);
      setPages(sessionsData.pages);
    } catch (err) {
      console.error('Failed to load telepharmacy data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSessionClick = async (s: TelepharmacySession) => {
    try {
      const full = await telepharmacyApi.getSession(s.id);
      setSelectedSession(full);
    } catch {
      setSelectedSession(s);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-white dark:bg-surface-950">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((card, i) => {
            const Icon = card.icon;
            const value = card.key === 'avg_duration_seconds'
              ? formatDuration(stats?.avg_duration_seconds)
              : (stats as any)?.[card.key] ?? 0;
            return (
              <BlurFade key={card.key} delay={i * 0.08}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bg)}>
                      <Icon className={cn('w-5 h-5', card.iconColor)} />
                    </div>
                    <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">{card.label}</p>
                  </div>
                  <p className="text-2xl font-extrabold text-surface-900 dark:text-surface-50">{value}</p>
                </motion.div>
              </BlurFade>
            );
          })}
        </div>

        {/* Actions + Filters */}
        <BlurFade delay={0.35}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    statusFilter === tab.key
                      ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-sm'
                      : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              className="btn-primary text-sm"
            >
              <Plus className="w-4 h-4" /> Start Session
            </motion.button>
          </div>
        </BlurFade>

        {/* Sessions Table */}
        <BlurFade delay={0.45}>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-surface-400 animate-spin" /></div>
            ) : sessions.length === 0 ? (
              <div className="p-12 text-center">
                <Video className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                <p className="font-semibold text-surface-600 dark:text-surface-400">No sessions found</p>
                <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Start a new telepharmacy session to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-100 dark:border-surface-800">
                      <th className="text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide px-5 py-3">Patient</th>
                      <th className="text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide px-5 py-3">Type</th>
                      <th className="text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide px-5 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide px-5 py-3">Started</th>
                      <th className="text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide px-5 py-3">Duration</th>
                      <th className="text-right text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => {
                      const typeMeta = SESSION_TYPE_META[s.session_type] || SESSION_TYPE_META.video;
                      const stMeta = STATUS_META[s.status] || STATUS_META.waiting;
                      const TIcon = typeMeta.icon;
                      return (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50/50 dark:hover:bg-surface-800/50 cursor-pointer transition-colors"
                          onClick={() => handleSessionClick(s)}
                        >
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate max-w-[200px]">{s.patient_id.slice(0, 8)}...</p>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', typeMeta.color, typeMeta.darkColor)}>
                                <TIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm text-surface-600 dark:text-surface-400">{typeMeta.label}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={cn('text-xs font-bold px-2 py-1 rounded-md', stMeta.color)}>{stMeta.label}</span>
                          </td>
                          <td className="px-5 py-3 text-sm text-surface-600 dark:text-surface-400">{formatTime(s.started_at)}</td>
                          <td className="px-5 py-3 text-sm text-surface-600 dark:text-surface-400 font-mono">{formatDuration(s.duration_seconds)}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSessionClick(s); }}
                              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                            >
                              View
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-surface-100 dark:border-surface-800">
                <p className="text-xs text-surface-500 dark:text-surface-400">{total} sessions total</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4 text-surface-600 dark:text-surface-400" />
                  </button>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300 px-2">{page} / {pages}</span>
                  <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30">
                    <ChevronRight className="w-4 h-4 text-surface-600 dark:text-surface-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </BlurFade>
      </div>

      {/* Modals */}
      {showModal && <StartSessionModal onClose={() => setShowModal(false)} onCreated={loadData} />}
      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onRefresh={async () => {
            const updated = await telepharmacyApi.getSession(selectedSession.id);
            setSelectedSession(updated);
            loadData();
          }}
        />
      )}
    </div>
  );
}
