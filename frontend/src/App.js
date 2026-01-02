import { useState, useEffect, useCallback } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

// Template field configurations
const TEMPLATE_FIELDS = {
  apple: {
    name: "Apple",
    fields: ["recipient_email", "address1", "address2", "address3", "delivery_date", "order_number", "item_name", "price", "total", "product_image", "quantity", "shipping"]
  },
  balenciaga: {
    name: "Balenciaga",
    fields: ["recipient_email", "first_name", "address1", "address2", "address3", "order_number", "item_name", "price", "total", "product_image", "color", "shipping"]
  },
  bape: {
    name: "BAPE",
    fields: ["recipient_email", "address1", "address2", "address3", "order_number", "item_name", "size", "price", "total", "card_last4", "currency", "product_image", "shipping"]
  },
  dior: {
    name: "Dior",
    fields: ["recipient_email", "full_name", "order_number", "item_name", "price", "product_image", "shipping"]
  },
  nike: {
    name: "Nike",
    fields: ["recipient_email", "full_name", "first_name", "address1", "address2", "address3", "delivery_date", "order_number", "item_name", "size", "price", "total", "card_last4", "currency", "product_image"]
  },
  stockx_new: {
    name: "StockX",
    fields: ["recipient_email", "delivery_date", "order_number", "item_name", "size", "price", "total", "product_image", "shipping", "style_id"]
  },
  stussy: {
    name: "Stussy",
    fields: ["recipient_email", "address1", "address2", "address3", "order_number", "item_name", "size", "price", "total", "product_image", "quantity", "shipping"]
  },
  supreme: {
    name: "Supreme",
    fields: ["recipient_email", "delivery_date", "order_number", "item_name", "size", "price", "total", "currency"]
  },
  trapstar: {
    name: "Trapstar",
    fields: ["recipient_email", "order_number", "item_name", "size", "product_image"]
  },
  zalando: {
    name: "Zalando",
    fields: ["recipient_email", "full_name", "address1", "address2", "delivery_date", "order_number", "item_name", "size", "price", "total", "product_image", "quantity", "color"]
  }
};

// Field labels and placeholders
const FIELD_CONFIG = {
  recipient_email: { label: "EMAIL ODBIORCY *", placeholder: "klient@example.com", type: "email", required: true },
  full_name: { label: "IMIĘ I NAZWISKO *", placeholder: "Jan Kowalski", type: "text", required: true },
  first_name: { label: "IMIĘ", placeholder: "Jan", type: "text" },
  address1: { label: "ADRES 1", placeholder: "ul. Przykładowa 123", type: "text" },
  address2: { label: "ADRES 2 (MIASTO)", placeholder: "00-000 Warszawa", type: "text" },
  address3: { label: "ADRES 3 (KRAJ)", placeholder: "Polska", type: "text" },
  delivery_date: { label: "DATA DOSTAWY", placeholder: "January 15, 2026", type: "text" },
  order_number: { label: "NUMER ZAMÓWIENIA *", placeholder: "NK-2026-12345", type: "text", required: true },
  item_name: { label: "NAZWA PRODUKTU", placeholder: "Nike Air Max 90", type: "text" },
  size: { label: "ROZMIAR", placeholder: "42 EU / 8.5 US", type: "text" },
  price: { label: "CENA (bez waluty)", placeholder: "180.00", type: "text" },
  total: { label: "SUMA (bez waluty)", placeholder: "190.46", type: "text" },
  card_last4: { label: "OSTATNIE 4 CYFRY KARTY", placeholder: "1234", type: "text", maxLength: 4 },
  currency: { label: "WALUTA", placeholder: "$", type: "select", options: ["$", "€", "£", "zł"] },
  product_image: { label: "🖼️ LINK DO ZDJĘCIA", placeholder: "https://example.com/image.png", type: "url" },
  quantity: { label: "ILOŚĆ", placeholder: "1", type: "number" },
  tracking_number: { label: "NUMER ŚLEDZENIA", placeholder: "1Z999AA10123456784", type: "text" },
  phone: { label: "TELEFON", placeholder: "+48 123 456 789", type: "text" },
  subject: { label: "TEMAT EMAILA", placeholder: "Your Order Confirmation", type: "text" },
  shipping: { label: "DOSTAWA", placeholder: "Free Shipping", type: "text" },
  color: { label: "KOLOR", placeholder: "Black/White", type: "text" },
  style_id: { label: "STYLE ID", placeholder: "DZ5485-612", type: "text" }
};

