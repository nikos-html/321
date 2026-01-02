import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

function App() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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

  // Pobierz listę szablonów przy starcie
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
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
  };

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
      const response = await axios.post(`${API}/generate-document`, {
        template: selectedTemplate,
        ...formData
      });

      if (response.data.success) {
        setMessage(`✅ ${response.data.message}`);
        // Reset formularza
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            📧 Generator Dokumentów HTML
          </h1>
          <p className="text-xl text-gray-600">
            Generuj i wysyłaj profesjonalne dokumenty e-mail
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Dostępnych szablonów: <span className="font-bold text-indigo-600">{templates.length}</span>
          </p>
        </div>

        {/* Formularz */}
        <div className="bg-white shadow-2xl rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Wybór szablonu */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎨 Wybierz Szablon
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              >
                {templates.map((template) => (
                  <option key={template} value={template}>
                    {template.toUpperCase().replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Sekcja: Dane Odbiorcy */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📬 Dane Odbiorcy</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Odbiorcy *
                  </label>
                  <input
                    type="email"
                    name="recipient_email"
                    value={formData.recipient_email}
                    onChange={handleInputChange}
                    placeholder="klient@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pełne Imię i Nazwisko *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Jan Kowalski"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imię
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Jan"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temat E-mail
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Twoje zamówienie"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Sekcja: Adres */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🏠 Adres Dostawy</h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  name="address1"
                  value={formData.address1}
                  onChange={handleInputChange}
                  placeholder="Ulica i numer"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                
                <input
                  type="text"
                  name="address2"
                  value={formData.address2}
                  onChange={handleInputChange}
                  placeholder="Mieszkanie/Piętro"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                
                <input
                  type="text"
                  name="address3"
                  value={formData.address3}
                  onChange={handleInputChange}
                  placeholder="Kod pocztowy, Miasto"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sekcja: Szczegóły Zamówienia */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🛍️ Szczegóły Zamówienia</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numer Zamówienia *
                  </label>
                  <input
                    type="text"
                    name="order_number"
                    value={formData.order_number}
                    onChange={handleInputChange}
                    placeholder="NK-2026-12345"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Dostawy
                  </label>
                  <input
                    type="text"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleInputChange}
                    placeholder="15 stycznia 2026"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazwa Produktu
                  </label>
                  <input
                    type="text"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleInputChange}
                    placeholder="Nike Air Max 2026"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waluta
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="zł">zł (PLN)</option>
                    <option value="£">£ (GBP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cena
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="180.00"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suma
                  </label>
                  <input
                    type="text"
                    name="total"
                    value={formData.total}
                    onChange={handleInputChange}
                    placeholder="190.46"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ostatnie 4 cyfry karty
                  </label>
                  <input
                    type="text"
                    name="card_last4"
                    value={formData.card_last4}
                    onChange={handleInputChange}
                    placeholder="1234"
                    maxLength="4"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Komunikat */}
            {message && (
              <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}

            {/* Przycisk Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 text-white font-bold rounded-lg text-lg transition-all ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {loading ? '⏳ Wysyłanie...' : '📧 Wygeneruj i Wyślij Dokument'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            Powered by FastAPI + React | {templates.length} szablonów dostępnych
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
