import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/api/orders/my-orders')
      setOrders(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-blue-100 text-blue-700',
      preparing: 'bg-purple-100 text-purple-700',
      ready: 'bg-green-100 text-green-700',
      delivered: 'bg-gray-100 text-gray-600',
      rejected: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  const getStatusIcon = (status) => {
    const icons = { pending: '⏳', accepted: '✅', preparing: '👨‍🍳', ready: '📦', delivered: '🎉', rejected: '❌' }
    return icons[status] || '📋'
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading orders...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border">
          <div className="text-4xl mb-4">🛍️</div>
          <p className="text-gray-400 mb-4">No orders yet</p>
          <Link to="/search" className="text-green-600 font-medium hover:underline">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm font-medium text-gray-600">
                  {order.sub_orders.length} vendor{order.sub_orders.length > 1 ? 's' : ''}
                </p>
              </div>

              {order.sub_orders.map((sub, j) => (
                <div key={j} className="border-t pt-3 mt-3 first:border-0 first:pt-0 first:mt-0">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-gray-800">🏪 {sub.vendor_name}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(sub.status)}`}>
                      {getStatusIcon(sub.status)} {sub.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {sub.items.map((item, k) => (
                      <div key={k} className="flex justify-between text-sm text-gray-600">
                        <span>{item.name} × {item.qty}</span>
                        <span>₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-right font-bold text-green-700 mt-2">₹{sub.total}</p>
                </div>
              ))}

              <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-green-700">₹{order.sub_orders.reduce((s, o) => s + o.total, 0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
