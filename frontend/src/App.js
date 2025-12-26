import React, { useState, useRef } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

function App() {
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
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  
  const generatorRef = useRef(null);
  const previewRef = useRef(null);

  const templates = [
    { id: 'receipt', name: 'Potwierdzenie zamówienia', icon: '🧾' },
    { id: 'invoice', name: 'Faktura', icon: '📄' },
    { id: 'confirmation', name: 'Potwierdzenie operacji', icon: '✅' }
  ];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Imię jest wymagane';
    if (!formData.email.trim()) {
      newErrors.email = 'Email jest wymagany';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }
    if (!formData.order_number.trim()) newErrors.order_number = 'Numer zamówienia jest wymagany';
    if (!formData.date) newErrors.date = 'Data jest wymagana';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Podaj prawidłową kwotę';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePreview = async () => {
    if (!validateForm()) {
      showToast('Wypełnij poprawnie wszystkie wymagane pola', 'error');
      return;
    }

    setPreviewLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedDoc({
          html_content: data.html_content,
          document_id: data.document_id,
          email_sent: false
        });
        setTimeout(() => {
          previewRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        showToast('Błąd podczas generowania podglądu', 'error');
      }
    } catch (error) {
      showToast('Błąd połączenia z serwerem', 'error');
    }
    setPreviewLoading(false);
  };

  const handleGenerate = async () => {
    if (!validateForm()) {
      showToast('Wypełnij poprawnie wszystkie wymagane pola', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedDoc({
          html_content: data.html_content,
          document_id: data.document_id,
          email_sent: data.email_sent
        });
        
        if (data.email_sent) {
          showToast('Dokument wygenerowany i wysłany na email!', 'success');
        } else {
          showToast('Dokument wygenerowany, ale wysyłka email nie powiodła się', 'error');
        }
        
        setTimeout(() => {
          previewRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        showToast(data.message || 'Błąd podczas generowania', 'error');
      }
    } catch (error) {
      showToast('Błąd połączenia z serwerem', 'error');
    }
    setLoading(false);
  };

  const handleCopyContent = () => {
    if (generatedDoc?.html_content) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generatedDoc.html_content;
      const textContent = tempDiv.textContent || tempDiv.innerText;
      navigator.clipboard.writeText(textContent);
      showToast('Treść skopiowana do schowka!', 'success');
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      order_number: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      additional_info: '',
      template: 'receipt'
    });
    setGeneratedDoc(null);
    setErrors({});
    generatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app">
      {/* Background effects */}
      <div className="bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">📄</span>
            <span className="logo-text">DocGen</span>
          </div>
          <button className="btn-primary nav-cta" onClick={scrollToGenerator}>
            Generuj dokument
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-badge animate-slide-down">
            <span>✨</span> Generator dokumentów nowej generacji
          </div>
          <h1 className="hero-title animate-slide-up">
            Generuj profesjonalne<br/>
            <span className="gradient-text">dokumenty w sekundę</span>
          </h1>
          <p className="hero-subtitle animate-slide-up" style={{animationDelay: '0.1s'}}>
            Twórz eleganckie potwierdzenia, faktury i inne dokumenty.<br/>
            Automatyczna wysyłka na email – szybko, prosto, bezpiecznie.
          </p>
          <div className="hero-buttons animate-slide-up" style={{animationDelay: '0.2s'}}>
            <button className="btn-primary btn-large" onClick={scrollToGenerator}>
              <span>🚀</span> Rozpocznij teraz
            </button>
            <a href="#jak-to-dziala" className="btn-secondary btn-large">
              <span>📖</span> Jak to działa?
            </a>
          </div>
          
          <div className="hero-stats animate-fade-in" style={{animationDelay: '0.4s'}}>
            <div className="stat-item">
              <div className="stat-value">3</div>
              <div className="stat-label">Szablony</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">∞</div>
              <div className="stat-label">Dokumentów</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">📧</div>
              <div className="stat-label">Auto-wysyłka</div>
            </div>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section className="generator-section" ref={generatorRef} id="generator">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">⚡</span>
              Generator dokumentów
            </h2>
            <p className="section-subtitle">
              Wypełnij formularz i wygeneruj profesjonalny dokument
            </p>
          </div>

          <div className="generator-grid">
            {/* Form */}
            <div className="generator-form glass">
              <div className="form-header">
                <h3>📝 Dane dokumentu</h3>
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
                        data-testid={`template-${t.id}`}
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
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`input-field ${errors.name ? 'error' : ''}`}
                      placeholder="Jan Kowalski"
                      data-testid="input-name"
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="input-label">Adres e-mail *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`input-field ${errors.email ? 'error' : ''}`}
                      placeholder="jan@example.com"
                      data-testid="input-email"
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="input-label">Numer zamówienia / ID *</label>
                    <input
                      type="text"
                      name="order_number"
                      value={formData.order_number}
                      onChange={handleInputChange}
                      className={`input-field ${errors.order_number ? 'error' : ''}`}
                      placeholder="ORD-2024-001"
                      data-testid="input-order-number"
                    />
                    {errors.order_number && <span className="error-text">{errors.order_number}</span>}
                  </div>
                  <div className="form-group">
                    <label className="input-label">Data *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={`input-field ${errors.date ? 'error' : ''}`}
                      data-testid="input-date"
                    />
                    {errors.date && <span className="error-text">{errors.date}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">Kwota (PLN) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className={`input-field ${errors.amount ? 'error' : ''}`}
                    placeholder="199.99"
                    step="0.01"
                    min="0"
                    data-testid="input-amount"
                  />
                  {errors.amount && <span className="error-text">{errors.amount}</span>}
                </div>

                <div className="form-group">
                  <label className="input-label">Dodatkowe informacje</label>
                  <textarea
                    name="additional_info"
                    value={formData.additional_info}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Opcjonalne uwagi, opis produktu/usługi..."
                    rows="3"
                    data-testid="input-additional-info"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={handlePreview}
                    disabled={previewLoading}
                    data-testid="btn-preview"
                  >
                    {previewLoading ? (
                      <>
                        <span className="loader-small"></span>
                        Ładowanie...
                      </>
                    ) : (
                      <>
                        <span>👁️</span> Podgląd
                      </>
                    )}
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleGenerate}
                    disabled={loading}
                    data-testid="btn-generate"
                  >
                    {loading ? (
                      <>
                        <span className="loader-small"></span>
                        Generowanie...
                      </>
                    ) : (
                      <>
                        <span>📨</span> Generuj i wyślij
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview placeholder or document */}
            <div className="preview-area" ref={previewRef}>
              {generatedDoc ? (
                <div className="document-card animate-slide-up">
                  <div className="document-header">
                    <div className="document-title">
                      <span>📄</span>
                      <span>Wygenerowany dokument</span>
                    </div>
                    <div className="document-id">
                      ID: {generatedDoc.document_id}
                    </div>
                  </div>
                  
                  {generatedDoc.email_sent && (
                    <div className="email-sent-badge">
                      <span>✅</span> Wysłano na email
                    </div>
                  )}
                  
                  <div className="document-preview">
                    <iframe
                      srcDoc={generatedDoc.html_content}
                      title="Document Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                  
                  <div className="document-actions">
                    <button className="btn-secondary" onClick={handleCopyContent} data-testid="btn-copy">
                      <span>📋</span> Kopiuj treść
                    </button>
                    <button className="btn-secondary" onClick={handleReset} data-testid="btn-reset">
                      <span>🔄</span> Nowy dokument
                    </button>
                  </div>
                </div>
              ) : (
                <div className="preview-placeholder glass">
                  <div className="placeholder-icon animate-float">📄</div>
                  <h3>Podgląd dokumentu</h3>
                  <p>Wypełnij formularz i kliknij "Podgląd" lub "Generuj i wyślij", aby zobaczyć wygenerowany dokument.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works" id="jak-to-dziala">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">🎯</span>
              Jak to działa?
            </h2>
            <p className="section-subtitle">
              Trzy proste kroki do profesjonalnego dokumentu
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card glass animate-slide-up">
              <div className="step-number">1</div>
              <div className="step-icon">✍️</div>
              <h3>Wypełnij formularz</h3>
              <p>Wprowadź dane: imię, email, numer zamówienia, datę i kwotę. Wybierz jeden z trzech szablonów.</p>
            </div>
            
            <div className="step-card glass animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="step-number">2</div>
              <div className="step-icon">⚡</div>
              <h3>Generuj dokument</h3>
              <p>Kliknij przycisk "Generuj i wyślij". System natychmiast utworzy elegancki dokument HTML.</p>
            </div>
            
            <div className="step-card glass animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="step-number">3</div>
              <div className="step-icon">📧</div>
              <h3>Automatyczna wysyłka</h3>
              <p>Dokument zostanie automatycznie wysłany na podany adres email przez Gmail SMTP.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">❓</span>
              Często zadawane pytania
            </h2>
          </div>

          <div className="faq-grid">
            <div className="faq-item glass">
              <h4>Czy muszę się rejestrować?</h4>
              <p>Nie! DocGen jest całkowicie darmowy i nie wymaga rejestracji. Po prostu wypełnij formularz i generuj dokumenty.</p>
            </div>
            
            <div className="faq-item glass">
              <h4>Jakie szablony są dostępne?</h4>
              <p>Oferujemy trzy profesjonalne szablony: Potwierdzenie zamówienia, Faktura oraz Potwierdzenie operacji. Każdy z unikalnym designem.</p>
            </div>
            
            <div className="faq-item glass">
              <h4>Czy email jest wysyłany automatycznie?</h4>
              <p>Tak! Po kliknięciu "Generuj i wyślij" dokument jest automatycznie wysyłany na podany adres email przez bezpieczne połączenie Gmail SMTP.</p>
            </div>
            
            <div className="faq-item glass">
              <h4>Czy moje dane są bezpieczne?</h4>
              <p>Tak. Nie przechowujemy żadnych danych. Dokumenty są generowane w czasie rzeczywistym i wysyłane bezpośrednio na Twój email.</p>
            </div>
            
            <div className="faq-item glass">
              <h4>Czy mogę pobrać dokument?</h4>
              <p>Dokument jest wysyłany na email jako HTML. Możesz go wydrukować lub zapisać z przeglądarki. Możesz też skopiować treść.</p>
            </div>
            
            <div className="faq-item glass">
              <h4>Ile dokumentów mogę wygenerować?</h4>
              <p>Nie ma limitu! Możesz generować nieograniczoną liczbę dokumentów całkowicie za darmo.</p>
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
            <p className="footer-text">
              Generator profesjonalnych dokumentów z automatyczną wysyłką email.<br/>
              Szybko, prosto, bezpiecznie.
            </p>
            <div className="footer-copy">
              © {new Date().getFullYear()} DocGen. Wszystkie prawa zastrzeżone.
            </div>
          </div>
        </div>
      </footer>

      {/* Toast notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`} data-testid="toast">
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
