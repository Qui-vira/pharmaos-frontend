'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { Upload, CheckCircle, AlertTriangle, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/api';

type UploadStatus = 'idle' | 'uploading' | 'complete' | 'error';

export default function DistributorUploadPage() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<{ processed: number; added: number; updated: number; failed: number; errors: string[] } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setError('Please upload a CSV or XLSX file.');
      setStatus('error');
      return;
    }

    setFileName(file.name);
    setStatus('uploading');
    setError('');
    setResults(null);

    try {
      const data = await uploadFile('/admin/import/supplier-catalog', file);
      setStatus('complete');
      setResults({
        processed: data.processed || 0,
        added: data.added || 0,
        updated: data.updated || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      });
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Upload failed. The import endpoint may not be available yet.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const reset = () => {
    setStatus('idle');
    setFileName('');
    setResults(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Instructions */}
      <BlurFade delay={0.05}>
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl p-6 shadow-sm">
          <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-3">Bulk Upload Your Product Catalog</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
            Upload a CSV or Excel file to add or update products in your catalog. The system will match product names against the global catalog using the product aliases system.
          </p>

          <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 mb-4 border border-surface-200 dark:border-surface-700">
            <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Required Columns</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-info-500 rounded-full" />
                <span className="text-surface-600 dark:text-surface-400"><strong>product_name</strong> -- Drug name</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-info-500 rounded-full" />
                <span className="text-surface-600 dark:text-surface-400"><strong>unit_price</strong> -- Price per unit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-info-500 rounded-full" />
                <span className="text-surface-600 dark:text-surface-400"><strong>quantity</strong> -- Available stock</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-surface-400 dark:bg-surface-600 rounded-full" />
                <span className="text-surface-400 dark:text-surface-500"><strong>manufacturer</strong> -- Optional</span>
              </div>
            </div>
          </div>

          <button
            className="btn-secondary text-sm inline-flex items-center gap-2"
            onClick={() => {
              const csv = 'product_name,unit_price,quantity,manufacturer\nParacetamol 500mg Tablets,150,100,Emzor Pharmaceuticals\nAmoxicillin 250mg Capsules,350,50,Fidson Healthcare\n';
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'pharmaos_catalog_template.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4" /> Download Template CSV
          </button>
        </div>
      </BlurFade>

      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <BlurFade delay={0.1}>
            <motion.label
              key="upload-zone"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                'relative rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed transition-all duration-300 overflow-hidden',
                'bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl shadow-sm',
                isDragOver
                  ? 'border-info-500 bg-info-50/50 dark:bg-info-500/5 scale-[1.01]'
                  : 'border-surface-300 dark:border-surface-600 hover:border-info-400 dark:hover:border-info-500 hover:bg-info-50/30 dark:hover:bg-info-500/5',
              )}
            >
              {/* Animated border shimmer on drag */}
              {isDragOver && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.1), transparent)',
                    backgroundSize: '200% 100%',
                  }}
                />
              )}
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileSelect} />
              <motion.div
                animate={isDragOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-16 h-16 bg-info-50 dark:bg-info-500/10 rounded-2xl flex items-center justify-center mb-4"
              >
                <Upload className="w-8 h-8 text-info-500 dark:text-info-400" />
              </motion.div>
              <p className="font-semibold text-surface-800 dark:text-surface-200">
                {isDragOver ? 'Drop your file here' : 'Drop your file here or click to browse'}
              </p>
              <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Supports CSV and XLSX files up to 10MB</p>
            </motion.label>
          </BlurFade>
        )}

        {/* Uploading */}
        {status === 'uploading' && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl p-8 flex flex-col items-center shadow-sm"
          >
            <div className="w-12 h-12 mb-4">
              <div className="w-12 h-12 border-3 border-info-200 dark:border-info-800 border-t-info-600 dark:border-t-info-400 rounded-full animate-spin" />
            </div>
            <p className="font-semibold text-surface-800 dark:text-surface-200">Uploading and processing...</p>
            <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">{fileName}</p>
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-3">Matching product names against global catalog and aliases...</p>
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-danger-500/10 rounded-xl flex items-center justify-center">
                <X className="w-5 h-5 text-danger-600 dark:text-danger-400" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 dark:text-surface-50">Upload Failed</h3>
                {fileName && <p className="text-sm text-surface-500 dark:text-surface-400">{fileName}</p>}
              </div>
            </div>
            <div className="bg-danger-500/5 dark:bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 mb-4">
              <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
            </div>
            <button onClick={reset} className="btn-secondary text-sm inline-flex items-center gap-2">
              <Upload className="w-4 h-4" /> Try Again
            </button>
          </motion.div>
        )}

        {/* Results */}
        {status === 'complete' && results && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-info-100 dark:bg-info-500/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-info-600 dark:text-info-400" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 dark:text-surface-50">Upload Complete</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">{fileName}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-surface-900 dark:text-surface-50">{results.processed}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Processed</p>
                </div>
                <div className="bg-info-50 dark:bg-info-500/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-info-700 dark:text-info-400">{results.added}</p>
                  <p className="text-xs text-info-600 dark:text-info-400">New Added</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{results.updated}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Updated</p>
                </div>
                <div className={cn('rounded-xl p-3 text-center', results.failed > 0 ? 'bg-danger-500/5 dark:bg-danger-500/10' : 'bg-surface-50 dark:bg-surface-800')}>
                  <p className={cn('text-2xl font-extrabold', results.failed > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-surface-400 dark:text-surface-500')}>{results.failed}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Failed</p>
                </div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                  <h4 className="font-semibold text-surface-800 dark:text-surface-200">Issues Found</h4>
                </div>
                <div className="space-y-2">
                  {results.errors.map((err, i) => (
                    <div key={i} className="bg-warning-500/5 dark:bg-warning-500/10 border border-warning-500/20 rounded-lg px-3 py-2">
                      <p className="text-sm text-surface-700 dark:text-surface-300">{err}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={reset} className="btn-secondary text-sm inline-flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload Another File
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
