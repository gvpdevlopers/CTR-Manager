import { useEffect, useState } from "react";
import API from "../../services/api";
import AddAccountForm from "../../components/employee/AddAccountForm";
import BulkPasteAccounts from "../../components/employee/BulkPasteAccounts";

export default function MyAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/platform-accounts/me");
      setAccounts(res.data);
      setLoading(false);
    } catch (err) {
      alert("Failed to load accounts");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const toggleStatus = async (id, status) => {
    try {
      const newStatus = status === "active" ? "not_active" : "active";
      await API.put(`/platform-accounts/me/${id}`, {
        status: newStatus,
      });
      fetchAccounts();
    } catch (err) {
      alert("Status update failed");
    }
  };

  const deleteAccount = async (id) => {
    if (!window.confirm("Delete this account?")) return;
    try {
      await API.delete(`/platform-accounts/me/${id}`);
      fetchAccounts();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Single Add */}
      <AddAccountForm refresh={fetchAccounts} />

      {/* Bulk Paste */}
      <BulkPasteAccounts refresh={fetchAccounts} />

      {/* Accounts Table */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-3 dark:text-white">
          My Platform Accounts
        </h2>

        {loading ? (
          <p className="dark:text-white">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:text-white">
                <th>Platform</th>
                <th>Username</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc._id} className="border-b dark:text-gray-300">
                  <td className="capitalize">{acc.platform}</td>
                  <td>{acc.username}</td>
                  <td>
                    {acc.status === "active" ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </td>
                  <td className="text-right space-x-2">
                    <button
                      onClick={() => toggleStatus(acc._id, acc.status)}
                      className="px-2 py-1 border rounded"
                    >
                      Toggle
                    </button>
                    <button
                      onClick={() => deleteAccount(acc._id)}
                      className="px-2 py-1 border rounded text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400">
                    No accounts added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
