'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { orgApi, patientsApi } from '@/lib/api';

interface PharmacyInfo {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  phone: string | null;
}

export default function PatientSelfRegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>}>
      <PatientSelfRegisterInner />
    </Suspense>
  );
}

function PatientSelfRegisterInner() {
  const searchParams = useSearchParams();
  const pharmacyId = searchParams.get('pharmacy');

  const [pharmacy, setPharmacy] = useState<PharmacyInfo | null>(null);
  const [loadingPharmacy, setLoadingPharmacy] = useState(true);
  const [pharmacyError, setPharmacyError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+234');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!pharmacyId) {
      setPharmacyError('Invalid registration link. Please scan the QR code again.');
      setLoadingPharmacy(false);
      return;
    }
    orgApi.getPublicInfo(pharmacyId)
      .then(setPharmacy)
      .catch(() => setPharmacyError('Pharmacy not found. Please check the link and try again.'))
      .finally(() => setLoadingPharmacy(false));
  }, [pharmacyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyId || !consent) return;

    setSubmitting(true);
    setError('');
    try {
      await patientsApi.selfRegister({
        org_id: pharmacyId,
        full_name: fullName.trim(),
        phone: phone.trim(),
        date_of_birth: dob || undefined,
        gender: gender || undefined,
        allergies: allergies ? allergies.split(',').map((a) => a.trim()).filter(Boolean) : undefined,
        chronic_conditions: conditions ? conditions.split(',').map((c) => c.trim()).filter(Boolean) : undefined,
        consent_given: true,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPharmacy) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (pharmacyError) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-surface-900 mb-2">Invalid Link</h1>
        <p className="text-surface-500">{pharmacyError}</p>
      </div>
    );
  }

  if (success) {
    const whatsappNumber = pharmacy?.phone?.replace(/[^0-9]/g, '') || '';
    const waLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';

    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-surface-900 mb-2">You&apos;re registered!</h1>
        <p className="text-surface-500 mb-6">
          You&apos;ve been registered at <span className="font-semibold text-surface-700">{pharmacy?.name}</span>.
        </p>

        {pharmacy?.phone && (
          <div className="card p-5 text-left mb-4">
            <p className="text-sm text-surface-500 mb-2">
              Save this number to message your pharmacist on WhatsApp:
            </p>
            <p className="text-lg font-bold text-surface-900 mb-3">{pharmacy.phone}</p>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            )}
          </div>
        )}

        <p className="text-xs text-surface-400 mt-4">
          You may receive health-related messages from this pharmacy via WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-xl font-extrabold text-surface-900">Register at {pharmacy?.name}</h1>
        {pharmacy?.city && (
          <p className="text-sm text-surface-500 mt-1">
            {pharmacy.city}{pharmacy.state ? `, ${pharmacy.state}` : ''}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name <span className="text-danger-500">*</span></label>
          <input
            className="input"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={2}
          />
        </div>

        <div>
          <label className="label">WhatsApp Number <span className="text-danger-500">*</span></label>
          <input
            className="input"
            type="tel"
            placeholder="+2348012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <p className="text-xs text-surface-400 mt-1">Include country code (e.g. +234 for Nigeria)</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date of Birth</label>
            <input
              className="input"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Allergies</label>
          <input
            className="input"
            placeholder="e.g. Penicillin, Aspirin (comma separated)"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Chronic Conditions</label>
          <input
            className="input"
            placeholder="e.g. Diabetes, Hypertension (comma separated)"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
          />
        </div>

        <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            required
          />
          <label htmlFor="consent" className="text-sm text-surface-600">
            I agree to receive health-related messages via WhatsApp from{' '}
            <span className="font-semibold">{pharmacy?.name}</span>, including medication reminders
            and consultation updates.
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting || !consent || !fullName.trim() || phone.length < 10}
          className="btn-primary w-full"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
          ) : (
            'Register'
          )}
        </button>
      </form>

      <p className="text-xs text-center text-surface-400 mt-6">
        Powered by PharmaOS AI
      </p>
    </div>
  );
}
