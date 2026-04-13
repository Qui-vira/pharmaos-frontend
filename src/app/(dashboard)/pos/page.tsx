'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LoadingSpinner } from '@/components/ui';
import {
  Search, Plus, Minus, Trash2, ShoppingBag, CreditCard,
  Banknote, ArrowRight, CheckCircle, X, Receipt, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';
import { inventoryApi, salesApi } from '@/lib/api';

/* ── Confetti CSS keyframes (injected once) ── */
const confettiCSS = `
@keyframes pos-confetti-fall {
  0%   { transform: translateY(-10px) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translateY(120px) rotate(720deg) scale(0.3); opacity: 0; }
}
@keyframes pos-confetti-spread {
  0%   { transform: translateX(0); }
  50%  { transform: translateX(var(--drift)); }
  100% { transform: translateX(calc(var(--drift) * -0.5)); }
}
.pos-confetti-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 1px;
  animation: pos-confetti-fall var(--duration) ease-out forwards,
             pos-confetti-spread var(--duration) ease-in-out forwards;
}
`;

const CONFETTI_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function ConfettiExplosion() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${45 + (Math.random() - 0.5) * 60}%`,
    top: `${30 + Math.random() * 10}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    drift: `${(Math.random() - 0.5) * 120}px`,
    duration: `${1.2 + Math.random() * 1.2}s`,
    delay: `${Math.random() * 0.4}s`,
    rotate: `${Math.random() * 360}deg`,
    borderRadius: Math.random() > 0.5 ? '50%' : '1px',
  }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: confettiCSS }} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="pos-confetti-particle"
            style={{
              left: p.left,
              top: p.top,
              backgroundColor: p.color,
              borderRadius: p.borderRadius,
              '--drift': p.drift,
              '--duration': p.duration,
              animationDelay: p.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  );
}

interface CartItem {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  max_stock: number;
}

