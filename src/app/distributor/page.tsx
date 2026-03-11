'use client';

import Header from '@/components/layout/Header';
import { StatCard, StatusBadge } from '@/components/ui';
import { Package, ShoppingCart, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { getStoredUser } from '@/lib/api';

const mockStats = {
  catalogProducts: 156,
  pendingOrders: 12,
  monthlyRevenue: 8450000,
  avgFulfillmentHours: 4.2,
};

const mockIncomingOrders = [
  { id: '1', order_number: 'ORD-X3K9A2', pharmacy: 'HealthFirst Pharmacy', status: 'submitted', total: 245000, items: 8, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', order_number: 'ORD-Y7M2B5', pharmacy: 'GoodHealth Pharm', status: 'submitted', total: 128500, items: 4, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', order_number: 'ORD-Z1P4C8', pharmacy: 'MediCare Plus', status: 'confirmed', total: 367200, items: 12, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', order_number: 'ORD-W5R8D1', pharmacy: 'HealthFirst Pharmacy', status: 'processing', total: 93800, items: 6, created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: '5', order_number: 'ORD-V2S6E9', pharmacy: 'UniPharm Lagos', status: 'ready', total: 185000, items: 10, created_at: new Date(Date.now() - 28800000).toISOString() },
];

const mockTopPharmacies = [
  { name: 'HealthFirst Pharmacy', orders: 34, revenue: 2150000 },
  { name: 'GoodHealth Pharm', orders: 28, revenue: 1890000 },
  { name: 'MediCare Plus', orders: 22, revenue: 1670000 },
  { name: 'UniPharm Lagos', orders: 18, revenue: 1240000 },
];

export default function DistributorDashboard() {
  const user = getStoredUser();

  return (
    <>
      <Header title="Distributor Dashboard" />

      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="card p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
          <h2 className="text-xl font-extrabold tracking-tight">
            Welcome, {user?.full_name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-blue-100 mt-1 text-sm">
            You have <strong>{mockStats.pendingOrders} pending orders</strong> awaiting confirmation.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Catalog Products" value={mockStats.catalogProducts} icon={Package} color="info" />
          <StatCard label="Pending Orders" value={mockStats.pendingOrders} change="5 new today" icon={ShoppingCart} color="warning" />
          <StatCard label="Monthly Revenue" value={formatCurrency(mockStats.monthlyRevenue)} change="+18.3%" icon={TrendingUp} color="brand" />
          <StatCard label="Avg. Fulfillment" value={`${mockStats.avgFulfillmentHours}h`} icon={Clock} color="info" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Incoming Orders */}
          <div className="xl:col-span-2 card">
            <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
              <h3 className="font-bold text-surface-900">Incoming Orders</h3>
              <a href="/distributor/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="divide-y divide-surface-100">
              {mockIncomingOrders.map((order) => (
                <div key={order.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-50 transition-colors stagger-item">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-800 font-mono">{order.order_number}</p>
                      <p className="text-xs text-surface-400">{order.pharmacy} · {order.items} items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-surface-700">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-surface-400">{formatRelativeTime(order.created_at)}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Pharmacies */}
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-200">
              <h3 className="font-bold text-surface-900">Top Pharmacy Buyers</h3>
            </div>
            <div className="divide-y divide-surface-100">
              {mockTopPharmacies.map((pharm, i) => (
                <div key={i} className="px-5 py-3.5 stagger-item">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold',
                        i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-surface-100 text-surface-500'
                      )}>
                        {i + 1}
                      </span>
                      <p className="text-sm font-semibold text-surface-800">{pharm.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between ml-8">
                    <p className="text-xs text-surface-400">{pharm.orders} orders</p>
                    <p className="text-sm font-bold text-surface-700">{formatCurrency(pharm.revenue)}</p>
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
