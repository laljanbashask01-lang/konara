import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ phone: '', password: '', name: '', role: 'customer' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegister ? form : { phone: form.phone, password: form.password }
      const { data } = await api.post(endpoint, payload)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('name', data.name)
      navigate(data.role === 'vendor' ? '/vendor' : data.role === 'delivery' ? '/delivery' : '/search')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden p-6">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-green-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-yellow-200 rounded-full opacity-20 blur-2xl"></div>
        {/* Floating grocery icons */}
        <div className="absolute top-16 left-16 text-4xl opacity-20 floating">🥬</div>
        <div className="absolute top-32 right-24 text-3xl opacity-20 floating" style={{animationDelay:'1s'}}>🍎</div>
        <div className="absolute bottom-24 left-32 text-3xl opacity-20 floating" style={{animationDelay:'2s'}}>🥛</div>
        <div className="absolute bottom-40 right-16 text-4xl opacity-20 floating" style={{animationDelay:'3s'}}>🛒</div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-10 max-w-4xl w-full relative z-10">
        {/* Left - Illustration */}
        <div className="hidden md:flex flex-col items-center flex-1 text-center">
          <div className="text-8xl mb-4 floating">🛍️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Konara</h2>
          <p className="text-gray-500 text-sm">Smart Shopping, Better Living</p>
          <div className="flex gap-3 mt-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">🥬</div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🥛</div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🍞</div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl">🍖</div>
          </div>
        </div>

        {/* Right - Form */}
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-8 w-full max-w-sm border border-white/60">
          <div className="text-center mb-6">
            <img src="/logo.png" alt="Konara" className="h-12 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-800">{isRegister ? 'Create Account' : 'Welcome Back!'}</h2>
            <p className="text-sm text-gray-500 mt-1">{isRegister ? 'Join the Konara marketplace' : 'Sign in to continue shopping'}</p>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded-lg">{error}</p>}

          {isRegister && (
            <>
              <input type="text" placeholder="Your name" className="w-full border border-gray-200 rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <select className="w-full border border-gray-200 rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="customer">🛒 I want to shop (Customer)</option>
                <option value="vendor">🏪 I want to sell (Vendor)</option>
                <option value="delivery">🚗 I want to deliver (Agent)</option>
              </select>
            </>
          )}

          <input type="tel" placeholder="📱 Phone number" className="w-full border border-gray-200 rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
          <input type="password" placeholder="🔒 Password" className="w-full border border-gray-200 rounded-xl p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />

          <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            {isRegister ? 'Create Account' : 'Login'}
          </button>

          <p className="text-center text-sm mt-5 text-gray-500">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button type="button" className="text-green-600 font-semibold ml-1 hover:underline" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
