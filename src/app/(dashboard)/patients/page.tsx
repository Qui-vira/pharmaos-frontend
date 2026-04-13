'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { DataTable, Pagination, LoadingSpinner } from '@/components/ui';
import { Users, Search, Eye, X, Phone, Calendar, Shield, Heart, AlertTriangle, ChevronRight } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { patientsApi } from '@/lib/api';
import type { Patient, PaginatedResponse } from '@/types';

type DetailTab = 'overview' | 'conditions' | 'history';

export default function PatientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [patients, setPatients] = useState<PaginatedResponse<Patient> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [searchFocused, setSearchFocused] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await patientsApi.list(page, debouncedSearch || undefined);
      setPatients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const columns = [
    {
      key: 'full_name',
      header: 'Full Name',
      render: (item: Patient) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-brand-700 dark:text-brand-300">{item.full_name.charAt(0)}</span>
          </div>
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">{item.full_name}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (item: Patient) => <span className="text-sm text-surface-600 dark:text-surface-400">{item.phone}</span>,
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (item: Patient) => (
        <span className="text-sm text-surface-600 dark:text-surface-400 capitalize">{item.gender || '\u2014'}</span>
      ),
    },
    {
      key: 'date_of_birth',
      header: 'Date of Birth',
      render: (item: Patient) => (
        <span className="text-sm text-surface-600 dark:text-surface-400">{item.date_of_birth ? formatDate(item.date_of_birth) : '\u2014'}</span>
      ),
    },
    {
      key: 'allergies',
      header: 'Allergies',
      render: (item: Patient) => (
        <div className="flex flex-wrap gap-1">
          {item.allergies && item.allergies.length > 0
            ? item.allergies.map((a, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-500/10 dark:bg-danger-500/20 text-danger-600 dark:text-danger-400 border border-danger-500/20 dark:border-danger-500/30">{a}</span>
              ))
            : <span className="text-sm text-surface-400 dark:text-surface-500">{'\u2014'}</span>}
        </div>
      ),
    },
    {
      key: 'chronic_conditions',
      header: 'Chronic Conditions',
      render: (item: Patient) => (
        <div className="flex flex-wrap gap-1">
          {item.chronic_conditions && item.chronic_conditions.length > 0
            ? item.chronic_conditions.map((c, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-500/10 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400 border border-warning-500/20 dark:border-warning-500/30">{c}</span>
              ))
            : <span className="text-sm text-surface-400 dark:text-surface-500">{'\u2014'}</span>}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Registered',
      render: (item: Patient) => <span className="text-sm text-surface-500 dark:text-surface-400">{formatDate(item.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (item: Patient) => (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); setSelectedPatient(item); setDetailTab('overview'); }}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </motion.button>
      ),
    },
  ];

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'conditions', label: 'Conditions' },
    { key: 'history', label: 'History' },
  ];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="p-6 space-y-6">
        {/* Stats bar */}
        <BlurFade delay={0.05}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 dark:bg-brand-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
                  {patients?.total ?? '\u2014'}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400">Total Patients</p>
              </div>
            </div>
          </div>
        </BlurFade>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-danger-500/10 dark:bg-danger-500/20 text-danger-600 dark:text-danger-400 px-4 py-3 rounded-xl text-sm font-medium border border-danger-500/20 dark:border-danger-500/30"
          >
            {error}
          </motion.div>
        )}

        {/* Table card */}
        <BlurFade delay={0.1}>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Animated Search */}
              <motion.div
                animate={{
                  width: searchFocused ? 384 : 320,
                  boxShadow: searchFocused ? '0 0 0 3px rgba(var(--brand-500), 0.15)' : '0 0 0 0px transparent',
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex items-center gap-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl px-3 py-2"
              >
                <Search className={cn(
                  'w-4 h-4 transition-colors',
                  searchFocused ? 'text-brand-500' : 'text-surface-400 dark:text-surface-500',
                )} />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="bg-transparent text-sm outline-none flex-1 placeholder:text-surface-400 dark:placeholder:text-surface-500 text-surface-900 dark:text-surface-100"
                />
                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearch('')}
                      className="text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {loading ? <LoadingSpinner /> : (
              <>
                <DataTable
                  columns={columns}
                  data={patients?.items || []}
                  emptyMessage="No patients registered yet. Share your QR code to get patients."
                />
                {patients && <Pagination page={patients.page} pages={patients.pages} total={patients.total} onPageChange={setPage} />}
              </>
            )}
          </div>
        </BlurFade>
      </div>

      {/* Slide-in Patient Detail Panel */}
      <AnimatePresence>
        {selectedPatient && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40"
              onClick={() => setSelectedPatient(null)}
            />

            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-white dark:bg-surface-800 border-l border-surface-200 dark:border-surface-700 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Close button */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">Patient Details</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedPatient(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Patient Card - Glass Style */}
                <BlurFade delay={0.05}>
                  <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-700/30 backdrop-blur-sm p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-brand-700 dark:text-brand-300">{selectedPatient.full_name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 truncate">{selectedPatient.full_name}</h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> {selectedPatient.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </BlurFade>

                {/* Tabs */}
                <BlurFade delay={0.1}>
                  <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-700 rounded-xl">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setDetailTab(tab.key)}
                        className={cn(
                          'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                          detailTab === tab.key
                            ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-50 shadow-sm'
                            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300',
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </BlurFade>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {detailTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700/40 p-4">
                          <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Gender</p>
                          <p className="text-sm font-medium text-surface-800 dark:text-surface-200 capitalize mt-1">{selectedPatient.gender || '\u2014'}</p>
                        </div>
                        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700/40 p-4">
                          <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Date of Birth
                          </p>
                          <p className="text-sm font-medium text-surface-800 dark:text-surface-200 mt-1">
                            {selectedPatient.date_of_birth ? formatDate(selectedPatient.date_of_birth) : '\u2014'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700/40 p-4">
                          <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Consent
                          </p>
                          <p className={cn('text-sm font-medium mt-1', selectedPatient.consent_given ? 'text-brand-600 dark:text-brand-400' : 'text-danger-500 dark:text-danger-400')}>
                            {selectedPatient.consent_given ? 'Given' : 'Not Given'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700/40 p-4">
                          <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Registered</p>
                          <p className="text-sm font-medium text-surface-800 dark:text-surface-200 mt-1">{formatDate(selectedPatient.created_at)}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {detailTab === 'conditions' && (
                    <motion.div
                      key="conditions"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      {/* Allergies */}
                      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700/40 p-4">
                        <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-danger-500" /> Allergies
                        </p>
                        {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedPatient.allergies.map((a, i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-danger-500/10 dark:bg-danger-500/20 text-danger-600 dark:text-danger-400 border border-danger-500/20 dark:border-danger-500/30"
                              >
                                {a}
                              </motion.span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-surface-400 dark:text-surface-500">None reported</p>
                        )}
                      </div>

                      {/* Chronic Conditions */}
                      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700/40 p-4">
                        <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-warning-500" /> Chronic Conditions
                        </p>
                        {selectedPatient.chronic_conditions && selectedPatient.chronic_conditions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedPatient.chronic_conditions.map((c, i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning-500/10 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400 border border-warning-500/20 dark:border-warning-500/30"
                              >
                                {c}
                              </motion.span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-surface-400 dark:text-surface-500">None reported</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {detailTab === 'history' && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700/40 p-6 flex flex-col items-center justify-center text-center">
                        <Calendar className="w-8 h-8 text-surface-300 dark:text-surface-600 mb-2" />
                        <p className="text-sm text-surface-500 dark:text-surface-400">Patient history will appear here as consultations accumulate.</p>
                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Registered on {formatDate(selectedPatient.created_at)}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Close button */}
                <div className="flex justify-end pt-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedPatient(null)}
                    className="btn-secondary text-sm"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
