'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { StatCard, DataTable, StatusBadge } from '@/components/ui';
import { TrendingUp, DollarSign, ShoppingBag, BarChart3, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';

const mockDailyRevenue = [
  { date: 'Mon', revenue: 145000 },
  { date: 'Tue', revenue: 198000 },
  { date: 'Wed', revenue: 167000 },
  { date: 'Thu', revenue: 245000 },
  { date: 'Fri', revenue: 312000 },
  { date: 'Sat', revenue: 289000 },
  { date: 'Sun', revenue: 178000 },
];

const mockTopProducts = [
  { name: 'Paracetamol 500mg', quantity: 450, revenue: 157500 },
  { name: 'Amoxicillin 500mg', quantity: 120, revenue: 144000 },
  { name: 'Metformin 500mg', quantity: 200, revenue: 120000 },
  { name: 'Vitamin C 1000mg', quantity: 350, revenue: 105000 },
  { name: 'Omeprazole 20mg', quantity: 95, revenue: 76000 },
];

const mockRecentSales = [
  { id: '1', cashier: 'Amina K.', total: 4500, items: 3, payment: 'cash', date: new Date(Date.now() - 600000).toISOString() },
  { id: '2', cashier: 'Chidi E.', total: 12800, items: 5, payment: 'transfer', date: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', cashier: 'Amina K.', total: 2300, items: 2, payment: 'card', date: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', cashier: 'Bola A.', total: 8900, items: 4, payment: 'cash', date: new Date(Date.now() - 14400000).toISOString() },
  { id: '5', cashier: 'Chidi E.', total: 35600, items: 8, payment: 'transfer', date: new Date(Date.now() - 28800000).toISOString() },
];

const maxRevenue = Math.max(...mockDailyRevenue.map(d => d.revenue));

export default function SalesPage() {
  const [period, setPeriod] = useState('7d');

  const totalRevenue = mockDailyRevenue.reduce((sum, d) => sum + d.revenue, 0);
  const avgSale = totalRevenue / mockRecentSales.length;

  return (
    <>
      <Header title="Sales & Analytics" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Weekly Revenue" value={formatCurrency(totalRevenue)} change="+12.5%" icon={TrendingUp} color="brand" />
          <StatCard label="Total Sales" value={mockRecentSales.length} icon={ShoppingBag} color="info" />
          <StatCard label="Avg. Sale Value" value={formatCurrency(avgSale)} icon={DollarSign} color="brand" />
          <StatCard label="Anomalies Detected" value="1" change="Revenue spike Fri" icon={AlertCircle} color="warning" />
        </div>

        {/* Revenue Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-surface-900">Revenue Trend</h3>
            <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
              {['7d', '30d', '90d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
                    period === p ? 'bg-white text-surface-800 shadow-sm' : 'text-surface-500 hover:text-surface-700',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Simple bar chart */}
          <div className="flex items-end gap-3 h-48">
            {mockDailyRevenue.map((d, i) => {
              const height = (d.revenue / maxRevenue) * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 stagger-item">
                  <span className="text-xs font-semibold text-surface-500">{formatCurrency(d.revenue)}</span>
                  <div
                    className={cn(
                      'w-full rounded-t-lg transition-all duration-500',
                      i === 4 ? 'bg-brand-500' : 'bg-brand-200 hover:bg-brand-300',
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs font-medium text-surface-400">{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-200">
              <h3 className="font-bold text-surface-900">Top Selling Products</h3>
            </div>
            <div className="divide-y divide-surface-100">
              {mockTopProducts.map((product, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between stagger-item">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
                      i === 0 ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500',
                    )}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-surface-800">{product.name}</p>
                      <p className="text-xs text-surface-400">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-surface-700">{formatCurrency(product.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-200">
              <h3 className="font-bold text-surface-900">Recent Sales</h3>
            </div>
            <div className="divide-y divide-surface-100">
              {mockRecentSales.map((sale) => (
                <div key={sale.id} className="px-5 py-3.5 flex items-center justify-between stagger-item">
                  <div>
                    <p className="text-sm font-semibold text-surface-800">{formatCurrency(sale.total)}</p>
                    <p className="text-xs text-surface-400">{sale.items} items · {sale.cashier}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn('badge', {
                      'bg-brand-100 text-brand-700': sale.payment === 'cash',
                      'bg-info-500/10 text-info-600': sale.payment === 'transfer',
                      'bg-surface-200 text-surface-600': sale.payment === 'card',
                    })}>
                      {sale.payment}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
