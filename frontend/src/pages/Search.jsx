import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [parsedItems, setParsedItems] = useState([])
  const [searchType, setSearchType] = useState('products')
  const [cartCount, setCartCount] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]').length)
  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      if (searchType === 'products') {
        const { data } = await api.post('/api/search/', {
          query,
          latitude: 17.385,
          longitude: 78.4867,
          max_distance_km: 10,
        })
        setResults(data.results)
        setParsedItems(data.query_parsed)
      } else {
        const { data } = await api.get('/api/vendors/nearby?lat=17.385&lng=78.4867&radius_km=10')
        const filtered = data.filter(v =>
          v.shop_name.toLowerCase().includes(query.toLowerCase()) ||
          v.category.toLowerCase().includes(query.toLowerCase())
        )
        setResults(filtered)
        setParsedItems([])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const [cartItems, setCartItems] = useState(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const map = {}
    cart.forEach(item => { map[item.id] = item.qty })
    return map
  })

  const addToCart = (product, e) => {
    e.stopPropagation()
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(item => item.id === product.id)
    if (existing) existing.qty += 1
    else cart.push({ ...product, qty: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    setCartCount(cart.length)
    setCartItems(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }))
  }

  const removeFromCart = (product, e) => {
    e.stopPropagation()
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
    const m = { dairy:'🥛', vegetables:'🥬', grains:'🍚', meat:'🍖', bakery:'🍞', oil:'🫒', spices:'🌶️', fruits:'🍎', grocery:'🛒', household:'🧹' }
    return m[cat] || '📦'
  }

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-[calc(100vh-64px)] relative">
      {/* Background image with green overlay */}
      <div className="fixed inset-0 top-16 bg-cover bg-center pointer-events-none" style={{backgroundImage: "url('/homelogo2.png')"}}></div>
      <div className="fixed inset-0 top-16 bg-green-900/60 pointer-events-none"></div>
      <div className="relative z-10">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-green-700 mb-4 flex items-center gap-1 text-sm">
        ← Back
      </button>

      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Find the best deals nearby</h1>

        {/* Search Type Toggle */}
        <div className="flex gap-2 mb-3">
          <button onClick={() => setSearchType('products')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              searchType === 'products' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}>
            🏷️ Products
          </button>
          <button onClick={() => setSearchType('shops')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              searchType === 'shops' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}>
            🏪 Shops
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={searchType === 'products' ? "Search 'milk', 'rice', 'oil'..." : "Search shop name..."}
              className="w-full border border-gray-200 rounded-xl p-4 pl-11 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
            <span className="absolute left-4 top-4 text-gray-400">🔍</span>
          </div>
          <button type="submit" className="bg-green-600 text-white px-6 rounded-xl font-medium hover:bg-green-700 shadow-sm transition">
            {loading ? '...' : 'Search'}
          </button>
        </form>
      </div>

      {/* AI Notice */}
      {parsedItems.length > 1 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-purple-700">✨ AI expanded: <strong>{parsedItems.join(', ')}</strong></p>
        </div>
      )}

      {/* Cart floating badge */}
      {cartCount > 0 && (
        <Link to="/cart" className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 hover:bg-green-700 z-50 hover:scale-105 transition-all">
          🛒 View Cart ({cartCount}) →
        </Link>
      )}

      {/* Product Results - clickable to navigate to shop */}
      {searchType === 'products' ? (
        <div className="space-y-3">
          {results.map((product, i) => (
            <div key={i} onClick={() => navigate(`/shop/${product.vendor_id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center hover:shadow-md hover:border-green-200 transition cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition">
                  {getIcon(product.category)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-sm text-green-600 font-medium">{product.vendor_name} →</p>
                  <div className="flex gap-2 mt-1">
                    {product.distance_km && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">📍 {product.distance_km} km</span>
                    )}
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{product.stock_qty} in stock</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-700">₹{product.price}</p>
                {cartItems[product.id] ? (
                  <div className="mt-2 flex items-center gap-2 justify-end" onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => removeFromCart(product, e)}
                      className="bg-red-100 text-red-600 w-7 h-7 rounded-lg font-bold hover:bg-red-200 text-sm">−</button>
                    <span className="font-bold text-green-700 w-5 text-center">{cartItems[product.id]}</span>
                    <button onClick={(e) => addToCart(product, e)}
                      className="bg-green-100 text-green-700 w-7 h-7 rounded-lg font-bold hover:bg-green-200 text-sm">+</button>
                  </div>
                ) : (
                  <button onClick={(e) => addToCart(product, e)}
                    className="mt-2 bg-green-600 text-white text-xs px-4 py-1.5 rounded-lg font-medium hover:bg-green-700 transition">
                    + Add to Cart
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((shop, i) => (
            <Link to={`/shop/${shop.id}`} key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-green-200 transition block group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">🏪</div>
                <div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-green-700 transition">{shop.shop_name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{shop.category}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                  {shop.is_open ? '🟢 Open' : '🔴 Closed'}
                </span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  📍 {shop.delivery_radius_km} km delivery
                </span>
              </div>
              <p className="text-xs text-green-600 mt-3 font-medium">Click to view items →</p>
            </Link>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🛍️</div>
          <p className="text-gray-400 mb-2">Search for products or shops</p>
          <p className="text-xs text-gray-300">Try "milk", "rice", "vegetables" or search by shop name</p>
        </div>
      )}

      {/* Scroll to top */}
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
        className="fixed bottom-6 left-6 bg-white border shadow-lg w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 z-50">
        ↑
      </button>
      </div>
    </div>
  )
}