export default function POSPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ total: number; items: CartItem[]; payment: string; date: string } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load inventory
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.list(1);
      setInventory(data.items || []);
    } catch (err: any) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  // Filter products by search
  const filtered = inventory.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.product?.name?.toLowerCase().includes(q) ||
      item.product?.generic_name?.toLowerCase().includes(q) ||
      item.product?.brand_name?.toLowerCase().includes(q) ||
      item.product?.category?.toLowerCase().includes(q)
    );
  });

  // Cart operations
  const addToCart = (item: any) => {
    const existing = cart.find((c) => c.product_id === item.product_id);
    if (existing) {
      if (existing.quantity >= item.quantity_on_hand) return;
      setCart(cart.map((c) =>
        c.product_id === item.product_id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, {
        product_id: item.product_id,
        name: item.product?.name || 'Unknown',
        unit_price: item.selling_price || 0,
        quantity: 1,
        max_stock: item.quantity_on_hand,
      }]);
    }
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(cart.map((c) => {
      if (c.product_id !== productId) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return c;
      if (newQty > c.max_stock) return c;
      return { ...c, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((c) => c.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.unit_price * c.quantity, 0);

  // Submit sale
  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await salesApi.create({
        items: cart.map((c) => ({
          product_id: c.product_id,
          quantity: c.quantity,
          unit_price: c.unit_price,
        })),
        payment_method: paymentMethod,
        total_amount: cartTotal,
      });
      setReceipt({
        total: cartTotal,
        items: [...cart],
        payment: paymentMethod,
        date: new Date().toISOString(),
      });
      setCart([]);
      loadInventory();
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Receipt View ───
  if (receipt) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative card p-8 max-w-md w-full text-center overflow-hidden shadow-elevated"
        >
          <ConfettiExplosion />

          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
            className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-200/40 dark:shadow-brand-900/20"
          >
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 15 }}
            >
              <CheckCircle className="w-10 h-10 text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 mb-1"
          >
            Sale Complete
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-sm text-surface-500 dark:text-surface-400 mb-6"
          >
            {new Date(receipt.date).toLocaleString('en-NG')}
          </motion.p>

          {/* Receipt items with stagger */}
          <div className="bg-surface-50 dark:bg-surface-800 rounded-xl divide-y divide-surface-200 dark:divide-surface-700 mb-5 text-left overflow-hidden">
            {receipt.items.map((item, i) => (
              <motion.div
                key={item.product_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.35 }}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{item.name}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">{item.quantity} x {formatCurrency(item.unit_price)}</p>
                </div>
                <p className="text-sm font-bold text-surface-700 dark:text-surface-200">{formatCurrency(item.quantity * item.unit_price)}</p>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + receipt.items.length * 0.08 }}
            className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-50 to-brand-100/60 dark:from-brand-950/30 dark:to-brand-900/20 rounded-xl mb-5 border border-brand-200/40 dark:border-brand-700/40"
          >
            <span className="font-bold text-surface-900 dark:text-surface-50">Total</span>
            <span className="text-2xl font-extrabold text-brand-700 dark:text-brand-400">{formatCurrency(receipt.total)}</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 + receipt.items.length * 0.08 }}
            className="text-sm text-surface-500 dark:text-surface-400 mb-6 capitalize"
          >
            Paid via <strong className="text-surface-700 dark:text-surface-200">{receipt.payment}</strong>
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + receipt.items.length * 0.08 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setReceipt(null)}
            className="btn-primary w-full py-3.5 text-base gap-2 shadow-lg shadow-brand-500/20"
          >
            <ShoppingBag className="w-4.5 h-4.5" /> New Sale
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* ─── Left: Product Search ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search bar — glassmorphism */}
          <motion.div
            layout
            className={cn(
              'flex items-center gap-3 rounded-2xl px-5 py-3.5 mb-5 transition-all duration-300',
              'bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border shadow-sm',
              searchFocused
                ? 'border-brand-400 shadow-lg shadow-brand-500/10 ring-2 ring-brand-400/20'
                : 'border-surface-200 dark:border-surface-700 shadow-card hover:border-surface-300 dark:hover:border-surface-600',
            )}
          >
            <motion.div
              animate={{ scale: searchFocused ? 1.15 : 1, rotate: searchFocused ? -10 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Search className={cn(
                'w-5 h-5 transition-colors duration-200',
                searchFocused ? 'text-brand-500' : 'text-surface-400 dark:text-surface-500',
              )} />
            </motion.div>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products by name, generic, or category..."
              className="bg-transparent text-sm outline-none flex-1 placeholder:text-surface-400 dark:placeholder:text-surface-500 text-surface-900 dark:text-surface-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              autoFocus
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setSearch('')}
                  className="w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 flex items-center justify-center text-surface-500 dark:text-surface-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <LoadingSpinner />
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-surface-400 dark:text-surface-500"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">
                  {search ? `No products matching "${search}"` : 'No products in inventory'}
                </p>
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((item) => {
                  const inCart = cart.find((c) => c.product_id === item.product_id);
                  const outOfStock = item.quantity_on_hand <= 0;
                  const lowStock = item.quantity_on_hand > 0 && item.quantity_on_hand < 10;

                  return (
                    <motion.button
                      key={item.id}
                      layout
                      layoutId={`product-${item.id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={!outOfStock ? { y: -2, transition: { duration: 0.2 } } : {}}
                      whileTap={!outOfStock ? { scale: 0.97 } : {}}
                      onClick={() => !outOfStock && addToCart(item)}
                      disabled={outOfStock}
                      className={cn(
                        'relative rounded-2xl border p-4 text-left transition-all duration-200',
                        'bg-white dark:bg-surface-900 shadow-sm',
                        outOfStock
                          ? 'opacity-50 cursor-not-allowed border-surface-200 dark:border-surface-700'
                          : 'hover:shadow-elevated hover:bg-gradient-to-br hover:from-white hover:to-brand-50/40 dark:hover:from-surface-900 dark:hover:to-brand-950/30 border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-700',
                        inCart && 'border-brand-400 dark:border-brand-500 bg-gradient-to-br from-white to-brand-50/30 dark:from-surface-900 dark:to-brand-950/20 shadow-md shadow-brand-100/30 dark:shadow-brand-900/20',
                      )}
                    >
                      {/* Category chip */}
                      {item.product?.category && (
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 rounded-full px-2 py-0.5 mb-2.5">
                          {item.product.category}
                        </span>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-surface-900 dark:text-surface-50 truncate leading-tight">
                            {item.product?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-surface-400 dark:text-surface-500 truncate mt-0.5">
                            {item.product?.generic_name || ''}
                            {item.product?.strength ? ` \u00b7 ${item.product.strength}` : ''}
                          </p>
                        </div>

                        {/* In-cart badge */}
                        <AnimatePresence>
                          {inCart && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              className="flex-shrink-0 min-w-[24px] h-6 px-1.5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shadow-sm"
                            >
                              {inCart.quantity}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex items-center justify-between mt-3.5">
                        <span className="text-base font-extrabold text-surface-900 dark:text-surface-50">
                          {formatCurrency(item.selling_price || 0)}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold">
                          <span className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            outOfStock ? 'bg-danger-500' : lowStock ? 'bg-warning-500' : 'bg-emerald-500',
                          )} />
                          <span className={cn(
                            outOfStock ? 'text-danger-500' : lowStock ? 'text-warning-600' : 'text-surface-400 dark:text-surface-500',
                          )}>
                            {outOfStock ? 'Out of stock' : `${item.quantity_on_hand} in stock`}
                          </span>
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        {/* ─── Right: Cart ─── */}
        <div className="w-[400px] flex-shrink-0 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/80 dark:backdrop-blur-xl shadow-lg dark:shadow-surface-950/40 flex flex-col overflow-hidden">
          {/* Cart header — sticky with blur */}
          <div className="sticky top-0 z-10 px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-900/80 backdrop-blur-lg flex items-center justify-between">
            <h3 className="font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              Cart
            </h3>
            <AnimatePresence>
              {cart.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold px-2.5 py-1 rounded-full"
                >
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-surface-400 dark:text-surface-500">
                <div className="w-14 h-14 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-3">
                  <Receipt className="w-7 h-7 opacity-40" />
                </div>
                <p className="text-sm font-medium">Tap products to add</p>
                <p className="text-xs text-surface-300 dark:text-surface-600 mt-1">Items will appear here</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {cart.map((item) => (
                  <motion.div
                    key={item.product_id}
                    initial={{ opacity: 0, height: 0, x: 30 }}
                    animate={{ opacity: 1, height: 'auto', x: 0 }}
                    exit={{ opacity: 0, height: 0, x: -30 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-surface-100 dark:border-surface-800 last:border-b-0"
                  >
                    <div className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <p className="text-sm font-bold text-surface-800 dark:text-surface-100 leading-tight">{item.name}</p>
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => removeFromCart(item.product_id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-surface-400 dark:text-surface-500 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQty(item.product_id, -1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 flex items-center justify-center disabled:opacity-30 transition-colors text-surface-700 dark:text-surface-200"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 1.3, color: 'var(--color-brand-600, #7c3aed)' }}
                            animate={{ scale: 1, color: 'var(--color-surface-900, #111)' }}
                            className="w-10 text-center text-sm font-bold dark:text-surface-50"
                          >
                            {item.quantity}
                          </motion.span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQty(item.product_id, 1)}
                            disabled={item.quantity >= item.max_stock}
                            className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 flex items-center justify-center disabled:opacity-30 transition-colors text-surface-700 dark:text-surface-200"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                        <p className="text-sm font-bold text-surface-700 dark:text-surface-200">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Cart footer */}
          <AnimatePresence>
            {cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="border-t border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 p-5 space-y-4"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-xs font-medium rounded-xl border border-danger-500/20"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-surface-500 dark:text-surface-400">Total</span>
                  <motion.span
                    key={cartTotal}
                    initial={{ scale: 1.08, y: -2 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-2xl font-extrabold text-surface-900 dark:text-surface-50"
                  >
                    {formatCurrency(cartTotal)}
                  </motion.span>
                </div>

                {/* Payment method */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { key: 'cash', label: 'Cash', icon: Banknote },
                    { key: 'card', label: 'Card', icon: CreditCard },
                    { key: 'transfer', label: 'Transfer', icon: ArrowRight },
                  ].map(({ key, label, icon: Icon }) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setPaymentMethod(key)}
                      className={cn(
                        'relative flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 overflow-hidden',
                        paymentMethod === key
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 shadow-sm shadow-brand-200/30 dark:shadow-brand-900/20'
                          : 'border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800',
                      )}
                    >
                      <motion.div
                        animate={paymentMethod === key ? { y: [0, -3, 0], scale: [1, 1.15, 1] } : { y: 0, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                      {label}
                      {paymentMethod === key && (
                        <motion.div
                          layoutId="payment-indicator"
                          className="absolute inset-0 border-2 border-brand-500 rounded-xl"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.015, boxShadow: '0 8px 30px -4px rgba(var(--color-brand-rgb, 124, 58, 237), 0.35)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={cn(
                    'w-full py-4 text-base font-bold rounded-xl text-white transition-all duration-200',
                    'bg-gradient-to-r from-brand-600 to-brand-700 shadow-lg shadow-brand-500/25',
                    'hover:from-brand-500 hover:to-brand-600',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                    'flex items-center justify-center gap-2',
                  )}
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5" />
                      Complete Sale — {formatCurrency(cartTotal)}
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
