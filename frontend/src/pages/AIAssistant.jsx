import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('cart-builder')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  // Cart Builder
  const [cartMessage, setCartMessage] = useState('')

  // Occasion List
  const [occasion, setOccasion] = useState('')
  const [people, setPeople] = useState(4)

  // Dietary Filter
  const [diet, setDiet] = useState('')

  // Basket Compare
  const [basketItems, setBasketItems] = useState('')

  // Substitution
  const [subItem, setSubItem] = useState('')

  const callAI = async (endpoint, body) => {
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post(endpoint, body)
      setResult(data)
    } catch (err) {
      setResult({ error: err.response?.data?.detail || 'AI request failed' })
    } finally {
      setLoading(false)
    }
  }

  const addAllToCart = (items) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    items.forEach(item => {
      const existing = cart.find(c => c.id === item.id)
      if (existing) existing.qty += (item.qty || 1)
      else cart.push({ ...item, qty: item.qty || 1 })
    })
    localStorage.setItem('cart', JSON.stringify(cart))
    alert(`Added ${items.length} items to cart!`)
  }

  const tabs = [
    { id: 'cart-builder', label: '🛒 Cart Builder', desc: 'Tell AI what you need' },
    { id: 'occasion', label: '🎉 Occasion List', desc: 'Festival shopping' },
    { id: 'dietary', label: '🥗 Dietary Filter', desc: 'Health-aware shopping' },
    { id: 'compare', label: '💰 Price Compare', desc: 'Cheapest basket' },
    { id: 'substitute', label: '🔄 Substitutions', desc: 'Out of stock alternatives' },
    { id: 'recommend', label: '✨ Recommendations', desc: 'Smart suggestions' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 bg-pattern min-h-[calc(100vh-64px)]">
      <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-green-700 mb-4 flex items-center gap-1 text-sm">← Back</button>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 AI Shopping Assistant</h1>
        <p className="text-gray-500">Powered by Gemini AI — Tell me what you need, I'll find it for you</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResult(null) }}
            className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-600 border hover:bg-green-50 hover:border-green-200'
            }`}>
            <span className="block">{tab.label}</span>
            <span className="block text-xs opacity-70 mt-0.5">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-md border p-6 mb-6">
        {activeTab === 'cart-builder' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-2">🛒 What do you want to cook or buy?</h3>
            <p className="text-sm text-gray-500 mb-4">Example: "I want to make chai for 10 people" or "biryani ingredients for 5"</p>
            <div className="flex gap-2">
              <input type="text" value={cartMessage} onChange={e => setCartMessage(e.target.value)}
                placeholder="Tell me what you need..." className="flex-1 border rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <button onClick={() => callAI('/api/ai/cart-builder', { message: cartMessage })}
                disabled={loading || !cartMessage} className="bg-green-600 text-white px-6 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50">
                {loading ? '🤔...' : 'Ask AI'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'occasion' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-2">🎉 What's the occasion?</h3>
            <p className="text-sm text-gray-500 mb-4">Example: "Eid dinner", "Diwali sweets party", "Birthday celebration"</p>
            <div className="flex gap-2">
              <input type="text" value={occasion} onChange={e => setOccasion(e.target.value)}
                placeholder="Occasion name..." className="flex-1 border rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <input type="number" value={people} onChange={e => setPeople(e.target.value)}
                className="w-24 border rounded-xl p-3 text-center" min="1" />
              <button onClick={() => callAI('/api/ai/occasion-list', { occasion, people: parseInt(people) })}
                disabled={loading || !occasion} className="bg-green-600 text-white px-6 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50">
                {loading ? '🤔...' : 'Generate'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dietary' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-2">🥗 What's your dietary need?</h3>
            <p className="text-sm text-gray-500 mb-4">Example: "diabetic", "vegan", "high protein low carb", "gluten free"</p>
            <div className="flex gap-2">
              <input type="text" value={diet} onChange={e => setDiet(e.target.value)}
                placeholder="Dietary requirement..." className="flex-1 border rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <button onClick={() => callAI('/api/ai/dietary-filter', { diet })}
                disabled={loading || !diet} className="bg-green-600 text-white px-6 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50">
                {loading ? '🤔...' : 'Filter'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-2">💰 Find the cheapest basket</h3>
            <p className="text-sm text-gray-500 mb-4">Enter items separated by commas: "milk, rice, oil, eggs"</p>
            <div className="flex gap-2">
              <input type="text" value={basketItems} onChange={e => setBasketItems(e.target.value)}
                placeholder="milk, rice, oil, eggs..." className="flex-1 border rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <button onClick={() => callAI('/api/ai/compare-basket', { items: basketItems.split(',').map(i => i.trim()) })}
                disabled={loading || !basketItems} className="bg-green-600 text-white px-6 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50">
                {loading ? '🤔...' : 'Compare'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'substitute' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-2">🔄 Find alternatives</h3>
            <p className="text-sm text-gray-500 mb-4">Enter an item that's out of stock or you want alternatives for</p>
            <div className="flex gap-2">
              <input type="text" value={subItem} onChange={e => setSubItem(e.target.value)}
                placeholder="Product name..." className="flex-1 border rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <button onClick={() => callAI('/api/ai/substitution', { item: subItem })}
                disabled={loading || !subItem} className="bg-green-600 text-white px-6 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50">
                {loading ? '🤔...' : 'Find'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'recommend' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-2">✨ Smart Recommendations</h3>
            <p className="text-sm text-gray-500 mb-4">Based on your cart and order history, AI suggests what you might need</p>
            <button onClick={() => {
              const cart = JSON.parse(localStorage.getItem('cart') || '[]')
              callAI('/api/ai/recommendations', { cart })
            }} disabled={loading} className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50">
              {loading ? '🤔 Analyzing...' : '✨ Get Recommendations'}
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3 floating">🤖</div>
          <p className="text-gray-500">AI is thinking...</p>
        </div>
      )}

      {/* Results Section */}
      {result && !loading && (
        <div className="bg-white rounded-2xl shadow-md border p-6">
          {result.error && <p className="text-red-500">{result.error}</p>}

          {/* Cart Builder Results */}
          {activeTab === 'cart-builder' && result.items && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">🧠 {result.understanding}</h3>
                  {result.suggestion && <p className="text-sm text-green-600 mt-1">💡 {result.suggestion}</p>}
                </div>
                <button onClick={() => addAllToCart(result.items)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                  🛒 Add All to Cart
                </button>
              </div>
              <div className="space-y-2">
                {result.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-green-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-gray-800">{item.name} × {item.qty}</p>
                      <p className="text-xs text-gray-500">{item.vendor_name} — {item.reason}</p>
                    </div>
                    <p className="font-bold text-green-700">₹{item.price * item.qty}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t flex justify-between font-bold text-lg">
                <span>Estimated Total</span>
                <span className="text-green-700">₹{result.total_estimated}</span>
              </div>
            </div>
          )}

          {/* Occasion List Results */}
          {activeTab === 'occasion' && result.categories && (
            <div>
              <h3 className="font-bold text-gray-800 mb-4">🎉 Shopping list for: {result.occasion} ({result.people} people)</h3>
              {result.categories.map((cat, i) => (
                <div key={i} className="mb-4">
                  <h4 className="font-semibold text-green-700 mb-2">{cat.category_name}</h4>
                  <div className="space-y-1">
                    {cat.items.map((item, j) => (
                      <div key={j} className="flex justify-between bg-gray-50 rounded-lg p-2 px-3">
                        <span className="text-sm">{item.name} × {item.qty}</span>
                        <span className="text-xs text-gray-400">{item.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {result.tips && result.tips.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium text-yellow-800">💡 Tips:</p>
                  {result.tips.map((tip, i) => <p key={i} className="text-sm text-yellow-700">{tip}</p>)}
                </div>
              )}
              {result.missing_items && result.missing_items.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 mt-3">
                  <p className="text-sm text-red-600">⚠️ Not available nearby: {result.missing_items.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Dietary Filter Results */}
          {activeTab === 'dietary' && result.safe_products && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">🥗 Diet: {result.diet}</h3>
              {result.advice && <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-4">💡 {result.advice}</p>}
              {result.meal_suggestion && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-4">🍽️ Meal idea: {result.meal_suggestion}</p>}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ Safe ({result.safe_products.length})</h4>
                  <div className="space-y-1">{result.safe_products.map((p, i) => <div key={i} className="text-sm bg-green-50 rounded p-1.5 px-2">{p}</div>)}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-700 mb-2">⚠️ Moderate ({(result.moderate_products || []).length})</h4>
                  <div className="space-y-1">{(result.moderate_products || []).map((p, i) => <div key={i} className="text-sm bg-yellow-50 rounded p-1.5 px-2">{p}</div>)}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">❌ Avoid ({(result.avoid_products || []).length})</h4>
                  <div className="space-y-1">{(result.avoid_products || []).map((p, i) => <div key={i} className="text-sm bg-red-50 rounded p-1.5 px-2">{p}</div>)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Basket Compare Results */}
          {activeTab === 'compare' && result.optimized_basket && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">💰 Cheapest Combination</h3>
              {result.savings_tip && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-4">💡 {result.savings_tip}</p>}
              <div className="space-y-2">
                {result.optimized_basket.map((item, i) => (
                  <div key={i} className="flex justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium">{item.item}</p>
                      <p className="text-xs text-gray-500">from {item.vendor}</p>
                    </div>
                    <p className="font-bold text-green-700">₹{item.price}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t flex justify-between font-bold text-lg">
                <span>Best Total</span>
                <span className="text-green-700">₹{result.total_cost}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Vendors needed: {(result.vendors_needed || []).join(', ')}</p>
            </div>
          )}

          {/* Substitution Results */}
          {activeTab === 'substitute' && result.substitutes && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">🔄 Alternatives for: {result.original}</h3>
              {result.tip && <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-4">💡 {result.tip}</p>}
              <div className="space-y-3">
                {result.substitutes.map((sub, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{sub.name}</p>
                      <p className="text-sm text-gray-500">{sub.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-1">
                        {[...Array(Math.round(sub.match_score / 2))].map((_, j) => <span key={j} className="text-yellow-500">★</span>)}
                      </div>
                      <p className="text-xs text-gray-400">{sub.match_score}/10 match</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Results */}
          {activeTab === 'recommend' && result.recommendations && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">✨ Recommended for You</h3>
              {result.insight && <p className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg mb-4">🧠 {result.insight}</p>}
              <div className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium">{rec.name}</p>
                      <p className="text-xs text-gray-500">{rec.vendor_name} — {rec.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">₹{rec.price}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'
                      }`}>{rec.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
