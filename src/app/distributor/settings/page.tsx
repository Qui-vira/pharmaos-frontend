'use client';

import Header from '@/components/layout/Header';
import { getStoredUser } from '@/lib/api';
import { Building, User, Key } from 'lucide-react';

export default function DistributorSettingsPage() {
  const user = getStoredUser();

  return (
    <>
      <Header title="Settings" />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Organization */}
        <div className="card p-6 space-y-5">
          <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" /> Organization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name</label>
              <input className="input" defaultValue="ABC Pharma Distributors" />
            </div>
            <div>
              <label className="label">License Number</label>
              <input className="input" defaultValue="DIS-2024-5678" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" defaultValue="+234 801 555 0000" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" defaultValue="admin@abcpharma.ng" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Warehouse Address</label>
              <input className="input" defaultValue="42 Industrial Avenue, Ikeja, Lagos" />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary text-sm" style={{ background: '#2563eb' }}>Save Changes</button>
          </div>
        </div>

        {/* Profile */}
        <div className="card p-6 space-y-5">
          <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> My Profile
          </h3>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-blue-700">{user?.full_name?.charAt(0) || 'D'}</span>
            </div>
            <div>
              <p className="font-bold text-surface-900">{user?.full_name}</p>
              <p className="text-sm text-surface-500">{user?.email}</p>
              <p className="text-xs text-blue-600 font-semibold capitalize">{user?.role?.replace('_', ' ')}</p>
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
              <label className="label">New Password</label>
              <input type="password" className="input" />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" />
            </div>
          </div>

          <div className="flex justify-end">
            <button className="btn-primary text-sm" style={{ background: '#2563eb' }}>Update Profile</button>
          </div>
        </div>
      </div>
    </>
  );
}
