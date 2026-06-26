import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function VendorDashboard() {
  const [products, setProducts] = useState([])
  const [shopInfo, setShopInfo] = useState(null)
  const [form, setForm] = useState({ name: '', category: '', price: '', stock_qty: '' })
  const navigate = useNavigate()

  useEffect(() => {
    checkShop()
  }, [])

  const checkShop = async () => {
    try {
      const { data } = await api.get('/api/vendors/me')
      setShopInfo(data)
      loadProducts()
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/vendor/setup')
      }
    }
  }

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/api/products/my-products')
      setProducts(data)
    } catch (err) { console.error(err) }
  }

  const addProduct = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/products/', {
        ...form,
        price: parseFloat(form.price),
        stock_qty: parseInt(form.stock_qty),
      })
      setForm({ name: '', category: '', price: '', stock_qty: '' })
      loadProducts()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-green-700 mb-2">🏪 Vendor Dashboard</h1>
      {shopInfo && (
        <p className="text-gray-500 mb-6">{shopInfo.shop_name} • {shopInfo.category} • {shopInfo.is_open ? '🟢 Open' : '🔴 Closed'}</p>
      )}

      <form onSubmit={addProduct} className="bg-white rounded-lg shadow p-4 mb-6 space-y-3">
        <h3 className="font-semibold">Add Product</h3>
        <input placeholder="Product name" className="w-full border rounded p-2"
          value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        <input placeholder="Category" className="w-full border rounded p-2"
          value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
        <div className="flex gap-2">
          <input type="number" placeholder="Price ₹" className="flex-1 border rounded p-2"
            value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
          <input type="number" placeholder="Stock" className="flex-1 border rounded p-2"
            value={form.stock_qty} onChange={e => setForm({...form, stock_qty: e.target.value})} required />
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-medium">Add Product</button>
      </form>

      <h3 className="font-semibold mb-3">Your Products ({products.length})</h3>
      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded shadow p-3 flex justify-between">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-gray-500">{p.category}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-700">₹{p.price}</p>
              <p className="text-xs text-gray-400">Stock: {p.stock_qty}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
