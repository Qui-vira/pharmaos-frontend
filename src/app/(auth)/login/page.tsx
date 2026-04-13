'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Shield, RefreshCw } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authApi } from '@/lib/api';
import { Globe } from '@/components/shadcn/globe';
import { Particles } from '@/components/shadcn/particles';
import { ShineBorder } from '@/components/shadcn/shine-border';
import { motion, AnimatePresence } from 'framer-motion';

type AuthStep = 'login' | 'register' | 'verify-email' | 'verify-2fa';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// Nigeria-focused globe config
const NIGERIA_GLOBE_CONFIG: any = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.15,
  dark: 1,
  diffuse: 3,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [0.3, 0.3, 0.3],
  markerColor: [0.4, 0.7, 1],
  glowColor: [0.15, 0.2, 0.4],
  markers: [
    // Lagos
    { location: [6.5244, 3.3792], size: 0.12 },
    // Abuja
    { location: [9.0579, 7.4951], size: 0.1 },
    // Port Harcourt
    { location: [4.8156, 7.0498], size: 0.08 },
    // Kano
    { location: [12.0022, 8.5919], size: 0.08 },
    // Ibadan
    { location: [7.3775, 3.947], size: 0.07 },
    // Enugu
    { location: [6.4584, 7.5464], size: 0.06 },
    // Benin City
    { location: [6.335, 5.6037], size: 0.06 },
    // Kaduna
    { location: [10.5105, 7.4165], size: 0.06 },
  ],
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
  }),
};

const errorVariants = {
  hidden: { opacity: 0, y: -8, height: 0 },
  visible: { opacity: 1, y: 0, height: 'auto' },
  exit: { opacity: 0, y: -8, height: 0 },
};

