'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  Video, Phone, Monitor, Shield, Smartphone, Globe,
  Clock, CheckCircle, ArrowRight, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { step: '1', title: 'Customer Walks In', desc: 'A patient arrives at your pharmacy needing a consultation.' },
  { step: '2', title: 'Staff Calls Pharmacist', desc: 'Your staff initiates a video call with a licensed remote pharmacist.' },
  { step: '3', title: 'Live Consultation', desc: 'The pharmacist consults with the patient via HD video or voice.' },
  { step: '4', title: 'Remote Prescription', desc: 'The pharmacist enters the prescription directly into PharmaOS.' },
  { step: '5', title: 'Staff Dispenses', desc: 'Your staff dispenses the medication with full audit trail.' },
];

const features = [
  { icon: Video, title: 'WebRTC Video Calls', desc: 'Crystal-clear HD video consultations in your browser' },
  { icon: Monitor, title: 'Screen Sharing', desc: 'Share prescriptions and patient records during calls' },
  { icon: CheckCircle, title: 'Live Prescription Entry', desc: 'Pharmacist enters prescriptions in real-time' },
  { icon: Shield, title: 'Call Recording', desc: 'Automatic recording for compliance and quality assurance' },
  { icon: Globe, title: 'Works on Any Device', desc: 'Desktop, tablet, or mobile — no app install needed' },
  { icon: Smartphone, title: 'Pharmacist Mobile App', desc: 'Remote pharmacists can consult from anywhere' },
];

export default function TelepharmacyPage() {
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);

  const handleNotify = () => {
    if (!email) return;
    localStorage.setItem('pharmaos_telepharmacy_notify_email', email);
    setSaved(true);
  };

  return (
    <>
      <Header title="Telepharmacy" />

      <div className="p-6 space-y-8 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="card p-8 bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <span className="badge bg-white/20 text-white mb-4">Coming Q3 2026</span>
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">
              Remote Pharmacist Consultations
            </h2>
            <p className="text-brand-100 text-lg max-w-2xl leading-relaxed">
              Connect patients with licensed pharmacists via secure video and voice calls — even when no pharmacist is physically present. Built for Nigerian pharmacies that need flexible, compliant coverage.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div>
          <h3 className="text-lg font-bold text-surface-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {steps.map((s) => (
              <div key={s.step} className="card p-4 text-center">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-extrabold text-brand-700">{s.step}</span>
                </div>
                <h4 className="text-sm font-bold text-surface-800 mb-1">{s.title}</h4>
                <p className="text-xs text-surface-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="text-lg font-bold text-surface-900 mb-4">Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card p-5">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <h4 className="text-sm font-bold text-surface-800 mb-1">{f.title}</h4>
                  <p className="text-xs text-surface-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-surface-900 mb-3">Technical Architecture</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Video Protocol', value: 'WebRTC with Twilio fallback' },
              { label: 'Connectivity', value: 'TURN/STUN servers for NAT traversal' },
              { label: 'Recordings', value: 'Encrypted S3 storage with audit logs' },
              { label: 'Latency', value: 'Optimized for Nigerian network conditions' },
            ].map((item) => (
              <div key={item.label} className="bg-surface-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-surface-500">{item.label}</p>
                <p className="text-sm font-medium text-surface-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PCN Compliance */}
        <div className="card p-6 border-brand-200 bg-brand-50/30">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-surface-900 mb-1">Nigerian PCN Compliance</h3>
              <p className="text-sm text-surface-600">
                Built to comply with the Pharmacists Council of Nigeria (PCN) regulations for remote pharmaceutical services. All consultations are recorded, prescriptions are digitally signed, and full audit trails are maintained for regulatory inspection.
              </p>
            </div>
          </div>
        </div>

        {/* Notify Me */}
        <div className="card p-6 text-center">
          <Mail className="w-8 h-8 text-brand-600 mx-auto mb-3" />
          <h3 className="font-bold text-surface-900 mb-1">Get Notified When It Launches</h3>
          <p className="text-sm text-surface-500 mb-4">Be the first to know when Telepharmacy is available.</p>
          {saved ? (
            <div className="flex items-center justify-center gap-2 text-brand-600 font-semibold">
              <CheckCircle className="w-5 h-5" /> We'll notify you at {email}
            </div>
          ) : (
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <input
                type="email"
                className="input flex-1"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button onClick={handleNotify} className="btn-primary text-sm">
                Notify Me <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
