'use client';

import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui';
import { Building, User, Shield, Bell, Smartphone, Key, ShieldCheck, ShieldOff, Loader2, Sun, Moon, Monitor, Palette, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { orgApi, authApi, getStoredUser } from '@/lib/api';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { ShineBorder } from '@/components/shadcn/shine-border';
import { useTheme } from 'next-themes';
import type { Organization } from '@/types';

const tabs = [
  { id: 'org', label: 'Organization', icon: Building },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'team', label: 'Team', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Smartphone },
];

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function SaveButton({ saving, onClick, disabled, label = 'Save Changes', savingLabel = 'Saving...' }: {
  saving: boolean;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  savingLabel?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={saving || disabled}
      className="btn-primary text-sm relative overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {saving ? (
          <motion.span
            key="saving"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" /> {savingLabel}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function ThemeToggleSection() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const options = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes, great for low light' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follows your device preference' },
  ];

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Appearance</h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Customize how PharmaOS looks on your device.
        </p>
      </div>

      <div className="flex items-center justify-center my-6">
        <motion.div
          key={resolvedTheme}
          initial={{ rotate: -90, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 dark:from-indigo-500 dark:to-purple-600 flex items-center justify-center shadow-lg"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-10 h-10 text-white" />
          ) : (
            <Sun className="w-10 h-10 text-white" />
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isActive = theme === opt.value;
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                isActive
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-400'
                  : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 bg-surface-50 dark:bg-surface-900'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-surface-400 dark:text-surface-500')} />
              <span className={cn('text-sm font-semibold', isActive ? 'text-brand-700 dark:text-brand-400' : 'text-surface-700 dark:text-surface-300')}>
                {opt.label}
              </span>
              <span className="text-xs text-surface-400 dark:text-surface-500">{opt.description}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Two-Factor Authentication</h3>
      <p className="text-sm text-surface-500 dark:text-surface-400">Add an extra layer of security to your account using an authenticator app like Google Authenticator or Authy.</p>

      <AnimatePresence>
        {success2fa && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 text-sm font-medium rounded-xl border border-brand-200 dark:border-brand-700"
          >
            {success2fa}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {error2fa && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm font-medium rounded-xl border border-danger-500/20"
          >
            {error2fa}
          </motion.div>
        )}
      </AnimatePresence>

      {setupMode === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 rounded-xl"
        >
          <div className="flex items-center gap-3">
            {is2faEnabled ? (
              <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            ) : (
              <ShieldOff className="w-5 h-5 text-surface-400 dark:text-surface-500" />
            )}
            <div>
              <p className="font-semibold text-surface-800 dark:text-surface-200">
                {is2faEnabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {is2faEnabled ? 'Your account is protected with TOTP codes.' : 'Enable 2FA for enhanced security.'}
              </p>
            </div>
          </div>
          {is2faEnabled ? (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setSetupMode('disable'); setError2fa(''); setSuccess2fa(''); setCode(''); }}
              className="btn-danger text-sm"
            >
              Disable
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { handleEnable(); setSuccess2fa(''); }}
              disabled={loading2fa}
              className="btn-primary text-sm"
            >
              {loading2fa ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable 2FA'}
            </motion.button>
          )}
        </motion.div>
      )}

      {setupMode === 'confirm' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Scan this QR code with your authenticator app:</p>
          <div className="flex justify-center">
            <ShineBorder
              borderRadius={16}
              borderWidth={2}
              duration={10}
              color={['#6366f1', '#8b5cf6', '#06b6d4']}
              className="!p-4 !min-w-0 !w-auto bg-white dark:bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="2FA QR Code" className="w-48 h-48" />
            </ShineBorder>
          </div>
          <div className="text-center">
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Or enter this key manually:</p>
            <code className="text-sm font-mono bg-surface-100 dark:bg-surface-900 text-surface-800 dark:text-surface-200 px-3 py-1.5 rounded-lg select-all">{secret}</code>
          </div>
          <div>
            <label className="label text-surface-700 dark:text-surface-300">Enter the 6-digit code to confirm</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="input text-center text-lg font-mono tracking-widest bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSetupMode('idle'); setCode(''); setError2fa(''); }}
              className="btn-secondary flex-1 text-sm dark:border-surface-600 dark:text-surface-200 dark:hover:bg-surface-700"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              disabled={code.length !== 6 || loading2fa}
              className="btn-primary flex-1 text-sm"
            >
              {loading2fa ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Enable'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {setupMode === 'disable' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <p className="text-sm text-surface-700 dark:text-surface-300">Enter a code from your authenticator app to confirm disabling 2FA.</p>
          <div>
            <label className="label text-surface-700 dark:text-surface-300">6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="input text-center text-lg font-mono tracking-widest bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSetupMode('idle'); setCode(''); setError2fa(''); }}
              className="btn-secondary flex-1 text-sm dark:border-surface-600 dark:text-surface-200 dark:hover:bg-surface-700"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDisable}
              disabled={code.length !== 6 || loading2fa}
              className="btn-danger flex-1 text-sm"
            >
              {loading2fa ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable 2FA'}
            </motion.button>
          </div>
        </motion.div>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-surface-900 min-h-screen transition-colors">
      <BlurFade delay={0}>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-1">Settings</h1>
        <p className="text-surface-500 dark:text-surface-400 mb-6">Manage your pharmacy, profile, and security settings.</p>
      </BlurFade>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Vertical glass tab sidebar (desktop) / horizontal scroll (mobile) */}
        <BlurFade delay={0.05}>
          <nav className="md:w-56 flex-shrink-0">
            {/* Mobile: horizontal scroll */}
            <div className="md:hidden flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setActiveTab(tab.id); setSuccess(''); setError(''); }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                        : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </motion.button>
                );
              })}
            </div>
            {/* Desktop: vertical glass sidebar */}
            <div className="hidden md:block rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-2 shadow-sm">
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setActiveTab(tab.id); setSuccess(''); setError(''); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        activeTab === tab.id
                          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 shadow-sm'
                          : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </nav>
        </BlurFade>

        {/* Content */}
        <div className="flex-1">
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 text-sm font-medium rounded-xl border border-brand-200 dark:border-brand-700"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm font-medium rounded-xl border border-danger-500/20"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'org' && (
              <motion.div
                key="org"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 shadow-sm space-y-6"
              >
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Organization Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">Organization Name</label>
                    <input className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">License Number</label>
                    <input className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">Phone</label>
                    <input className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">Email</label>
                    <input className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label text-surface-700 dark:text-surface-300">Address</label>
                    <input className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">City</label>
                    <input className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">State</label>
                    <input className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={state} onChange={(e) => setState(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <SaveButton saving={saving} onClick={handleSaveOrg} />
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 shadow-sm space-y-6"
              >
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">My Profile</h3>

                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl font-bold text-brand-700 dark:text-brand-400">{user?.full_name?.charAt(0) || 'U'}</span>
                  </motion.div>
                  <div>
                    <p className="font-bold text-surface-900 dark:text-surface-50">{user?.full_name}</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{user?.email}</p>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">Full Name</label>
                    <input className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">Phone</label>
                    <input className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <SaveButton saving={savingProfile} onClick={handleSaveProfile} label="Update Profile" savingLabel="Saving..." />
                </div>

                <hr className="border-surface-200 dark:border-surface-700" />

                <h4 className="font-semibold text-surface-800 dark:text-surface-200 flex items-center gap-2"><Key className="w-4 h-4" /> Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">Current Password</label>
                    <input type="password" className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </div>
                  <div />
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">New Password</label>
                    <input type="password" className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-surface-700 dark:text-surface-300">Confirm Password</label>
                    <input type="password" className="input bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <SaveButton
                    saving={savingPassword}
                    onClick={handleChangePassword}
                    disabled={!currentPassword || !newPassword}
                    label="Change Password"
                    savingLabel="Changing..."
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TwoFactorSection />
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <ThemeToggleSection />
              </motion.div>
            )}

            {activeTab === 'integrations' && (
              <motion.div
                key="integrations"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-surface-900 dark:text-surface-50">WhatsApp Cloud API</h4>
                        <p className="text-sm text-surface-500 dark:text-surface-400">Customer consultations, reminders, and order confirmations</p>
                      </div>
                    </div>
                    <span className="badge bg-warning-500/10 text-warning-600 dark:text-warning-400">Not Connected</span>
                  </div>
                  <div className="mt-4 p-3 bg-surface-50 dark:bg-surface-900 rounded-xl">
                    <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2">HUMAN ACTION REQUIRED</p>
                    <p className="text-sm text-surface-600 dark:text-surface-300">Set up a Meta Business Account, configure WhatsApp Business API, and add your credentials in the environment variables.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-surface-900 dark:text-surface-50">Twilio Voice</h4>
                        <p className="text-sm text-surface-500 dark:text-surface-400">Voice-based ordering (future module)</p>
                      </div>
                    </div>
                    <span className="badge bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400">Coming Soon</span>
                  </div>
                </div>
              </motion.div>
            )}

            {(activeTab === 'team' || activeTab === 'notifications') && (
              <motion.div
                key={activeTab}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-12 flex flex-col items-center justify-center text-center shadow-sm"
              >
                <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center mb-4">
                  {activeTab === 'team' ? <Shield className="w-8 h-8 text-surface-400 dark:text-surface-500" /> : <Bell className="w-8 h-8 text-surface-400 dark:text-surface-500" />}
                </div>
                <h3 className="font-bold text-surface-800 dark:text-surface-200 mb-1">{activeTab === 'team' ? 'Team Management' : 'Notification Preferences'}</h3>
                <p className="text-sm text-surface-400 dark:text-surface-500">Coming soon. Configure from the Organization Users API endpoint.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
