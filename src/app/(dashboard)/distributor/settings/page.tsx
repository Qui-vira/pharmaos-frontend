'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { LoadingSpinner } from '@/components/ui';
import { Building, User, Key } from 'lucide-react';
import { orgApi, authApi, getStoredUser } from '@/lib/api';
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

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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
    if (user) {
      setProfileName(user.full_name || '');
      setProfilePhone(user.phone || '');
    }
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

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError('');
    setSuccess('');
    try {
      const updated = await authApi.updateProfile({
        full_name: profileName || undefined,
        phone: profilePhone || undefined,
      });
      const stored = getStoredUser();
      if (stored) {
        stored.full_name = updated.full_name;
        stored.phone = updated.phone || undefined;
        localStorage.setItem('pharmaos_user', JSON.stringify(stored));
      }
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Alerts */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-info-50 dark:bg-info-500/10 text-info-700 dark:text-info-400 text-sm font-medium rounded-xl border border-info-200 dark:border-info-500/20"
        >
          {success}
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm font-medium rounded-xl border border-danger-500/20"
        >
          {error}
        </motion.div>
      )}

      {/* Organization */}
      <BlurFade delay={0.05}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl p-6 space-y-5 shadow-sm"
        >
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <Building className="w-5 h-5 text-info-600 dark:text-info-400" /> Organization
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
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-info-600 hover:bg-info-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </BlurFade>

      {/* Profile */}
      <BlurFade delay={0.15}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl p-6 space-y-5 shadow-sm"
        >
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <User className="w-5 h-5 text-info-600 dark:text-info-400" /> My Profile
          </h3>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-info-100 dark:bg-info-500/10 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-info-700 dark:text-info-400">{user?.full_name?.charAt(0) || 'D'}</span>
            </div>
            <div>
              <p className="font-bold text-surface-900 dark:text-surface-50">{user?.full_name}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">{user?.email}</p>
              <p className="text-xs text-info-600 dark:text-info-400 font-semibold capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-info-600 hover:bg-info-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </div>

          <hr className="border-surface-200 dark:border-surface-700" />

          <h4 className="font-semibold text-surface-800 dark:text-surface-200 flex items-center gap-2">
            <Key className="w-4 h-4" /> Change Password
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div />
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-info-600 hover:bg-info-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {savingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </motion.div>
      </BlurFade>
    </div>
  );
}
