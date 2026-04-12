'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Upload, CheckCircle, AlertTriangle, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/api';

type UploadStatus = 'idle' | 'uploading' | 'complete' | 'error';

export default function DistributorUploadPage() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<{ processed: number; added: number; updated: number; failed: number; errors: string[] } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const reset = () => {
    setStatus('idle');
    setFileName('');
    setResults(null);
    setError('');
  };

  return (
    <>
      <Header title="Upload Product Catalog" />

      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Instructions */}
        <div className="card p-6">
          <h3 className="font-bold text-surface-900 mb-3">Bulk Upload Your Product Catalog</h3>
          <p className="text-sm text-surface-600 mb-4">
            Upload a CSV or Excel file to add or update products in your catalog. The system will match product names against the global catalog using the product aliases system.
          </p>

          <div className="bg-surface-50 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-semibold text-surface-700 mb-2">Required Columns</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                <span className="text-surface-600"><strong>product_name</strong> — Drug name</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                <span className="text-surface-600"><strong>unit_price</strong> — Price per unit (₦)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                <span className="text-surface-600"><strong>quantity</strong> — Available stock</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-surface-400 rounded-full" />
                <span className="text-surface-400"><strong>manufacturer</strong> — Optional</span>
              </div>
            </div>
          </div>

          <button
            className="btn-secondary text-sm"
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

        {/* Upload Area */}
        {status === 'idle' && (
          <label className="card p-12 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-surface-300 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileSelect} />
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <p className="font-semibold text-surface-800">Drop your file here or click to browse</p>
            <p className="text-sm text-surface-400 mt-1">Supports CSV and XLSX files up to 10MB</p>
          </label>
        )}

        {/* Uploading */}
        {status === 'uploading' && (
          <div className="card p-8 flex flex-col items-center">
            <div className="w-12 h-12 mb-4">
              <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <p className="font-semibold text-surface-800">Uploading and processing...</p>
            <p className="text-sm text-surface-400 mt-1">{fileName}</p>
            <p className="text-xs text-surface-400 mt-3">Matching product names against global catalog and aliases...</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-danger-500/10 rounded-xl flex items-center justify-center">
                <X className="w-5 h-5 text-danger-600" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900">Upload Failed</h3>
                {fileName && <p className="text-sm text-surface-500">{fileName}</p>}
              </div>
            </div>
            <div className="bg-danger-500/5 border border-danger-500/20 rounded-xl p-3 mb-4">
              <p className="text-sm text-danger-700">{error}</p>
            </div>
            <button onClick={reset} className="btn-secondary text-sm">
              <Upload className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {status === 'complete' && results && (
          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900">Upload Complete</h3>
                  <p className="text-sm text-surface-500">{fileName}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-surface-900">{results.processed}</p>
                  <p className="text-xs text-surface-500">Processed</p>
                </div>
                <div className="bg-brand-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-brand-700">{results.added}</p>
                  <p className="text-xs text-brand-600">New Added</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-blue-700">{results.updated}</p>
                  <p className="text-xs text-blue-600">Updated</p>
                </div>
                <div className={cn('rounded-xl p-3 text-center', results.failed > 0 ? 'bg-danger-500/5' : 'bg-surface-50')}>
                  <p className={cn('text-2xl font-extrabold', results.failed > 0 ? 'text-danger-600' : 'text-surface-400')}>{results.failed}</p>
                  <p className="text-xs text-surface-500">Failed</p>
                </div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-warning-600" />
                  <h4 className="font-semibold text-surface-800">Issues Found</h4>
                </div>
                <div className="space-y-2">
                  {results.errors.map((err, i) => (
                    <div key={i} className="bg-warning-500/5 border border-warning-500/20 rounded-lg px-3 py-2">
                      <p className="text-sm text-surface-700">{err}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={reset} className="btn-secondary text-sm">
              <Upload className="w-4 h-4" /> Upload Another File
            </button>
          </div>
        )}
      </div>
    </>
  );
}
