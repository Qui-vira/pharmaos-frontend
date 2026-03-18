'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui';
import { Building, User, Key } from 'lucide-react';
import { orgApi, getStoredUser } from '@/lib/api';
import type { Organization } from '@/types';

export default function DistributorSettingsPage() {
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [orgName, setOrgName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    async function loadOrg() {
      setLoading(true);
      try {
        const data = await orgApi.getMyOrg();
        setOrgName(data.name || '');
        setLicenseNumber(data.license_number || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
      } catch (err: any) {
        setError(err.message || 'Failed to load organization data');
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await orgApi.updateMyOrg({
        name: orgName,
        license_number: licenseNumber,
        phone,
        email,
        address,
      });
      setSuccess('Settings saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (<><Header title="Settings" /><LoadingSpinner /></>);

  return (
    <>
      <Header title="Settings" />

      <div className="p-6 space-y-6 max-w-3xl">
        {success && (
          <div className="p-3 bg-brand-50 text-brand-700 text-sm font-medium rounded-xl border border-brand-200">
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
            {error}
          </div>
        )}

        {/* Organization */}
        <div className="card p-6 space-y-5">
          <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" /> Organization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name</label>
              <input className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div>
              <label className="label">License Number</label>
              <input className="input" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Warehouse Address</label>
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm" style={{ background: '#2563eb' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
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
