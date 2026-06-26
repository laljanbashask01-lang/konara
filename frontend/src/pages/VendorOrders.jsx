import { useState, useEffect } from 'react'
import api from '../api'

export default function VendorOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/api/orders/vendor-orders')
      setOrders(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const updateStatus = async (orderId, vendorId, newStatus) => {
    try {
      await api.patch(`/api/orders/${orderId}/status?vendor_id=${vendorId}&status=${newStatus}`)
      loadOrders()
    } catch (err) { console.error(err) }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      accepted: 'bg-blue-100 text-blue-700 border-blue-200',
      preparing: 'bg-purple-100 text-purple-700 border-purple-200',
      ready: 'bg-green-100 text-green-700 border-green-200',
      delivered: 'bg-gray-100 text-gray-600 border-gray-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || 'bg-gray-100'
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading orders...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📦 Incoming Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-400">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <div key={i} className={`bg-white rounded-xl shadow-sm border p-5 ${order.status === 'pending' ? 'border-yellow-300' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item, k) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.name} × {item.qty}</span>
                    <span className="font-medium">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <p className="font-bold text-green-700 text-lg">₹{order.total}</p>

                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(order.order_id, order.vendor_id, 'accepted')}
                      className="bg-green-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-green-700">
                      ✓ Accept
                    </button>
                    <button onClick={() => updateStatus(order.order_id, order.vendor_id, 'rejected')}
                      className="bg-red-100 text-red-600 text-xs px-4 py-2 rounded-lg hover:bg-red-200">
                      ✕ Reject
                    </button>
                  </div>
                )}
                {order.status === 'accepted' && (
                  <button onClick={() => updateStatus(order.order_id, order.vendor_id, 'preparing')}
                    className="bg-purple-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-purple-700">
                    🍳 Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button onClick={() => updateStatus(order.order_id, order.vendor_id, 'ready')}
                    className="bg-green-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-green-700">
                    📦 Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button onClick={() => updateStatus(order.order_id, order.vendor_id, 'delivered')}
                    className="bg-gray-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-gray-700">
                    🎉 Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
