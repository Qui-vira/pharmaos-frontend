'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs,
  loading = false,
  className,
}: SearchInputProps) {
  const [internal, setInternal] = useState(value);

  // Sync external value changes
  useEffect(() => {
    setInternal(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    if (debounceMs && debounceMs > 0) {
      const timer = setTimeout(() => {
        if (internal !== value) {
          onChange(internal);
        }
      }, debounceMs);
      return () => clearTimeout(timer);
    }
  }, [internal, debounceMs, onChange, value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternal(newValue);
      if (!debounceMs || debounceMs <= 0) {
        onChange(newValue);
      }
    },
    [debounceMs, onChange],
  );

  const handleClear = useCallback(() => {
    setInternal('');
    onChange('');
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-surface-400">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>
      <input
        type="text"
        value={internal}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn('input pl-10', internal && 'pr-10')}
      />
      {internal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
