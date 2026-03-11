'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { getStoredUser } from '@/lib/api';
import { Building, User, Shield, Bell, Smartphone, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'org', label: 'Organization', icon: Building },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'team', label: 'Team', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Smartphone },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('org');
  const user = getStoredUser();

  return (
    <>
      <Header title="Settings" />

      <div className="p-6">
        <div className="flex gap-6">
          {/* Tabs */}
          <div className="w-56 flex-shrink-0 hidden md:block">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-surface-500 hover:bg-surface-100',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'org' && (
              <div className="card p-6 space-y-6">
                <h3 className="text-lg font-bold text-surface-900">Organization Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Organization Name</label>
                    <input className="input" defaultValue="HealthFirst Pharmacy" />
                  </div>
                  <div>
                    <label className="label">License Number</label>
                    <input className="input" defaultValue="PCN-2024-1234" />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" defaultValue="+234 801 234 5678" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="input" defaultValue="admin@healthfirst.ng" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Address</label>
                    <input className="input" defaultValue="15 Admiralty Way, Lekki Phase 1, Lagos" />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input className="input" defaultValue="Lagos" />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input className="input" defaultValue="Lagos" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="btn-primary text-sm">Save Changes</button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="card p-6 space-y-6">
                <h3 className="text-lg font-bold text-surface-900">My Profile</h3>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-brand-700">{user?.full_name?.charAt(0) || 'U'}</span>
                  </div>
                  <div>
                    <p className="font-bold text-surface-900">{user?.full_name}</p>
                    <p className="text-sm text-surface-500">{user?.email}</p>
                    <p className="text-xs text-brand-600 font-semibold capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input" defaultValue={user?.full_name} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" defaultValue={user?.phone || ''} />
                  </div>
                </div>

                <hr className="border-surface-200" />

                <h4 className="font-semibold text-surface-800 flex items-center gap-2"><Key className="w-4 h-4" /> Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Current Password</label>
                    <input type="password" className="input" />
                  </div>
                  <div />
                  <div>
                    <label className="label">New Password</label>
                    <input type="password" className="input" />
                  </div>
                  <div>
                    <label className="label">Confirm Password</label>
                    <input type="password" className="input" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="btn-primary text-sm">Update Profile</button>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-4">
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">💬</div>
                      <div>
                        <h4 className="font-bold text-surface-900">WhatsApp Cloud API</h4>
                        <p className="text-sm text-surface-500">Customer consultations, reminders, and order confirmations</p>
                      </div>
                    </div>
                    <span className="badge bg-warning-500/10 text-warning-600">Not Connected</span>
                  </div>
                  <div className="mt-4 p-3 bg-surface-50 rounded-xl">
                    <p className="text-xs font-semibold text-surface-500 mb-2">HUMAN ACTION REQUIRED</p>
                    <p className="text-sm text-surface-600">Set up a Meta Business Account, configure WhatsApp Business API, and add your credentials in the environment variables.</p>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📞</div>
                      <div>
                        <h4 className="font-bold text-surface-900">Twilio Voice</h4>
                        <p className="text-sm text-surface-500">Voice-based ordering (future module)</p>
                      </div>
                    </div>
                    <span className="badge bg-surface-200 text-surface-500">Coming Soon</span>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'team' || activeTab === 'notifications') && (
              <div className="card p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
                  {activeTab === 'team' ? <Shield className="w-8 h-8 text-surface-400" /> : <Bell className="w-8 h-8 text-surface-400" />}
                </div>
                <h3 className="font-bold text-surface-800 mb-1">{activeTab === 'team' ? 'Team Management' : 'Notification Preferences'}</h3>
                <p className="text-sm text-surface-400">Configure from the Organization Users API endpoint.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
