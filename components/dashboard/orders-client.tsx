'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ShoppingBag, Phone, ChevronRight, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPhone, formatCurrency, ORDER_STATUS_COLORS } from '@/lib/utils'
import type { OrderStatus } from '@/lib/utils'

interface OrderItem {
  id: string
  quantity: number
  price: number
  notes: string | null
  menuItem: { name: string }
}

interface Order {
  id: string
  orderNumber: string
  guestName: string
  guestPhone: string
  type: string
  status: string
  totalAmount: number
  deliveryAddress: string | null
  notes: string | null
  items: OrderItem[]
  createdAt: string
}

const STATUS_FLOW: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Confirm',
  confirmed: 'Start Prep',
  preparing: 'Mark Ready',
  ready: 'Delivered',
}

export function OrdersClient({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('active')

  const fetchOrders = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ restaurantId })
    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [restaurantId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const advanceStatus = async (id: string, currentStatus: string) => {
    const next = STATUS_FLOW[currentStatus]
    if (!next) return
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    fetchOrders()
  }

  const cancelOrder = async (id: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    fetchOrders()
  }

  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready']
  const filtered = orders.filter((o) =>
    statusFilter === 'active'
      ? activeStatuses.includes(o.status)
      : statusFilter === 'all'
      ? true
      : o.status === statusFilter
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Orders</SelectItem>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500">{filtered.length} orders</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-slate-400">
            <ShoppingBag size={48} className="opacity-20 mb-4" />
            <p className="text-lg font-medium text-slate-500">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status as OrderStatus] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {order.status}
                      </span>
                      <Badge variant={order.type === 'delivery' ? 'info' : 'secondary'} className="text-xs">
                        {order.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <span>{order.guestName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {formatPhone(order.guestPhone)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</div>
                    <div className="text-xs text-slate-400">{format(new Date(order.createdAt), 'h:mm a')}</div>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-1 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        <span className="font-medium text-slate-900">{item.quantity}×</span> {item.menuItem.name}
                        {item.notes && <span className="text-slate-400 text-xs ml-1">({item.notes})</span>}
                      </span>
                      <span className="text-slate-500">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  {order.deliveryAddress && (
                    <p className="text-xs text-slate-400 mt-1 pt-1 border-t border-slate-200">📍 {order.deliveryAddress}</p>
                  )}
                </div>

                {/* Actions */}
                {STATUS_FLOW[order.status] && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => advanceStatus(order.id, order.status)}
                    >
                      {STATUS_LABEL[order.status]}
                      <ArrowRight size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelOrder(order.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
