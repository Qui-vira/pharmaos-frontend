'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import {
  Camera, Upload, Scan, Package, CheckCircle, AlertTriangle,
  Loader2, ChevronRight, ChevronLeft, X as XIcon, Image,
  RefreshCw, Check, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { snapToStockApi } from '@/lib/api';
import type { MatchedProduct, SnapConfirmItem } from '@/types';

type Step = 1 | 2 | 3;

const STEPS = [
  { num: 1, label: 'Capture' },
  { num: 2, label: 'Review' },
  { num: 3, label: 'Confirm' },
];

const CONFIDENCE_META: Record<string, { label: string; color: string; glow: string }> = {
  high: { label: 'High', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' },
  none: { label: 'No Match', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' },
};

const CONFIDENCE_BORDER: Record<string, string> = {
  high: 'border-green-300 dark:border-green-700',
  medium: 'border-amber-300 dark:border-amber-700',
  none: 'border-red-300 dark:border-red-700',
};

// ─── Step Indicator ──────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <motion.div
            initial={false}
            animate={{
              scale: current === step.num ? 1.1 : 1,
              backgroundColor: current === step.num
                ? 'var(--color-brand-600)'
                : current > step.num
                  ? 'var(--color-brand-100)'
                  : 'var(--color-surface-100)',
            }}
            transition={{ type: 'spring', stiffness: 500 }}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
              current === step.num
                ? 'text-white'
                : current > step.num
                  ? 'text-brand-700 dark:text-brand-400'
                  : 'text-surface-400 dark:text-surface-500',
            )}
          >
            {current > step.num ? <Check className="w-4 h-4" /> : step.num}
          </motion.div>
          <span className={cn(
            'text-sm font-medium hidden sm:inline',
            current === step.num ? 'text-surface-900 dark:text-surface-50' : 'text-surface-400 dark:text-surface-500',
          )}>
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'w-8 h-0.5 mx-1 transition-colors',
              current > step.num ? 'bg-brand-400 dark:bg-brand-600' : 'bg-surface-200 dark:bg-surface-700',
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Scanning Line Animation (CSS-in-JS) ────────────────────────────────

function ScanningOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Corner brackets */}
      <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-brand-500 rounded-tl-lg">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-full h-full"
        />
      </div>
      <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-brand-500 rounded-tr-lg">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          className="w-full h-full"
        />
      </div>
      <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-brand-500 rounded-bl-lg">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          className="w-full h-full"
        />
      </div>
      <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-brand-500 rounded-br-lg">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          className="w-full h-full"
        />
      </div>

      {/* Scanning line */}
      <motion.div
        animate={{ top: ['10%', '90%', '10%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent"
        style={{ boxShadow: '0 0 12px rgba(var(--color-brand-500-rgb, 99, 102, 241), 0.6)' }}
      />
    </div>
  );
}

// ─── Step 1: Capture ─────────────────────────────────────────────────────

function CaptureStep({
  onAnalyzed,
}: {
  onAnalyzed: (matches: MatchedProduct[]) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedMime, setCapturedMime] = useState('image/jpeg');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState('');
  const [error, setError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError('Could not access camera. Please use file upload instead.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    setCapturedMime('image/jpeg');
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    setError('');
    setCapturedMime(file.type);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setAnalyzing(true);
    setError('');
    setAnalyzeStatus('Analyzing image with AI...');

    try {
      // Extract base64 from data URL
      const base64 = capturedImage.split(',')[1];

      const analyzeResult = await snapToStockApi.analyze(base64, capturedMime);
      const productNames = analyzeResult.products.map((p: any) => p.product_name);

      if (productNames.length === 0) {
        setError('No products detected in the image. Try a clearer photo.');
        setAnalyzing(false);
        return;
      }

      setAnalyzeStatus(`Found ${productNames.length} products. Matching against NAFDAC catalog...`);
      const matchResult = await snapToStockApi.match(productNames);

      onAnalyzed(matchResult.matches);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
      setAnalyzeStatus('');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <BlurFade delay={0.1}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-1">Capture Shelf Image</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400">Take a photo of your pharmacy shelf or upload an image.</p>
        </div>
      </BlurFade>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm rounded-xl border border-danger-500/20 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </motion.div>
      )}

      {/* Captured Image Preview */}
      {capturedImage ? (
        <BlurFade delay={0.15}>
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              {/* Glass overlay with corner brackets */}
              {analyzing && <ScanningOverlay />}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Captured shelf" className="w-full max-h-[400px] object-contain" />
              <button
                onClick={() => { setCapturedImage(null); setError(''); }}
                className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-white dark:hover:bg-surface-700 z-20"
              >
                <XIcon className="w-4 h-4 text-surface-600 dark:text-surface-300" />
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn-primary w-full text-sm py-3"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {analyzeStatus}</>
              ) : (
                <><Scan className="w-4 h-4" /> Analyze Image</>
              )}
            </motion.button>
          </div>
        </BlurFade>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Camera Option */}
          <BlurFade delay={0.15}>
            <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 text-center space-y-4">
              {cameraActive ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    {/* Glass camera overlay with animated corner brackets */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                        className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                        className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                        className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br"
                      />
                    </div>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={capturePhoto}
                      className="btn-primary flex-1 text-sm"
                    >
                      <Camera className="w-4 h-4" /> Capture
                    </motion.button>
                    <button onClick={stopCamera} className="btn-secondary text-sm">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-800 dark:text-surface-100">Use Camera</h3>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Point at your shelf and capture</p>
                  </div>
                  {cameraError ? (
                    <p className="text-xs text-danger-500">{cameraError}</p>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={startCamera}
                      className="btn-primary text-sm w-full"
                    >
                      <Camera className="w-4 h-4" /> Open Camera
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </BlurFade>

          {/* Upload Option */}
          <BlurFade delay={0.25}>
            <label className="block rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 text-center space-y-4 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
              <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-surface-500 dark:text-surface-400" />
              </div>
              <div>
                <h3 className="font-bold text-surface-800 dark:text-surface-100">Upload Image</h3>
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">JPEG, PNG, or WebP up to 10MB</p>
              </div>
              <span className="btn-secondary text-sm inline-flex items-center gap-1.5">
                <Image className="w-4 h-4" /> Browse Files
              </span>
            </label>
          </BlurFade>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ─── Step 2: Review ──────────────────────────────────────────────────────

interface ReviewItem extends MatchedProduct {
  selected: boolean;
  quantity: number;
  cost_price: string;
  selling_price: string;
  active_product_id: string | null;
}

function ReviewStep({
  matches,
  onConfirm,
  onBack,
}: {
  matches: MatchedProduct[];
  onConfirm: (items: SnapConfirmItem[]) => void;
  onBack: () => void;
}) {
  const [items, setItems] = useState<ReviewItem[]>(() =>
    matches.map((m) => ({
      ...m,
      selected: m.confidence !== 'none',
      quantity: 1,
      cost_price: '',
      selling_price: '',
      active_product_id: m.matched_product_id || null,
    }))
  );

  const updateItem = (index: number, updates: Partial<ReviewItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const selectedCount = items.filter((i) => i.selected && i.active_product_id).length;

  const handleSelectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: !!item.active_product_id })));
  };

  const handleDeselectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const handleConfirm = () => {
    const confirmItems: SnapConfirmItem[] = items
      .filter((i) => i.selected && i.active_product_id)
      .map((i) => ({
        product_id: i.active_product_id!,
        quantity: i.quantity,
        cost_price: i.cost_price ? parseFloat(i.cost_price) : undefined,
        selling_price: i.selling_price ? parseFloat(i.selling_price) : undefined,
      }));
    onConfirm(confirmItems);
  };

  return (
    <div className="space-y-5">
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Review Matches</h2>
            <p className="text-sm text-surface-500 dark:text-surface-400">{matches.length} products detected, {selectedCount} selected</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSelectAll} className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline">Select All</button>
            <span className="text-surface-300 dark:text-surface-600">|</span>
            <button onClick={handleDeselectAll} className="text-xs text-surface-500 dark:text-surface-400 font-semibold hover:underline">Deselect All</button>
          </div>
        </div>
      </BlurFade>

      <div className="space-y-3">
        {items.map((item, i) => {
          const conf = CONFIDENCE_META[item.confidence] || CONFIDENCE_META.none;
          const borderColor = CONFIDENCE_BORDER[item.confidence] || CONFIDENCE_BORDER.none;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                'rounded-2xl border p-4 transition-all bg-white dark:bg-surface-900',
                item.selected ? borderColor : 'border-surface-200 dark:border-surface-700 opacity-60',
                item.selected && conf.glow,
              )}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => updateItem(i, { selected: !item.selected })}
                  className={cn(
                    'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    item.selected ? 'bg-brand-600 border-brand-600' : 'border-surface-300 dark:border-surface-600',
                  )}
                  disabled={!item.active_product_id}
                >
                  {item.selected && <Check className="w-3 h-3 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  {/* Product Info Row */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">{item.extracted_name}</span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', conf.color)}>{conf.label}</span>
                  </div>

                  {item.matched_product_name ? (
                    <div className="flex items-center gap-1 mb-3">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                      <span className="text-xs text-surface-600 dark:text-surface-400">
                        Matched: <strong className="text-surface-800 dark:text-surface-200">{item.matched_product_name}</strong>
                        {item.strength && <> ({item.strength})</>}
                        {item.manufacturer && <> — {item.manufacturer}</>}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-danger-500 dark:text-danger-400 mb-3 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> No match found in catalog
                    </p>
                  )}

                  {/* Alternatives */}
                  {item.alternatives.length > 0 && (
                    <div className="mb-3">
                      <select
                        className="input text-xs py-1 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-50"
                        value={item.active_product_id || ''}
                        onChange={(e) => {
                          const alt = item.alternatives.find((a) => a.product_id === e.target.value);
                          updateItem(i, {
                            active_product_id: e.target.value || null,
                            matched_product_name: alt?.name || item.matched_product_name,
                          });
                        }}
                      >
                        {item.matched_product_id && (
                          <option value={item.matched_product_id}>{item.matched_product_name} (best match)</option>
                        )}
                        {item.alternatives.map((alt) => (
                          <option key={alt.product_id} value={alt.product_id}>{alt.name} {alt.strength ? `(${alt.strength})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quantity + Prices */}
                  {item.selected && item.active_product_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-3 gap-2"
                    >
                      <div>
                        <label className="text-[10px] text-surface-500 dark:text-surface-400 font-medium">Quantity</label>
                        <input
                          type="number"
                          className="input text-sm py-1 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-50"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-surface-500 dark:text-surface-400 font-medium">Cost Price ({'\u20A6'})</label>
                        <input
                          type="number"
                          className="input text-sm py-1 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-50"
                          value={item.cost_price}
                          onChange={(e) => updateItem(i, { cost_price: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-surface-500 dark:text-surface-400 font-medium">Selling Price ({'\u20A6'})</label>
                        <input
                          type="number"
                          className="input text-sm py-1 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-50"
                          value={item.selling_price}
                          onChange={(e) => updateItem(i, { selling_price: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="btn-secondary flex-1 text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          disabled={selectedCount === 0}
          className="btn-primary flex-1 text-sm"
        >
          <Package className="w-4 h-4" /> Add {selectedCount} to Inventory
        </motion.button>
      </div>
    </div>
  );
}

// ─── Step 3: Confirm ─────────────────────────────────────────────────────

function ConfirmStep({
  result,
  onScanAnother,
}: {
  result: { added: number; updated: number; errors: string[] };
  onScanAnother: () => void;
}) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      <BlurFade delay={0.1}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle className="w-10 h-10 text-brand-600 dark:text-brand-400" />
        </motion.div>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div>
          <h2 className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 mb-2">Inventory Updated</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400">Products have been added to your inventory.</p>
        </div>
      </BlurFade>

      <BlurFade delay={0.3}>
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4"
          >
            <p className="text-3xl font-extrabold text-brand-700 dark:text-brand-400">{result.added}</p>
            <p className="text-xs text-brand-600 dark:text-brand-500 font-semibold">New Added</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
          >
            <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">{result.updated}</p>
            <p className="text-xs text-blue-600 dark:text-blue-500 font-semibold">Updated</p>
          </motion.div>
        </div>
      </BlurFade>

      {result.errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-danger-500/5 border border-danger-500/20 rounded-xl p-4 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-danger-500" />
            <span className="text-sm font-semibold text-danger-700 dark:text-danger-400">Issues</span>
          </div>
          {result.errors.map((err, i) => (
            <p key={i} className="text-xs text-danger-600 dark:text-danger-400">{err}</p>
          ))}
        </motion.div>
      )}

      <BlurFade delay={0.55}>
        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onScanAnother}
            className="btn-primary text-sm w-full"
          >
            <RefreshCw className="w-4 h-4" /> Scan Another Shelf
          </motion.button>
          <Link href="/inventory" className="btn-secondary text-sm w-full inline-flex items-center justify-center gap-1.5">
            <Package className="w-4 h-4" /> Go to Inventory
          </Link>
        </div>
      </BlurFade>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────

export default function SnapToStockPage() {
  const [step, setStep] = useState<Step>(1);
  const [matches, setMatches] = useState<MatchedProduct[]>([]);
  const [confirmResult, setConfirmResult] = useState<{ added: number; updated: number; errors: string[] } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyzed = (m: MatchedProduct[]) => {
    setMatches(m);
    setStep(2);
  };

  const handleConfirm = async (items: SnapConfirmItem[]) => {
    setConfirming(true);
    setError('');
    try {
      const result = await snapToStockApi.confirm(items);
      setConfirmResult(result);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to add items to inventory');
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setMatches([]);
    setConfirmResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="p-6">
        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm rounded-xl border border-danger-500/20 flex items-center gap-2 max-w-2xl mx-auto"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {confirming && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center py-12"
          >
            <Loader2 className="w-10 h-10 text-brand-600 dark:text-brand-400 animate-spin mx-auto mb-4" />
            <p className="font-semibold text-surface-800 dark:text-surface-200">Adding to inventory...</p>
          </motion.div>
        )}

        {!confirming && step === 1 && <CaptureStep onAnalyzed={handleAnalyzed} />}
        {!confirming && step === 2 && (
          <ReviewStep
            matches={matches}
            onConfirm={handleConfirm}
            onBack={() => setStep(1)}
          />
        )}
        {!confirming && step === 3 && confirmResult && (
          <ConfirmStep result={confirmResult} onScanAnother={handleReset} />
        )}
      </div>
    </div>
  );
}
