'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { DataTable, Pagination, LoadingSpinner, Modal } from '@/components/ui';
import { Users, Search, Eye, QrCode, X } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { patientsApi } from '@/lib/api';
import type { Patient, PaginatedResponse } from '@/types';
import Link from 'next/link';

export default function PatientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [patients, setPatients] = useState<PaginatedResponse<Patient> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

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
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-brand-700">{item.full_name.charAt(0)}</span>
          </div>
          <span className="text-sm font-semibold text-surface-800">{item.full_name}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (item: Patient) => <span className="text-sm text-surface-600">{item.phone}</span>,
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (item: Patient) => (
        <span className="text-sm text-surface-600 capitalize">{item.gender || '\u2014'}</span>
      ),
    },
    {
      key: 'date_of_birth',
      header: 'Date of Birth',
      render: (item: Patient) => (
        <span className="text-sm text-surface-600">{item.date_of_birth ? formatDate(item.date_of_birth) : '\u2014'}</span>
      ),
    },
    {
      key: 'allergies',
      header: 'Allergies',
      render: (item: Patient) => (
        <div className="flex flex-wrap gap-1">
          {item.allergies && item.allergies.length > 0
            ? item.allergies.map((a, i) => (
                <span key={i} className="badge bg-danger-500/10 text-danger-600">{a}</span>
              ))
            : <span className="text-sm text-surface-400">{'\u2014'}</span>}
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
                <span key={i} className="badge bg-warning-500/10 text-warning-600">{c}</span>
              ))
            : <span className="text-sm text-surface-400">{'\u2014'}</span>}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Registered',
      render: (item: Patient) => <span className="text-sm text-surface-500">{formatDate(item.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (item: Patient) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedPatient(item); }}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
      ),
    },
  ];

  return (
    <>
      <Header title="Patients" />

      <div className="p-6 space-y-6">
        {/* Stats bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-surface-900 tracking-tight">
                {patients?.total ?? '\u2014'}
              </p>
              <p className="text-sm text-surface-500">Total Patients</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-danger-500/10 text-danger-600 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
        )}

        {/* Table card */}
        <div className="card">
          <div className="px-5 py-4 border-b border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 w-full sm:w-80">
              <Search className="w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1 placeholder:text-surface-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-surface-400 hover:text-surface-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
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
      </div>

      {/* Patient detail modal */}
      <Modal open={!!selectedPatient} onClose={() => setSelectedPatient(null)} title="Patient Details">
        {selectedPatient && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-brand-700">{selectedPatient.full_name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-900">{selectedPatient.full_name}</h3>
                <p className="text-sm text-surface-500">{selectedPatient.phone}</p>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Gender</p>
                <p className="text-sm font-medium text-surface-800 capitalize mt-1">{selectedPatient.gender || '\u2014'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Date of Birth</p>
                <p className="text-sm font-medium text-surface-800 mt-1">
                  {selectedPatient.date_of_birth ? formatDate(selectedPatient.date_of_birth) : '\u2014'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Consent</p>
                <p className={cn('text-sm font-medium mt-1', selectedPatient.consent_given ? 'text-brand-600' : 'text-danger-500')}>
                  {selectedPatient.consent_given ? 'Given' : 'Not Given'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Registered</p>
                <p className="text-sm font-medium text-surface-800 mt-1">{formatDate(selectedPatient.created_at)}</p>
              </div>
            </div>

            {/* Allergies */}
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-2">Allergies</p>
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.allergies.map((a, i) => (
                    <span key={i} className="badge bg-danger-500/10 text-danger-600">{a}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-surface-400">None reported</p>
              )}
            </div>

            {/* Chronic Conditions */}
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-2">Chronic Conditions</p>
              {selectedPatient.chronic_conditions && selectedPatient.chronic_conditions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.chronic_conditions.map((c, i) => (
                    <span key={i} className="badge bg-warning-500/10 text-warning-600">{c}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-surface-400">None reported</p>
              )}
            </div>

            {/* Close button */}
            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedPatient(null)} className="btn-secondary text-sm">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
