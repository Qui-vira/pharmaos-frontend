'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
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

const CONFIDENCE_META: Record<string, { label: string; color: string }> = {
  high: { label: 'High', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  none: { label: 'No Match', color: 'bg-red-100 text-red-600' },
};

// ─── Step Indicator ──────────────────────��───────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
            current === step.num
              ? 'bg-brand-600 text-white'
              : current > step.num
                ? 'bg-brand-100 text-brand-700'
                : 'bg-surface-100 text-surface-400',
          )}>
            {current > step.num ? <Check className="w-4 h-4" /> : step.num}
          </div>
          <span className={cn(
            'text-sm font-medium hidden sm:inline',
            current === step.num ? 'text-surface-900' : 'text-surface-400',
          )}>
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'w-8 h-0.5 mx-1',
              current > step.num ? 'bg-brand-400' : 'bg-surface-200',
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Capture ─────────────────────────��───────────────────────────

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
      <div className="text-center">
        <h2 className="text-xl font-bold text-surface-900 mb-1">Capture Shelf Image</h2>
        <p className="text-sm text-surface-500">Take a photo of your pharmacy shelf or upload an image.</p>
      </div>

      {error && (
        <div className="p-3 bg-danger-500/10 text-danger-600 text-sm rounded-xl border border-danger-500/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedImage ? (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-surface-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} alt="Captured shelf" className="w-full max-h-[400px] object-contain bg-surface-50" />
            <button
              onClick={() => { setCapturedImage(null); setError(''); }}
              className="absolute top-3 right-3 p-2 bg-white/90 rounded-xl shadow-sm hover:bg-white"
            >
              <XIcon className="w-4 h-4 text-surface-600" />
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn-primary w-full text-sm py-3"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {analyzeStatus}</>
            ) : (
              <><Scan className="w-4 h-4" /> Analyze Image</>
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Camera Option */}
          <div className="card p-6 text-center space-y-4">
            {cameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                </div>
                <div className="flex gap-2">
                  <button onClick={capturePhoto} className="btn-primary flex-1 text-sm">
                    <Camera className="w-4 h-4" /> Capture
                  </button>
                  <button onClick={stopCamera} className="btn-secondary text-sm">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-800">Use Camera</h3>
                  <p className="text-xs text-surface-400 mt-1">Point at your shelf and capture</p>
                </div>
                {cameraError ? (
                  <p className="text-xs text-danger-500">{cameraError}</p>
                ) : (
                  <button onClick={startCamera} className="btn-primary text-sm w-full">
                    <Camera className="w-4 h-4" /> Open Camera
                  </button>
                )}
              </>
            )}
          </div>

          {/* Upload Option */}
          <label className="card p-6 text-center space-y-4 cursor-pointer hover:border-brand-300 transition-colors">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-surface-500" />
            </div>
            <div>
              <h3 className="font-bold text-surface-800">Upload Image</h3>
              <p className="text-xs text-surface-400 mt-1">JPEG, PNG, or WebP up to 10MB</p>
            </div>
            <span className="btn-secondary text-sm inline-flex items-center gap-1.5">
              <Image className="w-4 h-4" /> Browse Files
            </span>
          </label>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ─── Step 2: Review ──────────────────────────────���───────────────────────

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900">Review Matches</h2>
          <p className="text-sm text-surface-500">{matches.length} products detected, {selectedCount} selected</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSelectAll} className="text-xs text-brand-600 font-semibold hover:underline">Select All</button>
          <span className="text-surface-300">|</span>
          <button onClick={handleDeselectAll} className="text-xs text-surface-500 font-semibold hover:underline">Deselect All</button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const conf = CONFIDENCE_META[item.confidence] || CONFIDENCE_META.none;
          return (
            <div key={i} className={cn('card p-4 transition-colors', item.selected ? 'border-brand-200 bg-brand-50/20' : 'opacity-60')}>
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => updateItem(i, { selected: !item.selected })}
                  className={cn(
                    'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    item.selected ? 'bg-brand-600 border-brand-600' : 'border-surface-300',
                  )}
                  disabled={!item.active_product_id}
                >
                  {item.selected && <Check className="w-3 h-3 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  {/* Product Info Row */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-sm font-semibold text-surface-800">{item.extracted_name}</span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', conf.color)}>{conf.label}</span>
                  </div>

                  {item.matched_product_name ? (
                    <div className="flex items-center gap-1 mb-3">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-500" />
                      <span className="text-xs text-surface-600">
                        Matched: <strong>{item.matched_product_name}</strong>
                        {item.strength && <> ({item.strength})</>}
                        {item.manufacturer && <> — {item.manufacturer}</>}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-danger-500 mb-3 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> No match found in catalog
                    </p>
                  )}

                  {/* Alternatives */}
                  {item.alternatives.length > 0 && (
                    <div className="mb-3">
                      <select
                        className="input text-xs py-1"
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
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-surface-500 font-medium">Quantity</label>
                        <input
                          type="number"
                          className="input text-sm py-1"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-surface-500 font-medium">Cost Price (₦)</label>
                        <input
                          type="number"
                          className="input text-sm py-1"
                          value={item.cost_price}
                          onChange={(e) => updateItem(i, { cost_price: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-surface-500 font-medium">Selling Price (₦)</label>
                        <input
                          type="number"
                          className="input text-sm py-1"
                          value={item.selling_price}
                          onChange={(e) => updateItem(i, { selling_price: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={selectedCount === 0}
          className="btn-primary flex-1 text-sm"
        >
          <Package className="w-4 h-4" /> Add {selectedCount} to Inventory
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Confirm ────────────────────────────────────────────────���────

function ConfirmStep({
  result,
  onScanAnother,
}: {
  result: { added: number; updated: number; errors: string[] };
  onScanAnother: () => void;
}) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-brand-600" />
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-surface-900 mb-2">Inventory Updated</h2>
        <p className="text-sm text-surface-500">Products have been added to your inventory.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-brand-50 rounded-xl p-4">
          <p className="text-3xl font-extrabold text-brand-700">{result.added}</p>
          <p className="text-xs text-brand-600 font-semibold">New Added</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-3xl font-extrabold text-blue-700">{result.updated}</p>
          <p className="text-xs text-blue-600 font-semibold">Updated</p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="bg-danger-500/5 border border-danger-500/20 rounded-xl p-4 text-left">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-danger-500" />
            <span className="text-sm font-semibold text-danger-700">Issues</span>
          </div>
          {result.errors.map((err, i) => (
            <p key={i} className="text-xs text-danger-600">{err}</p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button onClick={onScanAnother} className="btn-primary text-sm w-full">
          <RefreshCw className="w-4 h-4" /> Scan Another Shelf
        </button>
        <Link href="/inventory" className="btn-secondary text-sm w-full inline-flex items-center justify-center gap-1.5">
          <Package className="w-4 h-4" /> Go to Inventory
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────��────────────────────────

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
    <>
      <Header title="Snap to Stock" />

      <div className="p-6">
        <StepIndicator current={step} />

        {error && (
          <div className="mb-4 p-3 bg-danger-500/10 text-danger-600 text-sm rounded-xl border border-danger-500/20 flex items-center gap-2 max-w-2xl mx-auto">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {confirming && (
          <div className="max-w-md mx-auto text-center py-12">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-4" />
            <p className="font-semibold text-surface-800">Adding to inventory...</p>
          </div>
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
    </>
  );
}