// ==================== LANDING PAGE ====================
function LandingPage({ onAccessSystem }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      
      <nav className="relative flex justify-between items-center px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
            <span className="text-xl">⚡</span>
          </div>
          <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            DOCGEN
          </span>
        </div>
        <button
          onClick={onAccessSystem}
          className="px-6 py-2 border border-cyan-500/50 text-cyan-400 font-bold tracking-wider hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 rounded"
        >
          ZALOGUJ SIĘ
        </button>
      </nav>

      <div className="relative flex flex-col items-center justify-center px-4 pt-20 pb-16">
        <div className="mb-8 px-6 py-2 border border-purple-500/50 rounded-full bg-purple-500/10 backdrop-blur-sm">
          <span className="text-purple-400 text-sm tracking-widest">⚡ SECURE DOCUMENT GENERATOR V2.0</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-center mb-4 tracking-tight text-white">GENERATE SECURE</h1>
        <h2 className="text-5xl md:text-7xl font-black text-center mb-4 tracking-tight bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">DOCUMENTS</h2>
        <h2 className="text-5xl md:text-7xl font-black text-center mb-8 tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">INSTANTLY</h2>

        <p className="text-gray-400 text-center mb-2 tracking-wide max-w-lg">Create encrypted confirmations, invoices and secure documents.</p>
        <p className="text-gray-500 text-center mb-12 tracking-wide">Automated email delivery via secure SMTP protocol.</p>

        <button
          onClick={onAccessSystem}
          className="group relative px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold tracking-widest rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]"
        >
          <span className="relative z-10">[ ACCESS SYSTEM ]</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        <div className="flex gap-16 mt-20">
          <div className="text-center group">
            <div className="text-4xl font-bold bg-gradient-to-b from-cyan-400 to-cyan-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">15</div>
            <div className="text-xs text-gray-500 tracking-widest">SZABLONÓW</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl font-bold bg-gradient-to-b from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">∞</div>
            <div className="text-xs text-gray-500 tracking-widest">DOCUMENTS</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🔒</div>
            <div className="text-xs text-gray-500 tracking-widest">ENCRYPTED</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== LOGIN PAGE ====================
function LoginPage({ onLoginSuccess, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const response = await axios.post(`${API}/auth/login`, { email, password });
        if (response.data.access_token) {
          localStorage.setItem("token", response.data.access_token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          onLoginSuccess(response.data.user);
        }
      } else {
        setError("Rejestracja nie jest jeszcze dostępna.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Błąd logowania.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20"></div>
      
      <nav className="relative flex justify-between items-center px-8 py-6">
        <button onClick={onBack} className="flex items-center gap-3 hover:opacity-80 transition-all">
          <span className="text-cyan-400">←</span>
          <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">DOCGEN</span>
        </button>
      </nav>

      <div className="relative flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              {isLogin ? "LOGOWANIE" : "REJESTRACJA"}
            </h1>
          </div>

          <div className="flex mb-8 bg-gray-900/50 rounded-lg p-1 backdrop-blur-sm border border-gray-800">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 font-bold tracking-wider rounded-md transition-all ${isLogin ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30" : "text-gray-500"}`}>
              ZALOGUJ SIĘ
            </button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 font-bold tracking-wider rounded-md transition-all ${!isLogin ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30" : "text-gray-500"}`}>
              ZAREJESTRUJ
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-xs text-gray-500 mb-2 tracking-widest">NAZWA UŻYTKOWNIKA</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Jan Kowalski"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none" required={!isLogin} />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-widest">EMAIL</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="twoj@email.com"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-widest">HASŁO</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none" required />
            </div>
            {error && <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 text-sm rounded-lg">⚠️ {error}</div>}
            <button type="submit" disabled={loading}
              className={`w-full py-4 font-bold tracking-widest rounded-lg transition-all ${loading ? "bg-gray-700 text-gray-500" : "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]"}`}>
              {loading ? "⏳ ŁADOWANIE..." : isLogin ? "🔐 ZALOGUJ SIĘ" : "✨ UTWÓRZ KONTO"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==================== DYNAMIC FORM FIELD ====================
function FormField({ fieldKey, value, onChange }) {
  const config = FIELD_CONFIG[fieldKey];
  if (!config) return null;

  if (config.type === "select") {
    return (
      <div>
        <label className="block text-xs text-gray-500 mb-2 tracking-widest">{config.label}</label>
        <select name={fieldKey} value={value} onChange={onChange}
          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none">
          {config.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-2 tracking-widest">{config.label}</label>
      <input
        type={config.type || "text"}
        name={fieldKey}
        value={value}
        onChange={onChange}
        placeholder={config.placeholder}
        required={config.required}
        maxLength={config.maxLength}
        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
      />
    </div>
  );
}

// ==================== DASHBOARD ====================
function Dashboard({ user, onLogout }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [formData, setFormData] = useState({
    recipient_email: "", full_name: "", first_name: "", address1: "", address2: "", address3: "",
    delivery_date: "", order_number: "", item_name: "", size: "", price: "", total: "",
    card_last4: "", currency: "$", subject: "", product_image: "", quantity: "1",
    tracking_number: "", phone: "", shipping: "Free Shipping", color: ""
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data.templates || []);
      if (response.data.templates?.length > 0) {
        setSelectedTemplate(response.data.templates[0]);
      }
    } catch (error) {
      setMessage("❌ Nie można pobrać szablonów");
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API}/generate-document`,
        { template: selectedTemplate, ...formData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage(`✅ ${response.data.message}`);
        // Reset only non-essential fields
        setFormData(prev => ({
          ...prev,
          order_number: "", item_name: "", size: "", price: "", total: "",
          product_image: "", quantity: "1", tracking_number: ""
        }));
      }
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get fields for current template
  const currentTemplateConfig = TEMPLATE_FIELDS[selectedTemplate] || { fields: Object.keys(FIELD_CONFIG) };
  const activeFields = currentTemplateConfig.fields;

  if (showAdminPanel) {
    return <AdminPanel user={user} onBack={() => setShowAdminPanel(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 pointer-events-none"></div>
      
      <nav className="relative flex justify-between items-center px-8 py-4 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
            <span className="text-sm">⚡</span>
          </div>
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">DOCGEN</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">👤 <span className="text-cyan-400">{user.email}</span></span>
          {user.role === "admin" && (
            <button onClick={() => setShowAdminPanel(true)} className="px-4 py-2 border border-purple-500/50 text-purple-400 text-sm rounded hover:bg-purple-500/10">🔧 ADMIN</button>
          )}
          <button onClick={onLogout} className="px-4 py-2 border border-red-500/50 text-red-400 text-sm rounded hover:bg-red-500/10">🚪 WYLOGUJ</button>
        </div>
      </nav>

      <div className="relative max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wider mb-2">
            GENERATOR <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">DOKUMENTÓW</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-purple-400 mb-4 tracking-wider">🎨 WYBIERZ SZABLON</h3>
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none text-lg" required>
              {templates.map((template) => (
                <option key={template} value={template}>
                  {TEMPLATE_FIELDS[template]?.name || template.toUpperCase().replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-2">Wybierz szablon - formularz pokaże tylko wymagane pola</p>
          </div>

          {/* Dynamic Fields */}
          <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 tracking-wider">
              📝 DANE DLA: {TEMPLATE_FIELDS[selectedTemplate]?.name || selectedTemplate.toUpperCase()}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeFields.map(fieldKey => (
                <FormField key={fieldKey} fieldKey={fieldKey} value={formData[fieldKey]} onChange={handleInputChange} />
              ))}
            </div>
          </div>

          {/* Optional: Email Subject */}
          <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-green-400 mb-4 tracking-wider">📧 OPCJONALNIE</h3>
            <FormField fieldKey="subject" value={formData.subject} onChange={handleInputChange} />
          </div>

          {message && (
            <div className={`p-4 rounded-lg border ${message.includes('✅') ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-red-500/50 bg-red-500/10 text-red-400'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading}
            className={`w-full py-5 font-bold tracking-widest text-lg rounded-xl transition-all ${
              loading ? 'bg-gray-700 text-gray-500' : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:scale-[1.02]'
            }`}>
            {loading ? '⏳ WYSYŁANIE...' : '📧 WYGENERUJ I WYŚLIJ'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== ADMIN PANEL ====================
function AdminPanel({ user, onBack }) {
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", username: "", role: "user" });

  const getAuthHeaders = useCallback(() => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }), []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, getAuthHeaders());
      setUsers(response.data.users || []);
    } catch (error) {
      setMessage("❌ Błąd");
    }
  }, [getAuthHeaders]);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/documents`, getAuthHeaders());
      setDocuments(response.data.documents || []);
    } catch (error) { console.error(error); }
  }, [getAuthHeaders]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`, getAuthHeaders());
      setStats(response.data);
    } catch (error) { console.error(error); }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "documents") fetchDocuments();
    if (activeTab === "stats") fetchStats();
  }, [activeTab, fetchUsers, fetchDocuments, fetchStats]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/admin/users`, newUser, getAuthHeaders());
      setMessage("✅ Dodano");
      setShowAddUser(false);
      setNewUser({ email: "", password: "", username: "", role: "user" });
      fetchUsers();
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.detail || "Błąd"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Usunąć?")) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, getAuthHeaders());
      fetchUsers();
    } catch (error) { setMessage("❌ Błąd"); }
  };

  const handleToggleUser = async (userId, currentStatus) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/toggle`, { is_active: !currentStatus }, getAuthHeaders());
      fetchUsers();
    } catch (error) { setMessage("❌ Błąd"); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono">
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <span className="text-2xl font-bold text-purple-400">🔧 ADMIN</span>
        <button onClick={onBack} className="px-4 py-2 border border-gray-600 text-gray-400 rounded">← POWRÓT</button>
      </nav>

      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex gap-2 mb-8 bg-gray-900/50 p-2 rounded-xl border border-gray-800">
          {["users", "documents", "stats"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 font-bold rounded-lg transition-all ${activeTab === tab ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-gray-500"}`}>
              {tab === "users" ? "👥 USERS" : tab === "documents" ? "📄 DOCS" : "📊 STATS"}
            </button>
          ))}
        </div>

        {message && <div className={`mb-6 p-4 rounded-lg border ${message.includes('✅') ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-red-500/50 bg-red-500/10 text-red-400'}`}>{message}</div>}

        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
          {activeTab === "users" && (
            <div>
              <div className="flex justify-between mb-6">
                <h2 className="text-xl font-bold">UŻYTKOWNICY ({users.length})</h2>
                <button onClick={() => setShowAddUser(!showAddUser)} className="px-4 py-2 border border-cyan-500 text-cyan-400 rounded">
                  {showAddUser ? "❌" : "➕"}
                </button>
              </div>
              {showAddUser && (
                <form onSubmit={handleAddUser} className="mb-6 p-4 bg-gray-900/50 rounded-lg grid grid-cols-4 gap-4">
                  <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white" required />
                  <input type="text" placeholder="Nazwa" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                  <input type="password" placeholder="Hasło" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white" required />
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-cyan-500 text-white rounded font-bold">{loading ? "..." : "DODAJ"}</button>
                </form>
              )}
              <table className="w-full text-sm">
                <thead className="border-b border-gray-700"><tr className="text-gray-500 text-xs"><th className="px-4 py-3 text-left">EMAIL</th><th className="px-4 py-3 text-left">ROLA</th><th className="px-4 py-3 text-left">STATUS</th><th className="px-4 py-3 text-left">AKCJE</th></tr></thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{u.role}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{u.is_active ? '✅' : '🔒'}</span></td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleUser(u.id, u.is_active)} disabled={u.id === user.id} className="mr-2 px-2 py-1 text-xs border border-yellow-500 text-yellow-400 rounded disabled:opacity-30">{u.is_active ? '🔒' : '✅'}</button>
                        <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === user.id} className="px-2 py-1 text-xs border border-red-500 text-red-400 rounded disabled:opacity-30">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "documents" && (
            <div>
              <h2 className="text-xl font-bold mb-6">DOKUMENTY ({documents.length})</h2>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-700"><tr className="text-gray-500 text-xs"><th className="px-4 py-3 text-left">SZABLON</th><th className="px-4 py-3 text-left">EMAIL</th><th className="px-4 py-3 text-left">DATA</th><th className="px-4 py-3 text-left">STATUS</th></tr></thead>
                <tbody className="divide-y divide-gray-800">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-cyan-400 font-bold">{doc.template}</td>
                      <td className="px-4 py-3">{doc.recipient_email}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(doc.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${doc.email_sent ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{doc.email_sent ? '✅' : '❌'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "stats" && stats && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-cyan-500/10 border border-cyan-500/30 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">👥 UŻYTKOWNICY</h3>
                <div className="text-4xl font-bold">{stats.users?.total || 0}</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-purple-400 mb-2">📄 DOKUMENTY</h3>
                <div className="text-4xl font-bold">{stats.documents?.total || 0}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
const getInitialUser = () => {
  const token = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  if (token && savedUser) {
    try { return JSON.parse(savedUser); } 
    catch { localStorage.removeItem("token"); localStorage.removeItem("user"); return null; }
  }
  return null;
};

function App() {
  const [user, setUser] = useState(getInitialUser);
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = (userData) => { setUser(userData); setShowLogin(false); };
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); setShowLogin(false); };

  if (user) return <Dashboard user={user} onLogout={handleLogout} />;
  if (showLogin) return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setShowLogin(false)} />;
  return <LandingPage onAccessSystem={() => setShowLogin(true)} />;
}

export default App;
