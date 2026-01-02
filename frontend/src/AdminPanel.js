import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

function AdminPanel({ user, onBack }) {
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("users"); // users, documents, stats
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // New user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    username: "",
    role: "user"
  });

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "documents") fetchDocuments();
    if (activeTab === "stats") fetchStats();
  }, [activeTab]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, getAuthHeaders());
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage("❌ Błąd pobierania użytkowników");
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/admin/documents`, getAuthHeaders());
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`, getAuthHeaders());
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-indigo-600">🔧 Panel Administratora</h1>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ← Powrót do panelu
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 bg-white p-2 rounded-lg shadow">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
              activeTab === "users"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            👥 Użytkownicy
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
              activeTab === "documents"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📄 Dokumenty
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
              activeTab === "stats"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📊 Statystyki
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Users Tab */}
          {activeTab === "users" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Użytkownicy ({users.length})</h2>
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  {showAddUser ? "❌ Anuluj" : "➕ Dodaj użytkownika"}
                </button>
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <form onSubmit={handleAddUser} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="px-4 py-2 border rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Nazwa użytkownika"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="password"
                      placeholder="Hasło"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="px-4 py-2 border rounded-lg"
                      required
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="px-4 py-2 border rounded-lg"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {loading ? "Dodawanie..." : "Dodaj"}
                  </button>
                </form>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Nazwa</th>
                      <th className="px-4 py-3 text-left">Rola</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Data utworzenia</th>
                      <th className="px-4 py-3 text-left">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">{u.username}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {u.is_active ? 'Aktywny' : 'Nieaktywny'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleUser(u.id, u.is_active)}
                            disabled={u.id === user.id}
                            className="mr-2 px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:bg-gray-300"
                          >
                            {u.is_active ? '🔒 Dezaktywuj' : '✅ Aktywuj'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user.id}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:bg-gray-300"
                          >
                            🗑️ Usuń
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
              <h2 className="text-2xl font-bold mb-6">Historia Dokumentów ({documents.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Szablon</th>
                      <th className="px-4 py-3 text-left">Email odbiorcy</th>
                      <th className="px-4 py-3 text-left">Nr zamówienia</th>
                      <th className="px-4 py-3 text-left">Data</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="px-4 py-3 font-semibold">{doc.template}</td>
                        <td className="px-4 py-3">{doc.recipient_email}</td>
                        <td className="px-4 py-3">{doc.order_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(doc.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            doc.email_sent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {doc.email_sent ? '✅ Wysłano' : '❌ Błąd'}
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
              <h2 className="text-2xl font-bold mb-6">Statystyki Systemu</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Users Stats */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">👥 Użytkownicy</h3>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">{stats.users.total}</p>
                    <p className="text-sm opacity-90">Łącznie</p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-sm">✅ Aktywni: {stats.users.active}</p>
                      <p className="text-sm">🔒 Nieaktywni: {stats.users.inactive}</p>
                    </div>
                  </div>
                </div>

                {/* Documents Stats */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">📄 Dokumenty</h3>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">{stats.documents.total}</p>
                    <p className="text-sm opacity-90">Łącznie</p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-sm">✅ Wysłane: {stats.documents.sent}</p>
                      <p className="text-sm">❌ Błędy: {stats.documents.failed}</p>
                    </div>
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

export default AdminPanel;
