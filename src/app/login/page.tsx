'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regData, setRegData] = useState({
    org_name: '',
    org_type: 'pharmacy',
    admin_email: '',
    admin_password: '',
    admin_full_name: '',
    phone: '',
    city: '',
    state: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.login(email, password);
      router.push('/dashboard');
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
      await authApi.register(regData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — Brand */}
      <div className="hidden lg:flex w-[45%] bg-surface-950 relative overflow-hidden flex-col justify-between p-12">
        {/* Background texture */}
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

          <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-surface-500 mt-1 mb-8">
            {mode === 'login'
              ? 'Sign in to your PharmaOS dashboard.'
              : 'Set up your pharmacy or distributor account.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="admin@pharmacy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label">Organization Name</label>
                <input
                  className="input"
                  placeholder="HealthFirst Pharmacy"
                  value={regData.org_name}
                  onChange={(e) => setRegData({ ...regData, org_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Organization Type</label>
                <select
                  className="input"
                  value={regData.org_type}
                  onChange={(e) => setRegData({ ...regData, org_type: e.target.value })}
                >
                  <option value="pharmacy">Pharmacy</option>
                  <option value="distributor">Distributor</option>
                  <option value="wholesaler">Wholesaler</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    className="input"
                    placeholder="John Okafor"
                    value={regData.admin_full_name}
                    onChange={(e) => setRegData({ ...regData, admin_full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    className="input"
                    placeholder="08012345678"
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="admin@pharmacy.com"
                  value={regData.admin_email}
                  onChange={(e) => setRegData({ ...regData, admin_email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min. 8 characters"
                  value={regData.admin_password}
                  onChange={(e) => setRegData({ ...regData, admin_password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>
                  <input
                    className="input"
                    placeholder="Lagos"
                    value={regData.city}
                    onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <input
                    className="input"
                    placeholder="Lagos"
                    value={regData.state}
                    onChange={(e) => setRegData({ ...regData, state: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          <p className="text-sm text-center mt-6 text-surface-500">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => { setMode('register'); setError(''); }} className="text-brand-600 font-semibold hover:underline">
                  Register
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); }} className="text-brand-600 font-semibold hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
