'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui';
import { Building, User, Shield, Bell, Smartphone, Key, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { orgApi, authApi, getStoredUser } from '@/lib/api';
import type { Organization } from '@/types';

const tabs = [
  { id: 'org', label: 'Organization', icon: Building },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'team', label: 'Team', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Smartphone },
];

function TwoFactorSection() {
  const user = getStoredUser();
  const [is2faEnabled, setIs2faEnabled] = useState(user?.two_factor_enabled || false);
  const [setupMode, setSetupMode] = useState<'idle' | 'setup' | 'confirm' | 'disable'>('idle');
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading2fa, setLoading2fa] = useState(false);
  const [error2fa, setError2fa] = useState('');
  const [success2fa, setSuccess2fa] = useState('');

  const handleEnable = async () => {
    setLoading2fa(true);
    setError2fa('');
    try {
      const data = await authApi.enable2fa();
      setQrUrl(data.qr_code_url);
      setSecret(data.secret);
      setSetupMode('confirm');
    } catch (err: any) {
      setError2fa(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading2fa(false);
    }
  };

  const handleConfirm = async () => {
    if (code.length !== 6) return;
    setLoading2fa(true);
    setError2fa('');
    try {
      await authApi.confirm2fa(code);
      setIs2faEnabled(true);
      setSetupMode('idle');
      setSuccess2fa('Two-factor authentication enabled successfully.');
      setCode('');
      const stored = getStoredUser();
      if (stored) {
        stored.two_factor_enabled = true;
        localStorage.setItem('pharmaos_user', JSON.stringify(stored));
      }
    } catch (err: any) {
      setError2fa(err.message || 'Invalid code');
      setCode('');
    } finally {
      setLoading2fa(false);
    }
  };

  const handleDisable = async () => {
    if (code.length !== 6) return;
    setLoading2fa(true);
    setError2fa('');
    try {
      await authApi.disable2fa(code);
      setIs2faEnabled(false);
      setSetupMode('idle');
      setSuccess2fa('Two-factor authentication disabled.');
      setCode('');
      const stored = getStoredUser();
      if (stored) {
        stored.two_factor_enabled = false;
        localStorage.setItem('pharmaos_user', JSON.stringify(stored));
      }
    } catch (err: any) {
      setError2fa(err.message || 'Invalid code');
      setCode('');
    } finally {
      setLoading2fa(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <h3 className="text-lg font-bold text-surface-900">Two-Factor Authentication</h3>
      <p className="text-sm text-surface-500">Add an extra layer of security to your account using an authenticator app like Google Authenticator or Authy.</p>

      {success2fa && (
        <div className="p-3 bg-brand-50 text-brand-700 text-sm font-medium rounded-xl border border-brand-200">
          {success2fa}
        </div>
      )}
      {error2fa && (
        <div className="p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
          {error2fa}
        </div>
      )}

      {setupMode === 'idle' && (
        <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
          <div className="flex items-center gap-3">
            {is2faEnabled ? (
              <ShieldCheck className="w-5 h-5 text-brand-600" />
            ) : (
              <ShieldOff className="w-5 h-5 text-surface-400" />
            )}
            <div>
              <p className="font-semibold text-surface-800">
                {is2faEnabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
              </p>
              <p className="text-xs text-surface-500">
                {is2faEnabled ? 'Your account is protected with TOTP codes.' : 'Enable 2FA for enhanced security.'}
              </p>
            </div>
          </div>
          {is2faEnabled ? (
            <button
              onClick={() => { setSetupMode('disable'); setError2fa(''); setSuccess2fa(''); setCode(''); }}
              className="btn-danger text-sm"
            >
              Disable
            </button>
          ) : (
            <button
              onClick={() => { handleEnable(); setSuccess2fa(''); }}
              disabled={loading2fa}
              className="btn-primary text-sm"
            >
              {loading2fa ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable 2FA'}
            </button>
          )}
        </div>
      )}

      {setupMode === 'confirm' && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-surface-700">Scan this QR code with your authenticator app:</p>
          <div className="flex justify-center p-4 bg-white rounded-xl border border-surface-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="2FA QR Code" className="w-48 h-48" />
          </div>
          <div className="text-center">
            <p className="text-xs text-surface-500 mb-1">Or enter this key manually:</p>
            <code className="text-sm font-mono bg-surface-100 px-3 py-1.5 rounded-lg select-all">{secret}</code>
          </div>
          <div>
            <label className="label">Enter the 6-digit code to confirm</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="input text-center text-lg font-mono tracking-widest"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setSetupMode('idle'); setCode(''); setError2fa(''); }} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={code.length !== 6 || loading2fa} className="btn-primary flex-1 text-sm">
              {loading2fa ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {setupMode === 'disable' && (
        <div className="space-y-4">
          <p className="text-sm text-surface-700">Enter a code from your authenticator app to confirm disabling 2FA.</p>
          <div>
            <label className="label">6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="input text-center text-lg font-mono tracking-widest"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setSetupMode('idle'); setCode(''); setError2fa(''); }} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
            <button onClick={handleDisable} disabled={code.length !== 6 || loading2fa} className="btn-danger flex-1 text-sm">
              {loading2fa ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('org');
  const user = getStoredUser();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Org form state
  const [orgName, setOrgName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

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
        setOrg(data);
        setOrgName(data.name || '');
        setLicenseNumber(data.license_number || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setState(data.state || '');
      } catch (err: any) {
        setError(err.message || 'Failed to load organization data');
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
    // Init profile fields from stored user
    if (user) {
      setProfileName(user.full_name || '');
      setProfilePhone(user.phone || '');
    }
  }, []);

  const handleSaveOrg = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await orgApi.updateMyOrg({
        name: orgName,
        license_number: licenseNumber,
        phone,
        email,
        address,
        city,
        state,
      });
      setOrg(updated);
      setSuccess('Organization settings saved successfully.');
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
      // Update local storage
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

  if (loading) return (<><Header title="Settings" /><LoadingSpinner /></>);

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
                    onClick={() => { setActiveTab(tab.id); setSuccess(''); setError(''); }}
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
            {success && (
              <div className="mb-4 p-3 bg-brand-50 text-brand-700 text-sm font-medium rounded-xl border border-brand-200">
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
                {error}
              </div>
            )}

            {activeTab === 'org' && (
              <div className="card p-6 space-y-6">
                <h3 className="text-lg font-bold text-surface-900">Organization Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Organization Name</label>
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
                    <label className="label">Address</label>
                    <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input className="input" value={state} onChange={(e) => setState(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleSaveOrg} disabled={saving} className="btn-primary text-sm">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
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
                    <input className="input" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary text-sm">
                    {savingProfile ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>

                <hr className="border-surface-200" />

                <h4 className="font-semibold text-surface-800 flex items-center gap-2"><Key className="w-4 h-4" /> Change Password</h4>
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
                    className="btn-primary text-sm"
                  >
                    {savingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <TwoFactorSection />
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
                <p className="text-sm text-surface-400">Coming soon. Configure from the Organization Users API endpoint.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
