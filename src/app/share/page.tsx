'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import {
  Copy, Check, MessageCircle, Share2, Download, Printer,
  Smartphone, Pill, ExternalLink,
} from 'lucide-react';
import { orgApi, getStoredUser } from '@/lib/api';
import { cn } from '@/lib/utils';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pharmaos-frontend.vercel.app';

export default function SharePage() {
  const user = getStoredUser();
  const orgId = user?.org_id || '';

  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);

  const registrationUrl = `${APP_URL}/register/patient?pharmacy=${orgId}`;
  const shareMessage = `Register at my pharmacy for quick WhatsApp consultations and medication reminders: ${registrationUrl}`;

  useEffect(() => {
    orgApi.getMyOrg()
      .then((org) => setOrgName(org.name))
      .catch(() => setOrgName('My Pharmacy'))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = registrationUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [registrationUrl]);

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
      '_blank'
    );
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(registrationUrl)}`,
      '_blank'
    );
  };

  const shareInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      alert('Link copied! Paste it in your Instagram bio or story.');
    } catch {
      alert(`Copy this link: ${registrationUrl}`);
    }
  };

  const downloadQr = async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `pharmaos-qr-${orgId.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert('Failed to download QR code. Please take a screenshot instead.');
    }
  };

  const downloadFlyer = async () => {
    if (!flyerRef.current) return;
    try {
      const dataUrl = await toPng(flyerRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `pharmaos-flyer-${orgId.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert('Failed to download flyer. Please take a screenshot instead.');
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Patient Registration" />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <Header title="Patient Registration" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-surface-500 mb-6">
            Share this QR code or link so patients can self-register at your pharmacy.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: QR Code + Share */}
            <div className="space-y-4">
              {/* QR Code Card */}
              <div className="card p-6 text-center">
                <h3 className="text-lg font-bold text-surface-900 mb-4">Registration QR Code</h3>
                <div ref={qrRef} className="inline-block p-4 bg-white rounded-2xl border border-surface-100">
                  <QRCodeSVG
                    value={registrationUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                </div>
                <p className="text-xs text-surface-400 mt-3">Print this and place it at your counter</p>
              </div>

              {/* Registration Link */}
              <div className="card p-4">
                <label className="label mb-2">Registration Link</label>
                <div className="flex gap-2">
                  <input
                    className="input text-sm font-mono flex-1"
                    value={registrationUrl}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={copyLink}
                    className={cn('btn-secondary text-sm flex-shrink-0', copied && 'bg-brand-50 text-brand-700 border-brand-200')}
                  >
                    {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="card p-5">
                <h4 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share Registration Link
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={shareWhatsApp} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                  <button onClick={shareTwitter} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Twitter / X
                  </button>
                  <button onClick={shareFacebook} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Facebook
                  </button>
                  <button onClick={shareInstagram} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors">
                    <Copy className="w-4 h-4" /> Instagram
                  </button>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="card p-5">
                <h4 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Downloads
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={downloadQr} className="btn-secondary text-sm w-full">
                    <Download className="w-4 h-4" /> QR as PNG
                  </button>
                  <button onClick={downloadFlyer} className="btn-primary text-sm w-full">
                    <Printer className="w-4 h-4" /> Print Flyer
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Preview + Flyer */}
            <div className="space-y-4">
              {/* Phone Mockup Preview */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" /> Mobile Preview
                </h3>
                <div className="mx-auto w-[280px]">
                  {/* Phone frame */}
                  <div className="bg-surface-900 rounded-[2rem] p-2 shadow-elevated">
                    <div className="bg-surface-800 rounded-t-[1.5rem] pt-6 pb-2 px-4">
                      <div className="w-16 h-1 bg-surface-600 rounded-full mx-auto mb-4" />
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
                          <Pill className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-white text-xs font-bold">PharmaOS</span>
                      </div>
                    </div>
                    <div className="bg-surface-50 rounded-b-[1.5rem] p-4 min-h-[380px]">
                      <div className="text-center mb-3">
                        <p className="text-sm font-extrabold text-surface-900">Register at {orgName}</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[9px] font-semibold text-surface-500 mb-0.5">Full Name *</p>
                          <div className="bg-white rounded-lg border border-surface-200 px-2 py-1.5 text-[10px] text-surface-400">Enter your full name</div>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-surface-500 mb-0.5">WhatsApp Number *</p>
                          <div className="bg-white rounded-lg border border-surface-200 px-2 py-1.5 text-[10px] text-surface-600">+234</div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <p className="text-[9px] font-semibold text-surface-500 mb-0.5">Date of Birth</p>
                            <div className="bg-white rounded-lg border border-surface-200 px-2 py-1.5 text-[10px] text-surface-400">DD/MM/YYYY</div>
                          </div>
                          <div>
                            <p className="text-[9px] font-semibold text-surface-500 mb-0.5">Gender</p>
                            <div className="bg-white rounded-lg border border-surface-200 px-2 py-1.5 text-[10px] text-surface-400">Select</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5 p-2 bg-white rounded-lg mt-1">
                          <div className="w-3 h-3 rounded border border-surface-300 mt-0.5 flex-shrink-0" />
                          <p className="text-[8px] text-surface-500 leading-tight">I agree to receive health-related messages via WhatsApp...</p>
                        </div>
                        <div className="bg-brand-600 text-white text-center py-2 rounded-lg text-[10px] font-semibold mt-2">
                          Register
                        </div>
                      </div>
                      <p className="text-[7px] text-surface-400 text-center mt-3">Powered by PharmaOS AI</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Printable Flyer (hidden but used for download) */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
                  <Printer className="w-5 h-5" /> Printable Flyer Preview
                </h3>
                <div ref={flyerRef} className="bg-white border-2 border-surface-200 rounded-xl overflow-hidden">
                  <div className="bg-brand-600 px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Pill className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-extrabold text-lg">PharmaOS</span>
                    </div>
                    <h2 className="text-white font-extrabold text-xl">{orgName}</h2>
                  </div>
                  <div className="px-6 py-6 text-center">
                    <p className="text-surface-800 font-bold text-lg mb-1">Register as a Patient</p>
                    <p className="text-surface-500 text-sm mb-5">
                      Scan the QR code below to register for WhatsApp consultations and medication reminders.
                    </p>
                    <div className="inline-block p-3 bg-white rounded-xl border-2 border-surface-200 mb-4">
                      <QRCodeSVG
                        value={registrationUrl}
                        size={180}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                      />
                    </div>
                    <p className="text-brand-700 font-bold text-base mb-1">Scan to Register</p>
                    <p className="text-surface-400 text-xs">Or visit: {registrationUrl.replace('https://', '')}</p>
                  </div>
                  <div className="bg-surface-50 px-6 py-3 text-center border-t border-surface-200">
                    <p className="text-xs text-surface-400">Powered by PharmaOS AI</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
