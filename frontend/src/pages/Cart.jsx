import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Cart() {
  const [cart, setCart] = useState([])
  const [ordering, setOrdering] = useState(false)
  const [orderResult, setOrderResult] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(saved)
  }, [])

  const updateQty = (index, qty) => {
    const updated = [...cart]
    if (qty <= 0) updated.splice(index, 1)
    else updated[index].qty = qty
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const removeItem = (index) => {
    const updated = [...cart]
    updated.splice(index, 1)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const getTotal = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const placeOrder = async () => {
    setOrdering(true)
    try {
      // 1. Create order
      const { data: orderData } = await api.post('/api/orders/', {
        items: cart.map(item => ({ product_id: item.id, qty: item.qty })),
        latitude: 17.385,
        longitude: 78.4867,
      })

      // 2. Create payment
      const { data: paymentData } = await api.post(`/api/payments/create-order/${orderData.order_id}`)

      if (paymentData.mock_mode) {
        // Mock payment — auto verify
        await api.post(`/api/payments/verify/${orderData.order_id}`, { mock: true })
        setOrderResult({ ...orderData, payment: paymentData.breakdown })
        localStorage.removeItem('cart')
        setCart([])
      } else {
        // Real Razorpay checkout
        const options = {
          key: paymentData.key_id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          order_id: paymentData.order_id,
          name: "Konara",
          description: "Grocery Order Payment",
          handler: async (response) => {
            await api.post(`/api/payments/verify/${orderData.order_id}`, response)
            setOrderResult({ ...orderData, payment: paymentData.breakdown })
            localStorage.removeItem('cart')
            setCart([])
          },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Order failed')
    } finally {
      setOrdering(false)
    }
  }

  if (orderResult) {
    return (
      <div className="max-w-md mx-auto p-6 text-center mt-12 bg-pattern min-h-[calc(100vh-64px)]">
        <div className="bg-white rounded-3xl shadow-xl p-10 border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
          <div className="text-6xl mb-4 floating">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed & Paid!</h2>
          <p className="text-gray-500 mb-4">Split across {orderResult.sub_orders} vendor(s)</p>

          {orderResult.payment && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">💳 Payment Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{orderResult.payment.subtotal}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Delivery Fee</span><span>₹{orderResult.payment.delivery_fee}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span>₹{orderResult.payment.platform_fee}</span></div>
                <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Total Paid</span><span className="text-green-700">₹{orderResult.payment.total}</span></div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/orders')} className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition">
              📋 View Orders
            </button>
            <button onClick={() => navigate('/search')} className="border border-green-600 text-green-600 px-6 py-3 rounded-xl font-medium hover:bg-green-50 transition">
              🔍 Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-pattern min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🛒 Your Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border">
          <div className="text-4xl mb-4">🛍️</div>
          <p className="text-gray-400 mb-4">Your cart is empty</p>
          <button onClick={() => navigate('/search')} className="text-green-600 font-medium hover:underline">
            Browse products
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {cart.map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.vendor_name} • ₹{item.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(i, item.qty - 1)} className="bg-gray-100 w-8 h-8 rounded-lg font-bold hover:bg-gray-200">-</button>
                  <span className="font-semibold w-6 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(i, item.qty + 1)} className="bg-gray-100 w-8 h-8 rounded-lg font-bold hover:bg-gray-200">+</button>
                  <button onClick={() => removeItem(i)} className="text-red-400 ml-2 hover:text-red-600">✕</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{getTotal()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery Fee</span><span>₹30</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform Fee (10%)</span><span>₹{Math.round(getTotal() * 0.1)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-green-700">₹{getTotal() + 30}</span>
              </div>
            </div>
          </div>

          <button onClick={placeOrder} disabled={ordering}
            className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 shadow-md transition disabled:opacity-50">
            {ordering ? 'Placing Order...' : 'Place Order'}
          </button>
        </>
      )}
    </div>
  )
}
