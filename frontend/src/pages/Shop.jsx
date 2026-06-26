import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Shop() {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]').length)

  useEffect(() => { loadShop() }, [vendorId])

  const loadShop = async () => {
    try {
      const [vendorRes, productsRes] = await Promise.all([
        api.get(`/api/vendors/${vendorId}`),
        api.get(`/api/products/vendor/${vendorId}`),
      ])
      setVendor(vendorRes.data)
      setProducts(productsRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const [cartItems, setCartItems] = useState(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const map = {}
    cart.forEach(item => { map[item.id] = item.qty })
    return map
  })

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(item => item.id === product.id)
    if (existing) existing.qty += 1
    else cart.push({ ...product, qty: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    setCartCount(cart.length)
    setCartItems(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }))
  }

  const removeFromCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      existing.qty -= 1
      if (existing.qty <= 0) cart.splice(cart.indexOf(existing), 1)
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    setCartCount(cart.filter(i => i.qty > 0).length)
    setCartItems(prev => {
      const newQty = (prev[product.id] || 1) - 1
      if (newQty <= 0) { const copy = {...prev}; delete copy[product.id]; return copy }
      return { ...prev, [product.id]: newQty }
    })
  }

  const getIcon = (cat) => {
    const m = { dairy:'🥛', vegetables:'🥬', grains:'🍚', meat:'🍖', bakery:'🍞',
      oil:'🫒', spices:'🌶️', fruits:'🍎', grocery:'🛒', household:'🧹' }
    return m[cat] || '📦'
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading shop...</div>
  if (!vendor) return <div className="text-center py-16 text-red-500">Shop not found</div>

  return (
    <div className="max-w-3xl mx-auto p-6 bg-pattern min-h-[calc(100vh-64px)]">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-green-700 mb-4 flex items-center gap-1 text-sm">
        ← Back to search
      </button>
      {/* Shop Header - Storefront Style */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 rounded-3xl p-8 mb-6 text-white relative overflow-hidden shadow-xl">
        {/* Awning stripes decoration */}
        <div className="absolute top-0 left-0 w-full h-3 flex">
          <div className="flex-1 bg-green-800"></div>
          <div className="flex-1 bg-white/20"></div>
          <div className="flex-1 bg-green-800"></div>
          <div className="flex-1 bg-white/20"></div>
          <div className="flex-1 bg-green-800"></div>
          <div className="flex-1 bg-white/20"></div>
          <div className="flex-1 bg-green-800"></div>
          <div className="flex-1 bg-white/20"></div>
        </div>
        {/* Floating decorations */}
        <div className="absolute top-4 right-6 text-4xl opacity-20 floating">🏪</div>
        <div className="absolute bottom-4 right-20 text-2xl opacity-20 floating" style={{animationDelay:'2s'}}>🛒</div>

        <div className="flex items-center gap-5 relative z-10 mt-2">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl shadow-inner">🏪</div>
          <div>
            <h1 className="text-3xl font-bold">{vendor.shop_name}</h1>
            <p className="text-green-100 capitalize text-lg">{vendor.category}</p>
            <div className="flex gap-3 mt-3 flex-wrap">
              <span className="text-xs bg-white/20 backdrop-blur px-3 py-1.5 rounded-full font-medium">
                {vendor.is_open ? '🟢 Open Now' : '🔴 Closed'}
              </span>
              <span className="text-xs bg-white/20 backdrop-blur px-3 py-1.5 rounded-full">
                📍 Delivers within {vendor.delivery_radius_km} km
              </span>
              <span className="text-xs bg-white/20 backdrop-blur px-3 py-1.5 rounded-full">
                📦 {products.length} items available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Float */}
      {cartCount > 0 && (
        <Link to="/cart" className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-green-700 z-50">
          🛒 Cart ({cartCount})
        </Link>
      )}

      {/* Products Grid */}
      <h2 className="font-semibold text-gray-700 mb-4">Available Items</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xl">
                  {getIcon(p.category)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{p.name}</h3>
                  <p className="text-xs text-gray-400 capitalize">{p.category}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-700">₹{p.price}</p>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-gray-400">{p.stock_qty} in stock</span>
              {cartItems[p.id] ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => removeFromCart(p)}
                    className="bg-red-100 text-red-600 w-7 h-7 rounded-lg font-bold hover:bg-red-200 text-sm">−</button>
                  <span className="font-bold text-green-700 w-5 text-center">{cartItems[p.id]}</span>
                  <button onClick={() => addToCart(p)}
                    className="bg-green-100 text-green-700 w-7 h-7 rounded-lg font-bold hover:bg-green-200 text-sm">+</button>
                </div>
              ) : (
                <button onClick={() => addToCart(p)}
                  className="text-xs px-4 py-1.5 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition">
                  + Add
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll to top */}
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
        className="fixed bottom-6 left-6 bg-white border shadow-lg w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 z-50">
        ↑
      </button>
    </div>
  )
}
