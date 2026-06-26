import { Link } from 'react-router-dom'

export default function Home() {
  const categories = [
    { icon: '🥬', name: 'Vegetables', color: 'from-green-50 to-emerald-50 border-green-200' },
    { icon: '🥛', name: 'Dairy', color: 'from-blue-50 to-cyan-50 border-blue-200' },
    { icon: '🍚', name: 'Grains', color: 'from-yellow-50 to-amber-50 border-yellow-200' },
    { icon: '🍖', name: 'Meat', color: 'from-red-50 to-rose-50 border-red-200' },
    { icon: '🍞', name: 'Bakery', color: 'from-orange-50 to-amber-50 border-orange-200' },
    { icon: '🍎', name: 'Fruits', color: 'from-pink-50 to-rose-50 border-pink-200' },
  ]

  return (
    <div className="bg-pattern min-h-screen">
      {/* Hero Section */}
      <div className="relative text-white overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('/homelogo.png')"}}></div>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 via-green-800/70 to-emerald-900/80"></div>

        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full floating"></div>
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-white/5 rounded-full floating" style={{animationDelay: '2s'}}></div>

        <div className="max-w-5xl mx-auto px-6 py-20 text-center relative z-10">
          <img src="/logo.png" alt="Konara" className="h-24 mx-auto mb-6 drop-shadow-2xl floating" />
          <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">Shop Local. Save More.</h1>
          <p className="text-green-100 text-lg mb-10 max-w-xl mx-auto">
            Compare prices across nearby shops. Find the best deals on groceries, vegetables, and daily essentials.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/search" className="bg-white text-green-700 px-8 py-3.5 rounded-full font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300">
              🔍 Start Shopping
            </Link>
            <Link to="/login" className="border-2 border-white/80 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white hover:text-green-700 transition-all duration-300">
              🏪 Become a Vendor
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-center gap-8 md:gap-16">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">10+</p>
            <p className="text-xs text-gray-500">Local Shops</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">65+</p>
            <p className="text-xs text-gray-500">Products</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">5km</p>
            <p className="text-xs text-gray-500">Delivery Range</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">AI</p>
            <p className="text-xs text-gray-500">Smart Search</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">How Konara Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-7 shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4">🔍</div>
            <h3 className="font-bold text-gray-800 mb-2">Search Products</h3>
            <p className="text-sm text-gray-500">Search by item name or ask AI — "What do I need for biryani?"</p>
          </div>
          <div className="bg-white rounded-2xl p-7 shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4">💰</div>
            <h3 className="font-bold text-gray-800 mb-2">Compare Prices</h3>
            <p className="text-sm text-gray-500">See prices from multiple nearby shops, sorted by price and distance</p>
          </div>
          <div className="bg-white rounded-2xl p-7 shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4">🛒</div>
            <h3 className="font-bold text-gray-800 mb-2">Order & Pickup</h3>
            <p className="text-sm text-gray-500">Add to cart from any shop, place order, and pick up when ready</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Shop by Category</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <Link to="/search" key={i}
              className={`bg-gradient-to-br ${cat.color} border rounded-2xl p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
              <div className="text-4xl mb-2">{cat.icon}</div>
              <p className="text-xs font-semibold text-gray-700">{cat.name}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-8 text-center">
        <p className="text-sm">© 2026 Konara. Shop Local. Save More. Live Better.</p>
      </div>
    </div>
  )
}
