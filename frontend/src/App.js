import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ==================== AUTH CONTEXT ====================
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (e) {
      console.error('Auth error:', e);
    }
    setLoading(false);
  };

  const login = (accessToken, userData) => {
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== COMPONENTS ====================

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`} data-testid="toast">
      {toast.type === 'success' ? '✅' : '❌'} {toast.message}
    </div>
  );
};

const Loader = () => (
  <div className="page-loader">
    <div className="loader"></div>
    <p>Ładowanie...</p>
  </div>
);

// ==================== AUTH FORMS ====================

const AuthPage = ({ onSuccess, showToast }) => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        login(data.access_token, data.user);
        showToast(mode === 'login' ? 'Zalogowano pomyślnie!' : 'Konto utworzone!', 'success');
        onSuccess();
      } else {
        showToast(data.detail || 'Błąd', 'error');
      }
    } catch (e) {
      showToast('Błąd połączenia', 'error');
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // For now, show message - Google OAuth requires setup
    showToast('Google login wymaga konfiguracji OAuth w panelu Google Cloud', 'error');
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <div className="auth-header">
          <h2>{mode === 'login' ? '🔐 Logowanie' : '📝 Rejestracja'}</h2>
          <p>{mode === 'login' ? 'Zaloguj się do swojego konta' : 'Utwórz nowe konto'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="input-label">Imię</label>
              <input
                type="text"
                className="input-field"
                placeholder="Jan Kowalski"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label className="input-label">Email *</label>
            <input
              type="email"
              className="input-field"
              placeholder="jan@example.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Hasło *</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? <span className="loader-small"></span> : (mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się')}
          </button>
        </form>

        <div className="auth-divider">
          <span>lub</span>
        </div>

        <button className="btn-google" onClick={handleGoogleLogin}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Kontynuuj z Google
        </button>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>Nie masz konta? <button onClick={() => setMode('register')}>Zarejestruj się</button></p>
          ) : (
            <p>Masz już konto? <button onClick={() => setMode('login')}>Zaloguj się</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== ADMIN PANEL ====================

const AdminPanel = ({ showToast }) => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [grantModal, setGrantModal] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (usersRes.ok) setUsers((await usersRes.json()).users);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      showToast('Błąd ładowania danych', 'error');
    }
    setLoading(false);
  };

  const grantAccess = async (userId, type, days = 30) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/grant-access`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, subscription_type: type, days })
      });
      
      if (res.ok) {
        showToast('Dostęp nadany!', 'success');
        fetchData();
        setGrantModal(null);
      } else {
        showToast('Błąd', 'error');
      }
    } catch (e) {
      showToast('Błąd połączenia', 'error');
    }
  };

  const revokeAccess = async (userId) => {
    if (!window.confirm('Czy na pewno chcesz odebrać dostęp?')) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/revoke-access/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        showToast('Dostęp odebrany', 'success');
        fetchData();
      }
    } catch (e) {
      showToast('Błąd', 'error');
    }
  };

  const toggleUserActive = async (userId, isActive) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });
      
      if (res.ok) {
        showToast(isActive ? 'Użytkownik zablokowany' : 'Użytkownik odblokowany', 'success');
        fetchData();
      }
    } catch (e) {
      showToast('Błąd', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-panel">
      <h2 className="admin-title">🛠️ Panel Administratora</h2>

      {/* Stats */}
      {stats && (
        <div className="admin-stats">
          <div className="stat-card glass">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total_users}</div>
              <div className="stat-label">Użytkowników</div>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.active_subscriptions}</div>
              <div className="stat-label">Aktywnych subskrypcji</div>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon">📄</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total_documents}</div>
              <div className="stat-label">Dokumentów</div>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="admin-section glass">
        <h3>👥 Użytkownicy</h3>
        <div className="users-table">
          <div className="table-header">
            <span>Email</span>
            <span>Subskrypcja</span>
            <span>Dni</span>
            <span>Dokumenty</span>
            <span>Status</span>
            <span>Akcje</span>
          </div>
          {users.map(user => (
            <div key={user.id} className={`table-row ${!user.is_active ? 'inactive' : ''}`}>
              <span className="user-email">
                {user.email}
                {user.role === 'admin' && <span className="admin-badge">ADMIN</span>}
              </span>
              <span className={`sub-badge sub-${user.subscription_type}`}>
                {user.subscription_type === 'lifetime' ? '♾️ Lifetime' : 
                 user.subscription_type === 'monthly' ? '📅 30 dni' : '❌ Brak'}
              </span>
              <span>{user.days_remaining === -1 ? '∞' : user.days_remaining}</span>
              <span>{user.documents_generated}</span>
              <span className={`status-badge ${user.has_access ? 'active' : 'no-access'}`}>
                {user.has_access ? '✅ Aktywny' : '⛔ Brak dostępu'}
              </span>
              <span className="actions">
                <button 
                  className="btn-small btn-grant"
                  onClick={() => setGrantModal(user)}
                  title="Nadaj dostęp"
                >
                  🎁
                </button>
                {user.has_access && user.role !== 'admin' && (
                  <button 
                    className="btn-small btn-revoke"
                    onClick={() => revokeAccess(user.id)}
                    title="Odbierz dostęp"
                  >
                    🚫
                  </button>
                )}
                {user.role !== 'admin' && (
                  <button 
                    className="btn-small btn-toggle"
                    onClick={() => toggleUserActive(user.id, user.is_active)}
                    title={user.is_active ? 'Zablokuj' : 'Odblokuj'}
                  >
                    {user.is_active ? '🔒' : '🔓'}
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grant Access Modal */}
      {grantModal && (
        <div className="modal-overlay" onClick={() => setGrantModal(null)}>
          <div className="modal glass" onClick={e => e.stopPropagation()}>
            <h3>🎁 Nadaj dostęp</h3>
            <p>Użytkownik: <strong>{grantModal.email}</strong></p>
            
            <div className="grant-options">
              <button 
                className="grant-option"
                onClick={() => grantAccess(grantModal.id, 'monthly', 30)}
              >
                <span className="grant-icon">📅</span>
                <span className="grant-title">30 dni</span>
                <span className="grant-desc">Dostęp na miesiąc</span>
              </button>
              <button 
                className="grant-option lifetime"
                onClick={() => grantAccess(grantModal.id, 'lifetime')}
              >
                <span className="grant-icon">♾️</span>
                <span className="grant-title">Lifetime</span>
                <span className="grant-desc">Dostęp na zawsze</span>
              </button>
            </div>

            <button className="btn-secondary btn-full" onClick={() => setGrantModal(null)}>
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== GENERATOR ====================

const Generator = ({ showToast }) => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    order_number: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    additional_info: '',
    template: 'receipt'
  });
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [errors, setErrors] = useState({});
  const previewRef = useRef(null);

  const templates = [
    { id: 'receipt', name: 'Potwierdzenie zamówienia', icon: '🧾' },
    { id: 'invoice', name: 'Faktura', icon: '📄' },
    { id: 'confirmation', name: 'Potwierdzenie operacji', icon: '✅' }
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Wymagane';
    if (!formData.email.trim()) newErrors.email = 'Wymagane';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Nieprawidłowy email';
    if (!formData.order_number.trim()) newErrors.order_number = 'Wymagane';
    if (!formData.date) newErrors.date = 'Wymagane';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Podaj kwotę';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async (preview = false) => {
    if (!validateForm()) {
      showToast('Wypełnij wszystkie wymagane pola', 'error');
      return;
    }

    preview ? setPreviewLoading(true) : setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/${preview ? 'preview' : 'generate'}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setGeneratedDoc({
          html_content: data.html_content,
          document_id: data.document_id,
          email_sent: data.email_sent || false
        });
        
        if (!preview && data.email_sent) {
          showToast('Dokument wygenerowany i wysłany!', 'success');
        } else if (!preview) {
          showToast('Dokument wygenerowany (email nie wysłany)', 'error');
        }

        setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        showToast(data.detail || 'Błąd', 'error');
      }
    } catch (e) {
      showToast('Błąd połączenia', 'error');
    }

    preview ? setPreviewLoading(false) : setLoading(false);
  };

  const handleReset = () => {
    setFormData({
      name: '', email: '', order_number: '',
      date: new Date().toISOString().split('T')[0],
      amount: '', additional_info: '', template: 'receipt'
    });
    setGeneratedDoc(null);
    setErrors({});
  };

  // Check if user has access
  if (!user?.has_access) {
    return (
      <div className="no-access-card glass">
        <div className="no-access-icon">🔒</div>
        <h3>Brak aktywnej subskrypcji</h3>
        <p>Aby generować dokumenty, potrzebujesz aktywnej subskrypcji.</p>
        <p>Skontaktuj się z administratorem, aby uzyskać dostęp.</p>
        {user?.subscription_type === 'monthly' && user?.days_remaining === 0 && (
          <p className="expired-text">Twoja subskrypcja wygasła.</p>
        )}
      </div>
    );
  }

  return (
    <div className="generator-grid">
      {/* Form */}
      <div className="generator-form glass">
        <div className="form-header">
          <h3>📝 Dane dokumentu</h3>
          <div className="user-stats">
            <span className="stat-pill">
              {user.subscription_type === 'lifetime' ? '♾️ Lifetime' : `📅 ${user.days_remaining} dni`}
            </span>
            <span className="stat-pill">📄 {user.documents_generated} dok.</span>
          </div>
        </div>

        <div className="form-body">
          {/* Template selector */}
          <div className="template-selector">
            <label className="input-label">Wybierz szablon</label>
            <div className="template-options">
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`template-option ${formData.template === t.id ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, template: t.id }))}
                >
                  <span className="template-icon">{t.icon}</span>
                  <span className="template-name">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Imię / Nazwa *</label>
              <input
                type="text"
                className={`input-field ${errors.name ? 'error' : ''}`}
                placeholder="Jan Kowalski"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="input-label">Email odbiorcy *</label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'error' : ''}`}
                placeholder="jan@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Numer zamówienia *</label>
              <input
                type="text"
                className={`input-field ${errors.order_number ? 'error' : ''}`}
                placeholder="ORD-2024-001"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="input-label">Data *</label>
              <input
                type="date"
                className={`input-field ${errors.date ? 'error' : ''}`}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Kwota (PLN) *</label>
            <input
              type="number"
              className={`input-field ${errors.amount ? 'error' : ''}`}
              placeholder="199.99"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Dodatkowe informacje</label>
            <textarea
              className="input-field"
              placeholder="Opcjonalne uwagi..."
              rows="3"
              value={formData.additional_info}
              onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={() => handleGenerate(true)} disabled={previewLoading}>
              {previewLoading ? <span className="loader-small"></span> : '👁️'} Podgląd
            </button>
            <button className="btn-primary" onClick={() => handleGenerate(false)} disabled={loading}>
              {loading ? <span className="loader-small"></span> : '📨'} Generuj i wyślij
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="preview-area" ref={previewRef}>
        {generatedDoc ? (
          <div className="document-card animate-slide-up">
            <div className="document-header">
              <div className="document-title">📄 Wygenerowany dokument</div>
              <div className="document-id">ID: {generatedDoc.document_id}</div>
            </div>
            {generatedDoc.email_sent && (
              <div className="email-sent-badge">✅ Wysłano na email</div>
            )}
            <div className="document-preview">
              <iframe srcDoc={generatedDoc.html_content} title="Preview" sandbox="allow-same-origin" />
            </div>
            <div className="document-actions">
              <button className="btn-secondary" onClick={() => {
                const temp = document.createElement('div');
                temp.innerHTML = generatedDoc.html_content;
                navigator.clipboard.writeText(temp.textContent);
                showToast('Skopiowano!', 'success');
              }}>📋 Kopiuj</button>
              <button className="btn-secondary" onClick={handleReset}>🔄 Nowy</button>
            </div>
          </div>
        ) : (
          <div className="preview-placeholder glass">
            <div className="placeholder-icon animate-float">📄</div>
            <h3>Podgląd dokumentu</h3>
            <p>Wypełnij formularz i kliknij "Podgląd" lub "Generuj i wyślij"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================

function App() {
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState('home');
  const generatorRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <AuthProvider>
      <AppContent 
        toast={toast} 
        showToast={showToast} 
        page={page} 
        setPage={setPage}
        generatorRef={generatorRef}
      />
    </AuthProvider>
  );
}

const AppContent = ({ toast, showToast, page, setPage, generatorRef }) => {
  const { user, logout, loading } = useAuth();

  if (loading) return <Loader />;

  const scrollToGenerator = () => {
    if (!user) {
      setPage('auth');
    } else {
      setPage('home');
      setTimeout(() => generatorRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="app">
      {/* Background */}
      <div className="bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => setPage('home')} style={{cursor: 'pointer'}}>
            <span className="logo-icon">📄</span>
            <span className="logo-text">DocGen</span>
          </div>
          
          <div className="nav-actions">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <button className="nav-link" onClick={() => setPage('admin')}>
                    🛠️ Admin
                  </button>
                )}
                <span className="nav-user">
                  👤 {user.name || user.email.split('@')[0]}
                </span>
                <button className="btn-secondary nav-btn" onClick={logout}>
                  Wyloguj
                </button>
              </>
            ) : (
              <button className="btn-primary nav-cta" onClick={() => setPage('auth')}>
                Zaloguj się
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Pages */}
      {page === 'auth' && !user && (
        <AuthPage onSuccess={() => setPage('home')} showToast={showToast} />
      )}

      {page === 'admin' && user?.role === 'admin' && (
        <section className="admin-section-page container">
          <AdminPanel showToast={showToast} />
        </section>
      )}

      {(page === 'home' || (page === 'auth' && user)) && (
        <>
          {/* Hero */}
          <section className="hero">
            <div className="hero-container">
              <div className="hero-badge animate-slide-down">
                <span>⚡</span> SECURE DOCUMENT GENERATOR v2.0
              </div>
              <h1 className="hero-title animate-slide-up">
                Generate Secure<br/>
                <span className="gradient-text">Documents Instantly</span>
              </h1>
              <p className="hero-subtitle animate-slide-up">
                Create encrypted confirmations, invoices and secure documents.<br/>
                Automated email delivery via secure SMTP protocol.
              </p>
              <div className="hero-buttons animate-slide-up">
                <button className="btn-primary btn-large" onClick={scrollToGenerator}>
                  {user ? '[ GENERATE ]' : '[ ACCESS SYSTEM ]'}
                </button>
              </div>
              
              <div className="hero-stats animate-fade-in">
                <div className="stat-item">
                  <div className="stat-value">3</div>
                  <div className="stat-label">Templates</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-value">∞</div>
                  <div className="stat-label">Documents</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-value">🔒</div>
                  <div className="stat-label">Encrypted</div>
                </div>
              </div>
            </div>
          </section>

          {/* Generator */}
          {user && (
            <section className="generator-section container" ref={generatorRef}>
              <div className="section-header">
                <h2 className="section-title">⚡ Generator dokumentów</h2>
                <p className="section-subtitle">Wypełnij formularz i wygeneruj profesjonalny dokument</p>
              </div>
              <Generator showToast={showToast} />
            </section>
          )}

          {/* How it works */}
          <section className="how-it-works">
            <div className="container">
              <div className="section-header">
                <h2 className="section-title">🎯 Jak to działa?</h2>
              </div>
              <div className="steps-grid">
                <div className="step-card glass">
                  <div className="step-number">1</div>
                  <div className="step-icon">✍️</div>
                  <h3>Wypełnij formularz</h3>
                  <p>Wprowadź dane: imię, email, numer zamówienia, datę i kwotę.</p>
                </div>
                <div className="step-card glass">
                  <div className="step-number">2</div>
                  <div className="step-icon">⚡</div>
                  <h3>Generuj dokument</h3>
                  <p>Kliknij przycisk "Generuj i wyślij". System utworzy elegancki dokument.</p>
                </div>
                <div className="step-card glass">
                  <div className="step-number">3</div>
                  <div className="step-icon">📧</div>
                  <h3>Automatyczna wysyłka</h3>
                  <p>Dokument zostanie automatycznie wysłany na podany email.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            <div className="container">
              <div className="footer-content">
                <div className="footer-logo">
                  <span className="logo-icon">📄</span>
                  <span className="logo-text">DocGen</span>
                </div>
                <p className="footer-text">Generator profesjonalnych dokumentów z automatyczną wysyłką email.</p>
                <div className="footer-copy">© {new Date().getFullYear()} DocGen. Wszystkie prawa zastrzeżone.</div>
              </div>
            </div>
          </footer>
        </>
      )}

      <Toast toast={toast} />
    </div>
  );
};

export default App;
