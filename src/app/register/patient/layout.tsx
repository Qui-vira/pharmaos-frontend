'use client';

import { Pill } from 'lucide-react';

export default function PatientRegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Pill className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm text-surface-900 tracking-tight">PharmaOS</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
