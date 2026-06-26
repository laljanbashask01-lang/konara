import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import VendorDashboard from './pages/VendorDashboard'
import VendorSetup from './pages/VendorSetup'
import VendorOrders from './pages/VendorOrders'
import Search from './pages/Search'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import AIAssistant from './pages/AIAssistant'
import DeliveryDashboard from './pages/DeliveryDashboard'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<Search />} />
        <Route path="/shop/:vendorId" element={<Shop />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/delivery" element={<DeliveryDashboard />} />
        <Route path="/vendor" element={<VendorDashboard />} />
        <Route path="/vendor/setup" element={<VendorSetup />} />
        <Route path="/vendor/orders" element={<VendorOrders />} />
      </Routes>
    </div>
  )
}
