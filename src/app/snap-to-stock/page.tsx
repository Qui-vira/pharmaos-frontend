'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  Camera, Scan, Package, CheckCircle, Cpu, Globe,
  ArrowRight, Mail, Zap, Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { step: '1', title: 'Open App', desc: 'Launch PharmaOS on your phone or tablet.' },
  { step: '2', title: 'Point Camera', desc: 'Aim your device camera at any shelf or product.' },
  { step: '3', title: 'AI Reads Labels', desc: 'GPT-4 Vision identifies product names, strengths, and batch info.' },
  { step: '4', title: 'NAFDAC Match', desc: 'Automatically matches against 8,583 NAFDAC-registered products.' },
  { step: '5', title: 'Confirm & Add', desc: 'Review matches and add to your inventory in one tap.' },
];

const features = [
  { icon: Cpu, title: 'GPT-4 Vision Recognition', desc: 'AI reads drug labels, strengths, and manufacturer info from photos' },
  { icon: Package, title: 'NAFDAC Catalog Matching', desc: 'Matches against 8,583 registered Nigerian pharmaceutical products' },
  { icon: Scan, title: 'Batch & Expiry Scanning', desc: 'Reads batch numbers and expiry dates from packaging' },
  { icon: Globe, title: 'Nigerian Packaging', desc: 'Trained on local drug packaging formats and label styles' },
  { icon: Zap, title: 'Drugs, Devices & Consumables', desc: 'Works with pharmaceuticals, medical devices, and consumables' },
  { icon: Smartphone, title: 'Offline Mode with Sync', desc: 'Scan offline and sync when connection is restored' },
];

export default function SnapToStockPage() {
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);

  const handleNotify = () => {
    if (!email) return;
    localStorage.setItem('pharmaos_snapstock_notify_email', email);
    setSaved(true);
  };

  return (
    <>
      <Header title="Snap to Stock" />

      <div className="p-6 space-y-8 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="card p-8 bg-gradient-to-br from-surface-800 to-surface-950 text-white border-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <span className="badge bg-white/20 text-white mb-4">Coming Q4 2026</span>
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">
              AI Camera-Based Inventory
            </h2>
            <p className="text-surface-300 text-lg max-w-2xl leading-relaxed">
              Point your phone at any shelf and let AI do the rest. Snap to Stock uses computer vision to read drug labels, match products against the NAFDAC catalog, and add them to your inventory — no manual data entry required.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div>
          <h3 className="text-lg font-bold text-surface-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {steps.map((s) => (
              <div key={s.step} className="card p-4 text-center">
                <div className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-extrabold text-surface-700">{s.step}</span>
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
                  <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-surface-700" />
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
              { label: 'Vision Engine', value: 'OpenAI GPT-4 Vision API' },
              { label: 'Camera Access', value: 'HTML5 Camera API (MediaDevices)' },
              { label: 'Product Matching', value: 'Product alias matching pipeline with fuzzy search' },
              { label: 'Detection', value: 'Bounding box detection for multi-product shelves' },
            ].map((item) => (
              <div key={item.label} className="bg-surface-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-surface-500">{item.label}</p>
                <p className="text-sm font-medium text-surface-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notify Me */}
        <div className="card p-6 text-center">
          <Camera className="w-8 h-8 text-surface-700 mx-auto mb-3" />
          <h3 className="font-bold text-surface-900 mb-1">Get Notified When It Launches</h3>
          <p className="text-sm text-surface-500 mb-4">Be the first to try AI-powered shelf scanning.</p>
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
