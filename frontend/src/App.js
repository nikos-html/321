import { useState, useEffect, useCallback } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

// ==================== LANDING PAGE ====================
function LandingPage({ onAccessSystem }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          <span className="text-2xl font-bold tracking-wider">
            <span className="text-orange-500">DOC</span>
            <span className="text-green-400">GEN</span>
          </span>
        </div>
        <button
          onClick={onAccessSystem}
          className="px-6 py-2 border-2 border-green-500 text-green-400 font-bold tracking-wider hover:bg-green-500/10 transition-all"
        >
          ZALOGUJ SIĘ
        </button>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 pt-20 pb-16">
        {/* Badge */}
        <div className="mb-8 px-6 py-2 border border-green-500/50 rounded-sm">
          <span className="text-green-400 text-sm tracking-widest">
            ⚡ SECURE DOCUMENT GENERATOR V2.0
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-black text-center mb-4 tracking-tight">
          GENERATE SECURE
        </h1>
        <h2 className="text-5xl md:text-7xl font-black text-center mb-4 tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          DOCUMENTS
        </h2>
        <h2 className="text-5xl md:text-7xl font-black text-center mb-8 tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          INSTANTLY
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center mb-2 tracking-wide">
          Create encrypted confirmations, invoices and secure documents.
        </p>
        <p className="text-gray-500 text-center mb-12 tracking-wide">
          Automated email delivery via secure SMTP protocol.
        </p>

        {/* CTA Button */}
        <button
          onClick={onAccessSystem}
          className="px-10 py-4 border-2 border-green-500 text-green-400 font-bold tracking-widest hover:bg-green-500/10 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all"
        >
          [ ACCESS SYSTEM ]
        </button>

        {/* Stats */}
        <div className="flex gap-16 mt-20">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">15</div>
            <div className="text-xs text-gray-500 tracking-widest">SZABLONÓW</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">∞</div>
            <div className="text-xs text-gray-500 tracking-widest">DOCUMENTS</div>
          </div>
          <div className="text-center">
            <div className="text-3xl text-green-400 mb-2">🔒</div>
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
        const response = await axios.post(`${API}/auth/login`, {
          email,
          password
        });
        
        if (response.data.access_token) {
          localStorage.setItem("token", response.data.access_token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          onLoginSuccess(response.data.user);
        }
      } else {
        setError("Rejestracja nie jest jeszcze dostępna. Skontaktuj się z administratorem.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.response?.data?.detail || "Błąd logowania. Sprawdź dane.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6">
        <button onClick={onBack} className="flex items-center gap-2 hover:text-green-400 transition-all">
          <span>←</span>
          <span className="text-2xl font-bold tracking-wider">
            <span className="text-orange-500">DOC</span>
            <span className="text-green-400">GEN</span>
          </span>
        </button>
      </nav>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 tracking-wider">
              {isLogin ? "LOGOWANIE" : "REJESTRACJA"}
            </h1>
            <p className="text-gray-500 text-sm tracking-wide">
              Secure Document Generator
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mb-8 border border-gray-700">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 font-bold tracking-wider transition-all ${
                isLogin
                  ? "bg-green-500/20 text-green-400 border-b-2 border-green-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              ZALOGUJ SIĘ
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 font-bold tracking-wider transition-all ${
                !isLogin
                  ? "bg-green-500/20 text-green-400 border-b-2 border-green-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              ZAREJESTRUJ
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-xs text-gray-500 mb-2 tracking-widest">
                  NAZWA UŻYTKOWNIKA
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Jan Kowalski"
                  className="w-full px-4 py-3 bg-[#111] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none transition-all"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-widest">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
                className="w-full px-4 py-3 bg-[#111] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-widest">
                HASŁO
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#111] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none transition-all"
                required
              />
            </div>

            {error && (
              <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 font-bold tracking-widest transition-all ${
                loading
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-green-500/20 border-2 border-green-500 text-green-400 hover:bg-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              }`}
            >
              {loading ? "⏳ ŁADOWANIE..." : isLogin ? "🔐 ZALOGUJ SIĘ" : "✨ UTWÓRZ KONTO"}
            </button>
          </form>
        </div>
      </div>
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
    recipient_email: "",
    full_name: "",
    first_name: "",
    address1: "",
    address2: "",
    address3: "",
    delivery_date: "",
    order_number: "",
    item_name: "",
    price: "",
    total: "",
    card_last4: "",
    currency: "$",
    subject: ""
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data.templates || []);
      if (response.data.templates && response.data.templates.length > 0) {
        setSelectedTemplate(response.data.templates[0]);
      }
    } catch (error) {
      console.error("Błąd pobierania szablonów:", error);
      setMessage("❌ Nie można pobrać listy szablonów");
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API}/generate-document`,
        {
          template: selectedTemplate,
          ...formData
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setMessage(`✅ ${response.data.message}`);
        setFormData({
          recipient_email: "",
          full_name: "",
          first_name: "",
          address1: "",
          address2: "",
          address3: "",
          delivery_date: "",
          order_number: "",
          item_name: "",
          price: "",
          total: "",
          card_last4: "",
          currency: "$",
          subject: ""
        });
      }
    } catch (error) {
      console.error("Błąd generowania dokumentu:", error);
      setMessage(`❌ Błąd: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (showAdminPanel) {
    return <AdminPanel user={user} onBack={() => setShowAdminPanel(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          <span className="text-2xl font-bold tracking-wider">
            <span className="text-orange-500">DOC</span>
            <span className="text-green-400">GEN</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            👤 <span className="text-green-400">{user.email}</span>
          </span>
          {user.role === "admin" && (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="px-4 py-2 border border-purple-500 text-purple-400 text-sm tracking-wider hover:bg-purple-500/10 transition-all"
            >
              🔧 ADMIN
            </button>
          )}
          <button
            onClick={onLogout}
            className="px-4 py-2 border border-red-500 text-red-400 text-sm tracking-wider hover:bg-red-500/10 transition-all"
          >
            🚪 WYLOGUJ
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-wider mb-4">
            GENERATOR <span className="text-green-400">DOKUMENTÓW</span>
          </h1>
          <p className="text-gray-500">
            Dostępnych szablonów: <span className="text-cyan-400 font-bold">{templates.length}</span>
          </p>
        </div>

        {/* Form */}
        <div className="border border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Template Selection */}
            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-widest">
                🎨 WYBIERZ SZABLON
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-3 bg-[#111] border border-gray-700 text-white focus:border-green-500 focus:outline-none transition-all"
                required
              >
                {templates.map((template) => (
                  <option key={template} value={template}>
                    {template.toUpperCase().replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Data */}
            <div className="border-t border-gray-800 pt-8">
              <h3 className="text-lg font-bold text-green-400 mb-6 tracking-wider">📬 DANE ODBIORCY</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-2 tracking-widest">EMAIL *</label>
                  <input
                    type="email"
                    name="recipient_email"
                    value={formData.recipient_email}
                    onChange={handleInputChange}
                    placeholder="klient@example.com"
                    className="w-full px-4 py-3 bg-[#111] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2 tracking-widest">IMIĘ I NAZWISKO *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Jan Kowalski"
                    className="w-full px-4 py-3 bg-[#111] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="border-t border-gray-800 pt-8">
              <h3 className="text-lg font-bold text-cyan-400 mb-6 tracking-wider">🛍️ SZCZEGÓŁY ZAMÓWIENIA</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-2 tracking-widest">NUMER ZAMÓWIENIA *</label>
                  <input
                    type="text"
                    name="order_number"
                    value={formData.order_number}
                    onChange={handleInputChange}
                    placeholder="NK-2026-12345"
                    className="w-full px-4 py-3 bg-[#111] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2 tracking-widest">PRODUKT</label>
                  <input
                    type="text"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleInputChange}
                    placeholder="Nike Air Max"
                    className="w-full px-4 py-3 bg-[#111] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2 tracking-widest">CENA</label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="180.00"
                    className="w-full px-4 py-3 bg-[#111] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2 tracking-widest">SUMA</label>
                  <input
                    type="text"
                    name="total"
                    value={formData.total}
                    onChange={handleInputChange}
                    placeholder="190.46"
                    className="w-full px-4 py-3 bg-[#111] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 border ${message.includes('✅') ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-red-500/50 bg-red-500/10 text-red-400'}`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 font-bold tracking-widest text-lg transition-all ${
                loading 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-500/20 border-2 border-green-500 text-green-400 hover:bg-green-500/30 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]'
              }`}
            >
              {loading ? '⏳ WYSYŁANIE...' : '📧 WYGENERUJ I WYŚLIJ'}
            </button>
          </form>
        </div>
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
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    username: "",
    role: "user"
  });

  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  }), []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, getAuthHeaders());
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage("❌ Błąd pobierania użytkowników");
    }
  }, [getAuthHeaders]);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/documents`, getAuthHeaders());
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  }, [getAuthHeaders]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`, getAuthHeaders());
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "documents") fetchDocuments();
    if (activeTab === "stats") fetchStats();
  }, [activeTab, fetchUsers, fetchDocuments, fetchStats]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await axios.post(`${API}/admin/users`, newUser, getAuthHeaders());
      setMessage("✅ Użytkownik dodany");
      setShowAddUser(false);
      setNewUser({ email: "", password: "", username: "", role: "user" });
      fetchUsers();
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.detail || "Błąd dodawania użytkownika"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Czy na pewno chcesz usunąć tego użytkownika?")) return;

    try {
      await axios.delete(`${API}/admin/users/${userId}`, getAuthHeaders());
      setMessage("✅ Użytkownik usunięty");
      fetchUsers();
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.detail || "Błąd usuwania"}`);
    }
  };

  const handleToggleUser = async (userId, currentStatus) => {
    try {
      await axios.put(
        `${API}/admin/users/${userId}/toggle`,
        { is_active: !currentStatus },
        getAuthHeaders()
      );
      setMessage(`✅ Status użytkownika zaktualizowany`);
      fetchUsers();
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.detail || "Błąd aktualizacji"}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <span className="text-2xl">🔧</span>
          <span className="text-2xl font-bold tracking-wider text-purple-400">
            ADMIN PANEL
          </span>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-600 text-gray-400 text-sm tracking-wider hover:bg-gray-800 transition-all"
        >
          ← POWRÓT
        </button>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border border-gray-800 p-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-3 px-4 font-bold tracking-wider transition-all ${
              activeTab === "users"
                ? "bg-purple-500/20 text-purple-400 border-b-2 border-purple-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            👥 UŻYTKOWNICY
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex-1 py-3 px-4 font-bold tracking-wider transition-all ${
              activeTab === "documents"
                ? "bg-purple-500/20 text-purple-400 border-b-2 border-purple-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            📄 DOKUMENTY
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-3 px-4 font-bold tracking-wider transition-all ${
              activeTab === "stats"
                ? "bg-purple-500/20 text-purple-400 border-b-2 border-purple-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            📊 STATYSTYKI
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 border ${message.includes('✅') ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-red-500/50 bg-red-500/10 text-red-400'}`}>
            {message}
          </div>
        )}

        {/* Content */}
        <div className="border border-gray-800 p-6">
          {/* Users Tab */}
          {activeTab === "users" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold tracking-wider">UŻYTKOWNICY ({users.length})</h2>
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="px-4 py-2 border border-green-500 text-green-400 text-sm tracking-wider hover:bg-green-500/10 transition-all"
                >
                  {showAddUser ? "❌ ANULUJ" : "➕ DODAJ"}
                </button>
              </div>

              {showAddUser && (
                <form onSubmit={handleAddUser} className="mb-6 p-4 border border-gray-700 bg-[#111]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Nazwa użytkownika"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Hasło"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none"
                      required
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-white focus:border-green-500 focus:outline-none"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 px-6 py-2 bg-green-500/20 border border-green-500 text-green-400 font-bold tracking-wider hover:bg-green-500/30 transition-all"
                  >
                    {loading ? "DODAWANIE..." : "DODAJ"}
                  </button>
                </form>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-700">
                    <tr className="text-gray-500 text-xs tracking-widest">
                      <th className="px-4 py-3 text-left">EMAIL</th>
                      <th className="px-4 py-3 text-left">NAZWA</th>
                      <th className="px-4 py-3 text-left">ROLA</th>
                      <th className="px-4 py-3 text-left">STATUS</th>
                      <th className="px-4 py-3 text-left">DATA</th>
                      <th className="px-4 py-3 text-left">AKCJE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-900/50">
                        <td className="px-4 py-3 text-white">{u.email}</td>
                        <td className="px-4 py-3 text-gray-400">{u.username}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-bold tracking-wider ${
                            u.role === 'admin' ? 'text-purple-400 border border-purple-500' : 'text-cyan-400 border border-cyan-500'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-bold tracking-wider ${
                            u.is_active ? 'text-green-400 border border-green-500' : 'text-red-400 border border-red-500'
                          }`}>
                            {u.is_active ? 'AKTYWNY' : 'NIEAKTYWNY'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleUser(u.id, u.is_active)}
                            disabled={u.id === user.id}
                            className="mr-2 px-3 py-1 text-xs border border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            {u.is_active ? '🔒' : '✅'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user.id}
                            className="px-3 py-1 text-xs border border-red-500 text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div>
              <h2 className="text-xl font-bold tracking-wider mb-6">HISTORIA DOKUMENTÓW ({documents.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-700">
                    <tr className="text-gray-500 text-xs tracking-widest">
                      <th className="px-4 py-3 text-left">SZABLON</th>
                      <th className="px-4 py-3 text-left">EMAIL</th>
                      <th className="px-4 py-3 text-left">NR ZAMÓWIENIA</th>
                      <th className="px-4 py-3 text-left">DATA</th>
                      <th className="px-4 py-3 text-left">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-900/50">
                        <td className="px-4 py-3 text-green-400 font-bold">{doc.template}</td>
                        <td className="px-4 py-3 text-white">{doc.recipient_email}</td>
                        <td className="px-4 py-3 text-gray-400">{doc.order_number}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(doc.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-bold tracking-wider ${
                            doc.email_sent ? 'text-green-400 border border-green-500' : 'text-red-400 border border-red-500'
                          }`}>
                            {doc.email_sent ? '✅ WYSŁANO' : '❌ BŁĄD'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && stats && (
            <div>
              <h2 className="text-xl font-bold tracking-wider mb-6">STATYSTYKI SYSTEMU</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-cyan-500/50 bg-cyan-500/10 p-6">
                  <h3 className="text-lg font-bold text-cyan-400 mb-4 tracking-wider">👥 UŻYTKOWNICY</h3>
                  <div className="text-4xl font-bold text-white mb-2">{stats.users?.total || 0}</div>
                  <p className="text-gray-500 text-sm">Łącznie</p>
                  <div className="mt-4 pt-4 border-t border-cyan-500/30 space-y-1">
                    <p className="text-sm text-green-400">✅ Aktywni: {stats.users?.active || 0}</p>
                    <p className="text-sm text-red-400">🔒 Nieaktywni: {stats.users?.inactive || 0}</p>
                  </div>
                </div>

                <div className="border border-green-500/50 bg-green-500/10 p-6">
                  <h3 className="text-lg font-bold text-green-400 mb-4 tracking-wider">📄 DOKUMENTY</h3>
                  <div className="text-4xl font-bold text-white mb-2">{stats.documents?.total || 0}</div>
                  <p className="text-gray-500 text-sm">Łącznie</p>
                  <div className="mt-4 pt-4 border-t border-green-500/30 space-y-1">
                    <p className="text-sm text-green-400">✅ Wysłane: {stats.documents?.sent || 0}</p>
                    <p className="text-sm text-red-400">❌ Błędy: {stats.documents?.failed || 0}</p>
                  </div>
                </div>
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
    try {
      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Error parsing saved user:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
  }
  return null;
};

function App() {
  const [user, setUser] = useState(getInitialUser);
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowLogin(false);
  };

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  if (showLogin) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setShowLogin(false)} />;
  }

  return <LandingPage onAccessSystem={() => setShowLogin(true)} />;
}

export default App;
