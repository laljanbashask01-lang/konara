import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const name = localStorage.getItem('name')
  const role = localStorage.getItem('role')
  const cartCount = JSON.parse(localStorage.getItem('cart') || '[]').length

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Konara" className="h-9" />
        </Link>

        <div className="flex items-center gap-4">
          {name ? (
            <>
              {role === 'customer' && (
                <>
                  <Link to="/search" className="text-gray-600 hover:text-green-700 text-sm font-medium">Search</Link>
                  <Link to="/ai" className="text-purple-600 hover:text-purple-700 text-sm font-medium">🤖 AI</Link>
                  <Link to="/orders" className="text-gray-600 hover:text-green-700 text-sm font-medium">Orders</Link>
                  <Link to="/cart" className="relative text-gray-600 hover:text-green-700">
                    🛒
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
              {role === 'vendor' && (
                <>
                  <Link to="/vendor" className="text-gray-600 hover:text-green-700 text-sm font-medium">Products</Link>
                  <Link to="/vendor/orders" className="text-gray-600 hover:text-green-700 text-sm font-medium">Orders</Link>
                </>
              )}
              {role === 'delivery' && (
                <Link to="/delivery" className="text-gray-600 hover:text-green-700 text-sm font-medium">🚗 Deliveries</Link>
              )}
              <span className="text-sm text-gray-500">Hi, {name}</span>
              <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
            </>
          ) : (
            <Link to="/login" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
