import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function VendorSetup() {
  const [form, setForm] = useState({
    shop_name: '',
    category: 'grocery',
    latitude: '',
    longitude: '',
    delivery_radius_km: 5,
  })
  const [error, setError] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)
  const navigate = useNavigate()

  const getMyLocation = () => {
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({ ...form, latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setGettingLocation(false)
      },
      () => {
        setError('Could not get location. Enter manually.')
        setGettingLocation(false)
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/vendors/register', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        delivery_radius_km: parseFloat(form.delivery_radius_km),
      })
      navigate('/vendor')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register shop')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">🏪 Set Up Your Shop</h2>
        <p className="text-gray-500 text-sm mb-6">Register your shop to start selling</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input placeholder="Shop Name" className="w-full border rounded-lg p-3 mb-3"
          value={form.shop_name} onChange={e => setForm({...form, shop_name: e.target.value})} required />

        <select className="w-full border rounded-lg p-3 mb-3"
          value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
          <option value="grocery">Grocery</option>
          <option value="vegetables">Vegetables & Fruits</option>
          <option value="dairy">Dairy</option>
          <option value="meat">Meat & Fish</option>
          <option value="bakery">Bakery</option>
          <option value="general">General Store</option>
        </select>

        <div className="flex gap-2 mb-3">
          <input type="number" step="any" placeholder="Latitude" className="flex-1 border rounded-lg p-3"
            value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} required />
          <input type="number" step="any" placeholder="Longitude" className="flex-1 border rounded-lg p-3"
            value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} required />
        </div>

        <button type="button" onClick={getMyLocation}
          className="w-full border border-green-600 text-green-600 py-2 rounded-lg mb-3 text-sm hover:bg-green-50">
          {gettingLocation ? 'Getting location...' : '📍 Use My Current Location'}
        </button>

        <input type="number" step="0.5" placeholder="Delivery Radius (km)" className="w-full border rounded-lg p-3 mb-4"
          value={form.delivery_radius_km} onChange={e => setForm({...form, delivery_radius_km: e.target.value})} />

        <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700">
          Register Shop
        </button>
      </form>
    </div>
  )
}
