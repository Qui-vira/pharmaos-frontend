'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Shield, RefreshCw } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authApi } from '@/lib/api';

type AuthStep = 'login' | 'register' | 'verify-email' | 'verify-2fa';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

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
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all disabled:opacity-50"
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
        setStep('verify-email');
        setExpiryTimer(600);
        setResendCooldown(60);
      } else if (data.requires_2fa && data.temp_token) {
        setTempToken(data.temp_token);
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

  // ── Render ──

  const renderVerifyEmail = () => (
    <div className="space-y-6">
      <button onClick={() => { setStep('login'); setError(''); }} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700">
        <ArrowLeft className="w-4 h-4" /> Back to login
      </button>
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Check your email</h1>
        <p className="text-surface-500 mt-2">
          We sent a 6-digit code to <span className="font-semibold text-surface-700">{verifyEmail}</span>
        </p>
      </div>

      {error && (
        <div className="p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
          {error}
        </div>
      )}

      <OtpInputs value={otpCode} onChange={setOtpCode} disabled={loading} />

      <div className="text-center text-sm text-surface-500">
        {expiryTimer > 0 ? (
          <p>Code expires in <span className="font-semibold text-surface-700">{formatTime(expiryTimer)}</span></p>
        ) : (
          <p className="text-danger-600 font-medium">Code expired. Please resend.</p>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:text-surface-400 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );

  const renderVerify2fa = () => (
    <div className="space-y-6">
      <button onClick={() => { setStep('login'); setError(''); setTwoFaCode(''); }} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700">
        <ArrowLeft className="w-4 h-4" /> Back to login
      </button>
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Two-factor authentication</h1>
        <p className="text-surface-500 mt-2">Enter the 6-digit code from your authenticator app.</p>
      </div>

      {error && (
        <div className="p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
          {error}
        </div>
      )}

      <OtpInputs value={twoFaCode} onChange={setTwoFaCode} disabled={loading} />

      {loading && (
        <p className="text-center text-sm text-surface-500">Verifying...</p>
      )}
    </div>
  );

  const renderGoogleOrgForm = () => (
    <div className="space-y-6">
      <button onClick={() => { setGoogleNewUser(false); setError(''); }} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Set up your organization</h1>
        <p className="text-surface-500 mt-1">One more step to complete your Google sign-up.</p>
      </div>

      {error && (
        <div className="p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleGoogleOrgSubmit} className="space-y-4">
        <div>
          <label className="label">Organization Name</label>
          <input
            className="input"
            placeholder="HealthFirst Pharmacy"
            value={googleOrgName}
            onChange={(e) => setGoogleOrgName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Organization Type</label>
          <select
            className="input"
            value={googleOrgType}
            onChange={(e) => setGoogleOrgType(e.target.value)}
          >
            <option value="pharmacy">Pharmacy</option>
            <option value="distributor">Distributor</option>
            <option value="wholesaler">Wholesaler</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account...' : 'Complete sign-up'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );

  const renderLoginForm = () => (
    <>
      <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Welcome back</h1>
      <p className="text-surface-500 mt-1 mb-6">Sign in to your PharmaOS dashboard.</p>

      {error && (
        <div className="mb-4 p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="admin@pharmacy.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign in'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      {GOOGLE_CLIENT_ID && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-surface-400 font-medium">OR</span></div>
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

      <p className="text-sm text-center mt-6 text-surface-500">
        Don&apos;t have an account?{' '}
        <button onClick={() => { setStep('register'); setError(''); }} className="text-brand-600 font-semibold hover:underline">
          Register
        </button>
      </p>
    </>
  );

  const renderRegisterForm = () => (
    <>
      <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Create your account</h1>
      <p className="text-surface-500 mt-1 mb-6">Set up your pharmacy or distributor account.</p>

      {error && (
        <div className="mb-4 p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="label">Organization Name</label>
          <input className="input" placeholder="HealthFirst Pharmacy" value={regData.org_name} onChange={(e) => setRegData({ ...regData, org_name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Organization Type</label>
          <select className="input" value={regData.org_type} onChange={(e) => setRegData({ ...regData, org_type: e.target.value })}>
            <option value="pharmacy">Pharmacy</option>
            <option value="distributor">Distributor</option>
            <option value="wholesaler">Wholesaler</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Full Name</label>
            <input className="input" placeholder="John Okafor" value={regData.admin_full_name} onChange={(e) => setRegData({ ...regData, admin_full_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="08012345678" value={regData.phone} onChange={(e) => setRegData({ ...regData, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="admin@pharmacy.com" value={regData.admin_email} onChange={(e) => setRegData({ ...regData, admin_email: e.target.value })} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" placeholder="Min. 8 characters" value={regData.admin_password} onChange={(e) => setRegData({ ...regData, admin_password: e.target.value })} required minLength={8} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">City</label>
            <input className="input" placeholder="Lagos" value={regData.city} onChange={(e) => setRegData({ ...regData, city: e.target.value })} />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" placeholder="Lagos" value={regData.state} onChange={(e) => setRegData({ ...regData, state: e.target.value })} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account...' : 'Create account'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      {GOOGLE_CLIENT_ID && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-surface-400 font-medium">OR</span></div>
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

      <p className="text-sm text-center mt-6 text-surface-500">
        Already have an account?{' '}
        <button onClick={() => { setStep('login'); setError(''); }} className="text-brand-600 font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left panel — Brand */}
      <div className="hidden lg:flex w-[45%] bg-surface-950 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-[96px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">PharmaOS AI</span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
            Intelligent pharmacy<br />management, simplified.
          </h2>
          <p className="text-surface-400 text-lg leading-relaxed max-w-md">
            AI-powered inventory, smart ordering, patient reminders, and real-time analytics — all in one platform built for Nigerian pharmacies.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 text-sm">
          <div>
            <div className="text-2xl font-extrabold text-brand-400">500+</div>
            <div className="text-surface-500">Pharmacies</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-brand-400">50k+</div>
            <div className="text-surface-500">Orders/month</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-brand-400">99.9%</div>
            <div className="text-surface-500">Uptime</div>
          </div>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-surface-900">PharmaOS AI</span>
          </div>

          {googleNewUser ? renderGoogleOrgForm()
            : step === 'verify-email' ? renderVerifyEmail()
            : step === 'verify-2fa' ? renderVerify2fa()
            : step === 'register' ? renderRegisterForm()
            : renderLoginForm()}
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