function OtpInputs({
  length = 6,
  value,
  onChange,
  disabled,
}: {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = value.split('');
    arr[idx] = char;
    const next = arr.join('').slice(0, length);
    onChange(next);
    if (char && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all disabled:opacity-50"
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [direction, setDirection] = useState(0);

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register
  const [regData, setRegData] = useState({
    org_name: '', org_type: 'pharmacy', admin_email: '', admin_password: '',
    admin_full_name: '', phone: '', city: '', state: '',
  });

  // Email verification
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiryTimer, setExpiryTimer] = useState(600); // 10 minutes

  // 2FA
  const [twoFaCode, setTwoFaCode] = useState('');
  const [tempToken, setTempToken] = useState('');

  // Google OAuth — new user org selection
  const [googleNewUser, setGoogleNewUser] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [googleOrgType, setGoogleOrgType] = useState('pharmacy');
  const [googleOrgName, setGoogleOrgName] = useState('');

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // OTP expiry timer
  useEffect(() => {
    if (step !== 'verify-email' || expiryTimer <= 0) return;
    const t = setTimeout(() => setExpiryTimer(expiryTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [step, expiryTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.login(email, password);
      if (data.requires_verification) {
        setVerifyEmail(data.email || email);
        setDirection(1);
        setStep('verify-email');
        setExpiryTimer(600);
        setResendCooldown(60);
      } else if (data.requires_2fa && data.temp_token) {
        setTempToken(data.temp_token);
        setDirection(1);
        setStep('verify-2fa');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.register(regData);
      if (data.requires_verification) {
        setVerifyEmail(data.email || regData.admin_email);
        setDirection(1);
        setStep('verify-email');
        setExpiryTimer(600);
        setResendCooldown(60);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const data = await authApi.verifyEmail(verifyEmail, code);
      if (data.requires_2fa && data.temp_token) {
        setTempToken(data.temp_token);
        setDirection(1);
        setStep('verify-2fa');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  }, [verifyEmail, router]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6 && step === 'verify-email') {
      handleVerifyEmail(otpCode);
    }
  }, [otpCode, step, handleVerifyEmail]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.resendCode(verifyEmail);
      setResendCooldown(60);
      setExpiryTimer(600);
      setOtpCode('');
    } catch {
      // silent — anti-enumeration
    }
  };

  const handleVerify2fa = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await authApi.verify2fa(code, tempToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '2FA verification failed');
      setTwoFaCode('');
    } finally {
      setLoading(false);
    }
  }, [tempToken, router]);

  useEffect(() => {
    if (twoFaCode.length === 6 && step === 'verify-2fa') {
      handleVerify2fa(twoFaCode);
    }
  }, [twoFaCode, step, handleVerify2fa]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const id_token = credentialResponse.credential;
    if (!id_token) return;
    setLoading(true);
    setError('');
    try {
      const data = await authApi.googleAuth(id_token);
      if (data.requires_2fa && data.temp_token) {
        setTempToken(data.temp_token);
        setDirection(1);
        setStep('verify-2fa');
      } else if (data.access_token) {
        router.push('/dashboard');
      } else {
        // New user — need org details
        setGoogleIdToken(id_token);
        setGoogleNewUser(true);
      }
    } catch (err: any) {
      // If the error indicates new user needs org info
      if (err.message?.includes('org_name')) {
        setGoogleIdToken(id_token);
        setGoogleNewUser(true);
      } else {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.googleAuth(googleIdToken, googleOrgType, googleOrgName);
      if (data.access_token) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to get current step key for AnimatePresence
  const getStepKey = () => {
    if (googleNewUser) return 'google-org';
    return step;
  };

  // ── Error banner component ──
  const ErrorBanner = ({ message }: { message: string }) => (
    <AnimatePresence>
      {message && (
        <motion.div
          variants={errorVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25 }}
          className="p-3 bg-danger-500/10 dark:bg-danger-500/20 text-danger-600 dark:text-danger-400 text-sm font-medium rounded-xl border border-danger-500/20 dark:border-danger-500/30 overflow-hidden"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Render sections ──

  const renderVerifyEmail = () => (
    <div className="space-y-6">
      <button onClick={() => { setDirection(-1); setStep('login'); setError(''); }} className="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to login
      </button>
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-surface-900 dark:text-white tracking-tight">Check your email</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-2">
          We sent a 6-digit code to <span className="font-semibold text-surface-700 dark:text-surface-200">{verifyEmail}</span>
        </p>
      </div>

      <ErrorBanner message={error} />

      <OtpInputs value={otpCode} onChange={setOtpCode} disabled={loading} />

      <div className="text-center text-sm text-surface-500 dark:text-surface-400">
        {expiryTimer > 0 ? (
          <p>Code expires in <span className="font-semibold text-surface-700 dark:text-surface-200">{formatTime(expiryTimer)}</span></p>
        ) : (
          <p className="text-danger-600 dark:text-danger-400 font-medium">Code expired. Please resend.</p>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:text-surface-400 dark:disabled:text-surface-600 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );

  const renderVerify2fa = () => (
    <div className="space-y-6">
      <button onClick={() => { setDirection(-1); setStep('login'); setError(''); setTwoFaCode(''); }} className="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to login
      </button>
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-surface-900 dark:text-white tracking-tight">Two-factor authentication</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-2">Enter the 6-digit code from your authenticator app.</p>
      </div>

      <ErrorBanner message={error} />

      <OtpInputs value={twoFaCode} onChange={setTwoFaCode} disabled={loading} />

      {loading && (
        <p className="text-center text-sm text-surface-500 dark:text-surface-400">Verifying...</p>
      )}
    </div>
  );

  const renderGoogleOrgForm = () => (
    <div className="space-y-6">
      <button onClick={() => { setGoogleNewUser(false); setError(''); }} className="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-surface-900 dark:text-white tracking-tight">Set up your organization</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">One more step to complete your Google sign-up.</p>
      </div>

      <ErrorBanner message={error} />

      <form onSubmit={handleGoogleOrgSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Organization Name</label>
          <input
            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-400 dark:placeholder:text-surface-500"
            placeholder="HealthFirst Pharmacy"
            value={googleOrgName}
            onChange={(e) => setGoogleOrgName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Organization Type</label>
          <select
            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            value={googleOrgType}
            onChange={(e) => setGoogleOrgType(e.target.value)}
          >
            <option value="pharmacy">Pharmacy</option>
            <option value="distributor">Distributor</option>
            <option value="wholesaler">Wholesaler</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors">
          {loading ? 'Creating account...' : 'Complete sign-up'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );

  const renderLoginForm = () => (
    <>
      <h1 className="text-2xl font-extrabold text-surface-900 dark:text-white tracking-tight">Welcome back</h1>
      <p className="text-surface-500 dark:text-surface-400 mt-1 mb-6">Sign in to your PharmaOS dashboard.</p>

      <ErrorBanner message={error} />

      <form onSubmit={handleLogin} className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
          <input type="email" className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-400 dark:placeholder:text-surface-500" placeholder="admin@pharmacy.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-400 dark:placeholder:text-surface-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors">
          {loading ? 'Signing in...' : 'Sign in'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      {GOOGLE_CLIENT_ID && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200 dark:border-surface-700" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm px-3 text-surface-400 dark:text-surface-500 font-medium">OR</span></div>
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed')}
              theme="outline"
              size="large"
              width="100%"
              text="signin_with"
            />
          </div>
        </>
      )}

      <p className="text-sm text-center mt-6 text-surface-500 dark:text-surface-400">
        Don&apos;t have an account?{' '}
        <button onClick={() => { setDirection(1); setStep('register'); setError(''); }} className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
          Register
        </button>
      </p>
    </>
  );

  const renderRegisterForm = () => (
    <>
      <h1 className="text-2xl font-extrabold text-surface-900 dark:text-white tracking-tight">Create your account</h1>
      <p className="text-surface-500 dark:text-surface-400 mt-1 mb-6">Set up your pharmacy or distributor account.</p>

      <ErrorBanner message={error} />

      <form onSubmit={handleRegister} className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Organization Name</label>
          <input className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-400 dark:placeholder:text-surface-500" placeholder="HealthFirst Pharmacy" value={regData.org_name} onChange={(e) => setRegData({ ...regData, org_name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Organization Type</label>
          <select className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" value={regData.org_type} onChange={(e) => setRegData({ ...regData, org_type: e.target.value })}>
            <option value="pharmacy">Pharmacy</option>
            <option value="distributor">Distributor</option>
            <option value="wholesaler">Wholesaler</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Full Name</label>
            <input className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-400 dark:placeholder:text-surface-500" placeholder="John Okafor" value={regData.admin_full_name} onChange={(e) => setRegData({ ...regData, admin_full_name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Phone</label>
            <input className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-400 dark:placeholder:text-surface-500" placeholder="08012345678" value={regData.phone} onChange={(e) => setRegData({ ...regData, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
          <input type="email" className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-400 dark:placeholder:text-surface-500" placeholder="admin@pharmacy.com" value={regData.admin_email} onChange={(e) => setRegData({ ...regData, admin_email: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
          <input type="password" className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-400 dark:placeholder:text-surface-500" placeholder="Min. 8 characters" value={regData.admin_password} onChange={(e) => setRegData({ ...regData, admin_password: e.target.value })} required minLength={8} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">City</label>
            <input className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-400 dark:placeholder:text-surface-500" placeholder="Lagos" value={regData.city} onChange={(e) => setRegData({ ...regData, city: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">State</label>
            <input className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-surface-400 dark:placeholder:text-surface-500" placeholder="Lagos" value={regData.state} onChange={(e) => setRegData({ ...regData, state: e.target.value })} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors">
          {loading ? 'Creating account...' : 'Create account'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      {GOOGLE_CLIENT_ID && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200 dark:border-surface-700" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm px-3 text-surface-400 dark:text-surface-500 font-medium">OR</span></div>
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed')}
              theme="outline"
              size="large"
              width="100%"
              text="signup_with"
            />
          </div>
        </>
      )}

      <p className="text-sm text-center mt-6 text-surface-500 dark:text-surface-400">
        Already have an account?{' '}
        <button onClick={() => { setDirection(-1); setStep('login'); setError(''); }} className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </>
  );

  return (
    <div className="min-h-screen flex bg-white dark:bg-surface-950">
      {/* Left panel — Globe + Stats */}
      <div className="hidden lg:flex w-[45%] bg-surface-950 relative overflow-hidden flex-col justify-between p-12">
        {/* Particles overlay */}
        <Particles
          className="absolute inset-0 z-[1]"
          quantity={60}
          color="#6b8afd"
          size={0.5}
          staticity={40}
          ease={60}
        />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-[96px]" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">PharmaOS AI</span>
          </div>
        </div>

        {/* Globe */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative w-[420px] h-[420px]">
            <Globe
              config={NIGERIA_GLOBE_CONFIG}
            />

          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight mb-3">
            Intelligent pharmacy<br />management, simplified.
          </h2>
          <p className="text-surface-400 text-base leading-relaxed max-w-md">
            AI-powered inventory, smart ordering, patient reminders, and real-time analytics - built for Nigerian pharmacies.
          </p>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-surface-50 via-white to-surface-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-surface-900 dark:text-white">PharmaOS AI</span>
          </div>

          <ShineBorder
            borderRadius={24}
            borderWidth={1.5}
            duration={10}
            color={['#6b8afd', '#a78bfa', '#38bdf8']}
            className="!w-full !min-w-0 !bg-white/70 dark:!bg-surface-900/70 backdrop-blur-2xl !p-8 shadow-xl dark:shadow-2xl dark:shadow-brand-500/5"
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={getStepKey()}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full"
              >
                {googleNewUser ? renderGoogleOrgForm()
                  : step === 'verify-email' ? renderVerifyEmail()
                  : step === 'verify-2fa' ? renderVerify2fa()
                  : step === 'register' ? renderRegisterForm()
                  : renderLoginForm()}
              </motion.div>
            </AnimatePresence>
          </ShineBorder>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <LoginPageInner />
      </GoogleOAuthProvider>
    );
  }
  return <LoginPageInner />;
}
