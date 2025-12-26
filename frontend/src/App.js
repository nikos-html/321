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
        showToast(mode === 'login' ? 'Access granted' : 'Account created', 'success');
        onSuccess();
      } else {
        showToast(data.detail || 'Authentication failed', 'error');
      }
    } catch (e) {
      showToast('Connection error', 'error');
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    showToast('Google OAuth requires configuration in Google Cloud Console', 'error');
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <div className="auth-header">
          <h2>{mode === 'login' ? '// LOGIN' : '// REGISTER'}</h2>
          <p>{mode === 'login' ? 'Enter your credentials' : 'Create new account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="input-label">Identifier</label>
              <input
                type="text"
                className="input-field"
                placeholder="John Doe"
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
              placeholder="user@domain.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Password *</label>
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
            {loading ? <span className="loader-small"></span> : (mode === 'login' ? '[ AUTHENTICATE ]' : '[ CREATE ACCOUNT ]')}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button className="btn-google" onClick={handleGoogleLogin}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>No account? <button onClick={() => setMode('register')}>Register</button></p>
          ) : (
            <p>Have account? <button onClick={() => setMode('login')}>Login</button></p>
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
      showToast('Connection error', 'error');
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
        showToast('Access granted successfully', 'success');
        fetchData();
        setGrantModal(null);
      } else {
        showToast('Operation failed', 'error');
      }
    } catch (e) {
      showToast('Connection error', 'error');
    }
  };

  const revokeAccess = async (userId) => {
    if (!window.confirm('Revoke access for this user?')) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/revoke-access/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        showToast('Access revoked', 'success');
        fetchData();
      }
    } catch (e) {
      showToast('Error', 'error');
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
        showToast(isActive ? 'User blocked' : 'User unblocked', 'success');
        fetchData();
      }
    } catch (e) {
      showToast('Error', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-panel">
      <h2 className="admin-title">// ADMIN CONSOLE</h2>

      {/* Stats */}
      {stats && (
        <div className="admin-stats">
          <div className="stat-card glass">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total_users}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon">✓</div>
            <div className="stat-info">
              <div className="stat-value">{stats.active_subscriptions}</div>
              <div className="stat-label">Active Access</div>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon">📄</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total_documents}</div>
              <div className="stat-label">Documents</div>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="admin-section glass">
        <h3>// USER DATABASE</h3>
        <div className="users-table">
          <div className="table-header">
            <span>Email</span>
            <span>Access</span>
            <span>Days</span>
            <span>Docs</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {users.map(user => (
            <div key={user.id} className={`table-row ${!user.is_active ? 'inactive' : ''}`}>
              <span className="user-email">
                {user.email}
                {user.role === 'admin' && <span className="admin-badge">ROOT</span>}
              </span>
              <span className={`sub-badge sub-${user.subscription_type}`}>
                {user.subscription_type === 'lifetime' ? '∞ LIFETIME' : 
                 user.subscription_type === 'monthly' ? '⏱ 30 DAYS' : '✗ NONE'}
              </span>
              <span>{user.days_remaining === -1 ? '∞' : user.days_remaining}</span>
              <span>{user.documents_generated}</span>
              <span className={`status-badge ${user.has_access ? 'active' : 'no-access'}`}>
                {user.has_access ? '● ACTIVE' : '○ DENIED'}
              </span>
              <span className="actions">
                <button 
                  className="btn-small btn-grant"
                  onClick={() => setGrantModal(user)}
                  title="Grant access"
                >
                  +
                </button>
                {user.has_access && user.role !== 'admin' && (
                  <button 
                    className="btn-small btn-revoke"
                    onClick={() => revokeAccess(user.id)}
                    title="Revoke access"
                  >
                    ✗
                  </button>
                )}
                {user.role !== 'admin' && (
                  <button 
                    className="btn-small btn-toggle"
                    onClick={() => toggleUserActive(user.id, user.is_active)}
                    title={user.is_active ? 'Block' : 'Unblock'}
                  >
                    {user.is_active ? '◉' : '○'}
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
            <h3>// GRANT ACCESS</h3>
            <p>Target: <strong>{grantModal.email}</strong></p>
            
            <div className="grant-options">
              <button 
                className="grant-option"
                onClick={() => grantAccess(grantModal.id, 'monthly', 30)}
              >
                <span className="grant-icon">⏱</span>
                <span className="grant-title">30 Days</span>
                <span className="grant-desc">Temporary access</span>
              </button>
              <button 
                className="grant-option lifetime"
                onClick={() => grantAccess(grantModal.id, 'lifetime')}
              >
                <span className="grant-icon">∞</span>
                <span className="grant-title">Lifetime</span>
                <span className="grant-desc">Permanent access</span>
              </button>
            </div>

            <button className="btn-secondary btn-full" onClick={() => setGrantModal(null)}>
              [ CANCEL ]
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
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [formData, setFormData] = useState({
    template: '',
    email: '',
    brand: '',
    product: '',
    price: '',
    size: '',
    style_id: '',
    colour: '',
    taxes: '',
    reference: '',
    first_name: '',
    whole_name: '',
    quantity: '1',
    currency: 'USD',
    phone_number: '',
    card_end: '',
    estimated_delivery: '',
    image_url: '',
    date: new Date().toISOString().split('T')[0],
    full_name: '',
    street: '',
    city: '',
    postal_code: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [errors, setErrors] = useState({});
  const previewRef = useRef(null);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        if (data.templates?.length > 0) {
          setFormData(prev => ({ ...prev, template: data.templates[0].id }));
        }
      }
    } catch (e) {
      console.error('Failed to fetch templates:', e);
    }
    setTemplatesLoading(false);
  };

  const selectedTemplate = templates.find(t => t.id === formData.template);

  // Field configuration for dynamic rendering
  const fieldConfig = {
    brand: { label: 'Marka *', placeholder: 'Nike, Supreme, etc.', required: true },
    product: { label: 'Produkt *', placeholder: 'Nazwa produktu', required: true },
    price: { label: 'Cena *', placeholder: '199.99', type: 'number', required: true },
    size: { label: 'Rozmiar', placeholder: 'M, L, 42, etc.' },
    style_id: { label: 'Style ID', placeholder: 'ABC-123' },
    colour: { label: 'Kolor', placeholder: 'Czarny, Biały, etc.' },
    taxes: { label: 'Podatek', placeholder: '0.00', type: 'number' },
    reference: { label: 'Referencja', placeholder: 'REF-001' },
    first_name: { label: 'Imię', placeholder: 'Jan' },
    whole_name: { label: 'Pełne imię i nazwisko', placeholder: 'Jan Kowalski' },
    quantity: { label: 'Ilość', placeholder: '1', type: 'number' },
    currency: { label: 'Waluta', placeholder: 'USD, PLN, EUR' },
    phone_number: { label: 'Numer telefonu', placeholder: '+48 123 456 789' },
    card_end: { label: 'Końcówka karty', placeholder: '4242' },
    estimated_delivery: { label: 'Szacowana dostawa', placeholder: '3-5 dni roboczych' },
    image_url: { label: 'URL obrazka *', placeholder: 'https://...', required: true },
    date: { label: 'Data *', type: 'date', required: true },
    shipping_address: { label: 'Adres dostawy', placeholder: 'Pełny adres', isAddress: true }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.template) newErrors.template = 'Wybierz szablon';
    if (!formData.email.trim()) newErrors.email = 'Wymagane';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Nieprawidłowy email';
    if (!formData.brand.trim()) newErrors.brand = 'Wymagane';
    if (!formData.product.trim()) newErrors.product = 'Wymagane';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Podaj cenę';
    if (!formData.image_url.trim()) newErrors.image_url = 'Wymagane';
    if (!formData.date) newErrors.date = 'Wymagane';
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
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        taxes: parseFloat(formData.taxes) || 0,
        quantity: parseInt(formData.quantity) || 1
      };

      const res = await fetch(`${BACKEND_URL}/api/${preview ? 'preview' : 'generate'}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
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
    setFormData(prev => ({
      template: prev.template,
      email: '',
      brand: '',
      product: '',
      price: '',
      size: '',
      style_id: '',
      colour: '',
      taxes: '',
      reference: '',
      first_name: '',
      whole_name: '',
      quantity: '1',
      currency: 'USD',
      phone_number: '',
      card_end: '',
      estimated_delivery: '',
      image_url: '',
      date: new Date().toISOString().split('T')[0],
      full_name: '',
      street: '',
      city: '',
      postal_code: '',
      country: ''
    }));
    setGeneratedDoc(null);
    setErrors({});
  };

  // Check if user has access
  if (!user?.has_access) {
    return (
      <div className="no-access-card glass">
        <div className="no-access-icon">⛔</div>
        <h3>ACCESS DENIED</h3>
        <p>Authorization required to access document generation.</p>
        <p>Contact system administrator to obtain access credentials.</p>
        {user?.subscription_type === 'monthly' && user?.days_remaining === 0 && (
          <p className="expired-text">// ACCESS TOKEN EXPIRED</p>
        )}
      </div>
    );
  }

  if (templatesLoading) {
    return <Loader />;
  }

  // Get fields for selected template
  const templateFields = selectedTemplate?.fields || [];

  return (
    <div className="generator-grid">
      {/* Form */}
      <div className="generator-form glass">
        <div className="form-header">
          <h3>// INPUT DATA</h3>
          <div className="user-stats">
            <span className="stat-pill">
              {user.subscription_type === 'lifetime' ? '∞ LIFETIME' : `⏱ ${user.days_remaining}d`}
            </span>
            <span className="stat-pill">📊 {user.documents_generated}</span>
          </div>
        </div>

        <div className="form-body">
          {/* Template selector - Grid */}
          <div className="template-selector">
            <label className="input-label">Wybierz szablon ({templates.length} dostępnych)</label>
            <div className="template-grid">
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

          {/* Email - always required */}
          <div className="form-group">
            <label className="input-label">Email odbiorcy *</label>
            <input
              type="email"
              className={`input-field ${errors.email ? 'error' : ''}`}
              placeholder="target@domain.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Dynamic fields based on template */}
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">{fieldConfig.brand.label}</label>
              <input
                type="text"
                className={`input-field ${errors.brand ? 'error' : ''}`}
                placeholder={fieldConfig.brand.placeholder}
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="input-label">{fieldConfig.product.label}</label>
              <input
                type="text"
                className={`input-field ${errors.product ? 'error' : ''}`}
                placeholder={fieldConfig.product.placeholder}
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="input-label">{fieldConfig.price.label}</label>
              <input
                type="number"
                step="0.01"
                className={`input-field ${errors.price ? 'error' : ''}`}
                placeholder={fieldConfig.price.placeholder}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="input-label">{fieldConfig.date.label}</label>
              <input
                type="date"
                className={`input-field ${errors.date ? 'error' : ''}`}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {/* Conditional fields based on template */}
          {templateFields.includes('size') && (
            <div className="form-row">
              <div className="form-group">
                <label className="input-label">{fieldConfig.size.label}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={fieldConfig.size.placeholder}
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
              </div>
              {templateFields.includes('colour') && (
                <div className="form-group">
                  <label className="input-label">{fieldConfig.colour.label}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={fieldConfig.colour.placeholder}
                    value={formData.colour}
                    onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {templateFields.includes('style_id') && (
            <div className="form-group">
              <label className="input-label">{fieldConfig.style_id.label}</label>
              <input
                type="text"
                className="input-field"
                placeholder={fieldConfig.style_id.placeholder}
                value={formData.style_id}
                onChange={(e) => setFormData({ ...formData, style_id: e.target.value })}
              />
            </div>
          )}

          {templateFields.includes('taxes') && (
            <div className="form-row">
              <div className="form-group">
                <label className="input-label">{fieldConfig.taxes.label}</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder={fieldConfig.taxes.placeholder}
                  value={formData.taxes}
                  onChange={(e) => setFormData({ ...formData, taxes: e.target.value })}
                />
              </div>
              {templateFields.includes('currency') && (
                <div className="form-group">
                  <label className="input-label">{fieldConfig.currency.label}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={fieldConfig.currency.placeholder}
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {templateFields.includes('reference') && (
            <div className="form-group">
              <label className="input-label">{fieldConfig.reference.label}</label>
              <input
                type="text"
                className="input-field"
                placeholder={fieldConfig.reference.placeholder}
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
          )}

          {(templateFields.includes('first_name') || templateFields.includes('whole_name')) && (
            <div className="form-row">
              {templateFields.includes('first_name') && (
                <div className="form-group">
                  <label className="input-label">{fieldConfig.first_name.label}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={fieldConfig.first_name.placeholder}
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
              )}
              {templateFields.includes('whole_name') && (
                <div className="form-group">
                  <label className="input-label">{fieldConfig.whole_name.label}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={fieldConfig.whole_name.placeholder}
                    value={formData.whole_name}
                    onChange={(e) => setFormData({ ...formData, whole_name: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {templateFields.includes('quantity') && (
            <div className="form-group">
              <label className="input-label">{fieldConfig.quantity.label}</label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder={fieldConfig.quantity.placeholder}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          )}

          {templateFields.includes('phone_number') && (
            <div className="form-group">
              <label className="input-label">{fieldConfig.phone_number.label}</label>
              <input
                type="text"
                className="input-field"
                placeholder={fieldConfig.phone_number.placeholder}
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>
          )}

          {(templateFields.includes('card_end') || templateFields.includes('estimated_delivery')) && (
            <div className="form-row">
              {templateFields.includes('card_end') && (
                <div className="form-group">
                  <label className="input-label">{fieldConfig.card_end.label}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={fieldConfig.card_end.placeholder}
                    value={formData.card_end}
                    onChange={(e) => setFormData({ ...formData, card_end: e.target.value })}
                  />
                </div>
              )}
              {templateFields.includes('estimated_delivery') && (
                <div className="form-group">
                  <label className="input-label">{fieldConfig.estimated_delivery.label}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={fieldConfig.estimated_delivery.placeholder}
                    value={formData.estimated_delivery}
                    onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Shipping address for templates that need it */}
          {templateFields.includes('shipping_address') && (
            <div className="address-section">
              <label className="input-label section-label">📦 Adres dostawy</label>
              <div className="form-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Imię i nazwisko"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ulica i numer"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Miasto"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Kod pocztowy"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Kraj"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Image URL - always required */}
          <div className="form-group">
            <label className="input-label">{fieldConfig.image_url.label}</label>
            <input
              type="url"
              className={`input-field ${errors.image_url ? 'error' : ''}`}
              placeholder={fieldConfig.image_url.placeholder}
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
            {formData.image_url && (
              <div className="image-preview-small">
                <img src={formData.image_url} alt="Preview" onError={(e) => e.target.style.display='none'} />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={() => handleGenerate(true)} disabled={previewLoading}>
              {previewLoading ? <span className="loader-small"></span> : '◉'} PREVIEW
            </button>
            <button className="btn-primary" onClick={() => handleGenerate(false)} disabled={loading}>
              {loading ? <span className="loader-small"></span> : '▶'} EXECUTE
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="preview-area" ref={previewRef}>
        {generatedDoc ? (
          <div className="document-card animate-slide-up">
            <div className="document-header">
              <div className="document-title">◉ OUTPUT DOCUMENT</div>
              <div className="document-id">ID: {generatedDoc.document_id}</div>
            </div>
            {generatedDoc.email_sent && (
              <div className="email-sent-badge">✓ TRANSMISSION COMPLETE</div>
            )}
            <div className="document-preview">
              <iframe srcDoc={generatedDoc.html_content} title="Preview" sandbox="allow-same-origin" />
            </div>
            <div className="document-actions">
              <button className="btn-secondary" onClick={() => {
                const temp = document.createElement('div');
                temp.innerHTML = generatedDoc.html_content;
                navigator.clipboard.writeText(temp.textContent);
                showToast('Data copied to clipboard', 'success');
              }}>[ COPY ]</button>
              <button className="btn-secondary" onClick={handleReset}>[ RESET ]</button>
            </div>
          </div>
        ) : (
          <div className="preview-placeholder glass">
            <div className="placeholder-icon animate-float">◎</div>
            <h3>OUTPUT AREA</h3>
            <p>Awaiting document generation request...</p>
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
            <span className="logo-icon">🔐</span>
            <span className="logo-text">DOCGEN</span>
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
                <h2 className="section-title">// GENERATOR</h2>
                <p className="section-subtitle">Initialize document generation protocol</p>
              </div>
              <Generator showToast={showToast} />
            </section>
          )}

          {/* How it works */}
          <section className="how-it-works">
            <div className="container">
              <div className="section-header">
                <h2 className="section-title">// PROTOCOL</h2>
                <p className="section-subtitle">System operation sequence</p>
              </div>
              <div className="steps-grid">
                <div className="step-card glass">
                  <div className="step-number">01</div>
                  <div className="step-icon">⌨️</div>
                  <h3>Input Data</h3>
                  <p>Enter recipient details, order ID, timestamp and amount into the secure form.</p>
                </div>
                <div className="step-card glass">
                  <div className="step-number">02</div>
                  <div className="step-icon">⚙️</div>
                  <h3>Process</h3>
                  <p>System generates encrypted document using selected template protocol.</p>
                </div>
                <div className="step-card glass">
                  <div className="step-number">03</div>
                  <div className="step-icon">📡</div>
                  <h3>Transmit</h3>
                  <p>Document automatically transmitted via secure SMTP to target address.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            <div className="container">
              <div className="footer-content">
                <div className="footer-logo">
                  <span className="logo-icon">🔐</span>
                  <span className="logo-text">DOCGEN</span>
                </div>
                <p className="footer-text">Secure document generation system with encrypted email transmission.</p>
                <div className="footer-copy">© {new Date().getFullYear()} DOCGEN SYSTEMS // ALL RIGHTS RESERVED</div>
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
