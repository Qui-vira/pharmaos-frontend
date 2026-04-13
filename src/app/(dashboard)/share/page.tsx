'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LoadingSpinner } from '@/components/ui';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import {
  Copy, Check, MessageCircle, Share2, Download, Printer,
  Smartphone, Pill, ExternalLink,
} from 'lucide-react';
import { orgApi, getStoredUser } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { ShineBorder } from '@/components/shadcn/shine-border';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pharmaos-frontend.vercel.app';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
};

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-surface-900 min-h-screen transition-colors">
      <motion.div
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <BlurFade delay={0}>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-1">
            Patient Registration
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mb-8">
            Share this QR code or link so patients can self-register at your pharmacy.
          </p>
        </BlurFade>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: QR Code + Share */}
          <div className="space-y-4">
            {/* QR Code Glass Card */}
            <BlurFade delay={0.1}>
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-8 text-center shadow-sm"
              >
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-6">
                  Registration QR Code
                </h3>
                <div className="flex justify-center">
                  <ShineBorder
                    borderRadius={16}
                    borderWidth={2}
                    duration={10}
                    color={['#6366f1', '#8b5cf6', '#06b6d4']}
                    className="!p-4 !min-w-0 !w-auto bg-white dark:bg-white"
                  >
                    <div ref={qrRef} className="inline-block">
                      <QRCodeSVG
                        value={registrationUrl}
                        size={200}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                      />
                    </div>
                  </ShineBorder>
                </div>
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-4">
                  Print this and place it at your counter
                </p>
              </motion.div>
            </BlurFade>

            {/* Registration Link */}
            <BlurFade delay={0.2}>
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-4 shadow-sm"
              >
                <label className="label text-surface-700 dark:text-surface-300 mb-2 block text-sm font-medium">
                  Registration Link
                </label>
                <div className="flex gap-2">
                  <input
                    className="input text-sm font-mono flex-1 bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100"
                    value={registrationUrl}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={copyLink}
                    className={cn(
                      'btn-secondary text-sm flex-shrink-0 dark:border-surface-600 dark:text-surface-200 dark:hover:bg-surface-700',
                      copied && 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-700'
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                          <Check className="w-4 h-4" /> Copied
                        </motion.span>
                      ) : (
                        <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                          <Copy className="w-4 h-4" /> Copy
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>
            </BlurFade>

            {/* Share Buttons */}
            <BlurFade delay={0.3}>
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-5 shadow-sm"
              >
                <h4 className="font-semibold text-surface-800 dark:text-surface-200 mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share Registration Link
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'WhatsApp', onClick: shareWhatsApp, icon: MessageCircle, bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', hover: 'hover:bg-green-100 dark:hover:bg-green-900/40' },
                    { label: 'Twitter / X', onClick: shareTwitter, icon: ExternalLink, bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', hover: 'hover:bg-sky-100 dark:hover:bg-sky-900/40' },
                    { label: 'Facebook', onClick: shareFacebook, icon: ExternalLink, bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40' },
                    { label: 'Instagram', onClick: shareInstagram, icon: Copy, bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-400', hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/40' },
                  ].map((btn, i) => (
                    <motion.button
                      key={btn.label}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.06 }}
                      onClick={btn.onClick}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        btn.bg, btn.text, btn.hover
                      )}
                    >
                      <btn.icon className="w-4 h-4" /> {btn.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </BlurFade>

            {/* Download Buttons */}
            <BlurFade delay={0.4}>
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-5 shadow-sm"
              >
                <h4 className="font-semibold text-surface-800 dark:text-surface-200 mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Downloads
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={downloadQr}
                    className="btn-secondary text-sm w-full dark:border-surface-600 dark:text-surface-200 dark:hover:bg-surface-700"
                  >
                    <Download className="w-4 h-4" /> QR as PNG
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={downloadFlyer}
                    className="btn-primary text-sm w-full"
                  >
                    <Printer className="w-4 h-4" /> Print Flyer
                  </motion.button>
                </div>
              </motion.div>
            </BlurFade>
          </div>

          {/* Right: Preview + Flyer */}
          <div className="space-y-4">
            {/* Phone Mockup Preview */}
            <BlurFade delay={0.15}>
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
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
              </motion.div>
            </BlurFade>

            {/* Printable Flyer (hidden but used for download) */}
            <BlurFade delay={0.25}>
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
                  <Printer className="w-5 h-5" /> Printable Flyer Preview
                </h3>
                <div ref={flyerRef} className="bg-white border-2 border-surface-200 dark:border-surface-600 rounded-xl overflow-hidden">
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
              </motion.div>
            </BlurFade>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
