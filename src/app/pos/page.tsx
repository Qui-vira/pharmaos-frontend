'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui';
import {
  Search, Plus, Minus, Trash2, ShoppingBag, CreditCard,
  Banknote, ArrowRight, CheckCircle, X, Receipt,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { inventoryApi, salesApi } from '@/lib/api';

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

  // Receipt view
  if (receipt) {
    return (
      <>
        <Header title="Point of Sale" />
        <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-brand-600" />
            </div>
            <h2 className="text-xl font-extrabold text-surface-900 mb-1">Sale Complete</h2>
            <p className="text-sm text-surface-500 mb-6">
              {new Date(receipt.date).toLocaleString('en-NG')}
            </p>

            <div className="bg-surface-50 rounded-xl divide-y divide-surface-200 mb-4 text-left">
              {receipt.items.map((item) => (
                <div key={item.product_id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-800">{item.name}</p>
                    <p className="text-xs text-surface-400">{item.quantity} x {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(item.quantity * item.unit_price)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-brand-50 rounded-xl mb-4">
              <span className="font-bold text-surface-900">Total</span>
              <span className="text-xl font-extrabold text-brand-700">{formatCurrency(receipt.total)}</span>
            </div>

            <p className="text-sm text-surface-500 mb-6 capitalize">
              Paid via <strong>{receipt.payment}</strong>
            </p>

            <button
              onClick={() => setReceipt(null)}
              className="btn-primary w-full"
            >
              <ShoppingBag className="w-4 h-4" /> New Sale
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Point of Sale" />

      <div className="p-6">
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
          {/* ─── Left: Product Search ─── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search bar */}
            <div className="flex items-center gap-2 bg-white border border-surface-200 rounded-xl px-4 py-3 shadow-card mb-4">
              <Search className="w-5 h-5 text-surface-400" />
              <input
                type="text"
                placeholder="Search products by name, generic, or category..."
                className="bg-transparent text-sm outline-none flex-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-surface-400 hover:text-surface-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Product grid */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <LoadingSpinner />
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-surface-400">
                  <ShoppingBag className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm font-medium">
                    {search ? `No products matching "${search}"` : 'No products in inventory'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filtered.map((item) => {
                    const inCart = cart.find((c) => c.product_id === item.product_id);
                    const outOfStock = item.quantity_on_hand <= 0;

                    return (
                      <button
                        key={item.id}
                        onClick={() => !outOfStock && addToCart(item)}
                        disabled={outOfStock}
                        className={cn(
                          'card p-4 text-left transition-all hover:shadow-elevated',
                          outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-300 active:scale-[0.98]',
                          inCart && 'border-brand-400 bg-brand-50/30',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-surface-800 truncate">
                              {item.product?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-surface-400 truncate">
                              {item.product?.generic_name || ''}
                              {item.product?.strength ? ` · ${item.product.strength}` : ''}
                            </p>
                          </div>
                          {inCart && (
                            <span className="badge bg-brand-600 text-white flex-shrink-0">
                              {inCart.quantity}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-base font-extrabold text-surface-900">
                            {formatCurrency(item.selling_price || 0)}
                          </span>
                          <span className={cn(
                            'text-xs font-semibold',
                            outOfStock ? 'text-danger-500' : item.quantity_on_hand < 10 ? 'text-warning-600' : 'text-surface-400',
                          )}>
                            {outOfStock ? 'Out of stock' : `${item.quantity_on_hand} in stock`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ─── Right: Cart ─── */}
          <div className="w-[380px] flex-shrink-0 card flex flex-col">
            {/* Cart header */}
            <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
              <h3 className="font-bold text-surface-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Cart
              </h3>
              {cart.length > 0 && (
                <span className="badge bg-brand-100 text-brand-700">{cart.length} items</span>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto divide-y divide-surface-100">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-surface-400">
                  <Receipt className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">Tap products to add</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-surface-800 leading-tight">{item.name}</p>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-surface-400 hover:text-danger-500 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.product_id, -1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center disabled:opacity-40"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product_id, 1)}
                          disabled={item.quantity >= item.max_stock}
                          className="w-8 h-8 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-surface-700">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart footer */}
            {cart.length > 0 && (
              <div className="border-t border-surface-200 p-4 space-y-4">
                {error && (
                  <div className="p-2.5 bg-danger-500/10 text-danger-600 text-xs font-medium rounded-xl border border-danger-500/20">
                    {error}
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-surface-600">Total</span>
                  <span className="text-2xl font-extrabold text-surface-900">{formatCurrency(cartTotal)}</span>
                </div>

                {/* Payment method */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'cash', label: 'Cash', icon: Banknote },
                    { key: 'card', label: 'Card', icon: CreditCard },
                    { key: 'transfer', label: 'Transfer', icon: ArrowRight },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setPaymentMethod(key)}
                      className={cn(
                        'flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all',
                        paymentMethod === key
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-surface-200 text-surface-500 hover:border-surface-300',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary w-full py-3.5 text-base"
                >
                  {submitting ? 'Processing...' : (
                    <>Complete Sale — {formatCurrency(cartTotal)}</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
