import { useState, useEffect } from 'react'
import api from '../api'

export default function DeliveryDashboard() {
  const [tab, setTab] = useState('available')
  const [available, setAvailable] = useState([])
  const [myDeliveries, setMyDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'available') {
        const { data } = await api.get('/api/delivery/available-orders')
        setAvailable(data)
      } else {
        const { data } = await api.get('/api/delivery/my-deliveries')
        setMyDeliveries(data)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const acceptOrder = async (orderId) => {
    try {
      await api.post(`/api/delivery/accept/${orderId}`)
      loadData()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/api/delivery/update-status/${orderId}?status=${status}`)
      loadData()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const getStatusBtn = (order) => {
    const s = order.delivery_status
    if (s === 'agent_assigned') return { label: '📦 Mark Picked Up', next: 'picked_up', color: 'bg-blue-600' }
    if (s === 'picked_up') return { label: '🚗 On The Way', next: 'on_the_way', color: 'bg-purple-600' }
    if (s === 'on_the_way') return { label: '✅ Delivered', next: 'delivered', color: 'bg-green-600' }
    return null
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-pattern min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🚗 Delivery Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Pick up orders from vendors and deliver to customers</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('available')}
          className={`px-5 py-2 rounded-xl text-sm font-medium ${tab === 'available' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600'}`}>
          📋 Available Orders
        </button>
        <button onClick={() => setTab('my')}
          className={`px-5 py-2 rounded-xl text-sm font-medium ${tab === 'my' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600'}`}>
          🚗 My Deliveries
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}

      {/* Available Orders */}
      {tab === 'available' && !loading && (
        <div className="space-y-4">
          {available.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-400">No orders ready for pickup</p>
            </div>
          ) : available.map((order, i) => (
            <div key={i} className="bg-white rounded-xl border shadow-sm p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Ready for Pickup</span>
              </div>
              <div className="space-y-2 mb-4">
                {order.sub_orders.map((sub, j) => (
                  <div key={j} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-sm">🏪 {sub.vendor_name}</p>
                    <p className="text-xs text-gray-500">{sub.items.length} item(s) • ₹{sub.total}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <p className="font-bold text-green-700">Total: ₹{order.sub_orders.reduce((s, o) => s + o.total, 0)}</p>
                <button onClick={() => acceptOrder(order.id)}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                  🙋 Accept Delivery
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Deliveries */}
      {tab === 'my' && !loading && (
        <div className="space-y-4">
          {myDeliveries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border">
              <div className="text-4xl mb-3">🚗</div>
              <p className="text-gray-400">No active deliveries</p>
            </div>
          ) : myDeliveries.map((order, i) => {
            const btn = getStatusBtn(order)
            return (
              <div key={i} className="bg-white rounded-xl border shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    order.delivery_status === 'delivered' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
                  }`}>{order.delivery_status.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</span>
                </div>
                <div className="space-y-2 mb-4">
                  {order.sub_orders.map((sub, j) => (
                    <div key={j} className="bg-gray-50 rounded-lg p-3 flex justify-between">
                      <div>
                        <p className="font-medium text-sm">🏪 {sub.vendor_name}</p>
                        <p className="text-xs text-gray-500">{sub.items.map(i => i.name).join(', ')}</p>
                      </div>
                      <p className="font-medium text-sm">₹{sub.total}</p>
                    </div>
                  ))}
                </div>
                {btn && (
                  <button onClick={() => updateStatus(order.id, btn.next)}
                    className={`w-full ${btn.color} text-white py-3 rounded-xl font-medium hover:opacity-90`}>
                    {btn.label}
                  </button>
                )}
                {order.delivery_status === 'delivered' && (
                  <p className="text-center text-green-600 font-medium py-2">✅ Delivered successfully</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
