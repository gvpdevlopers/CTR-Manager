// src/pages/admin/AdminInstagramAccounts.jsx
import { useEffect, useState } from "react";
import API from "../../services/api";

/* ========= COMMON UI CLASSES ========= */

const inputInline =
  "w-full bg-transparent border-b border-gray-400 text-gray-900 placeholder-gray-400 " +
  "focus:outline-none focus:border-blue-500 transition " +
  "dark:border-gray-500 dark:text-white dark:placeholder-gray-400";

const searchInput =
  "w-full md:w-1/3 rounded px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "bg-white text-gray-900 border-gray-300 placeholder-gray-400 " +
  "dark:bg-gray-900 dark:text-white dark:border-gray-600 dark:placeholder-gray-500";

const selectStatus =
  "rounded px-2 py-1 text-sm border focus:outline-none focus:ring-1 focus:ring-blue-500 " +
  "bg-white text-gray-900 border-gray-300 " +
  "dark:bg-gray-900 dark:text-white dark:border-gray-600";

const actionBtn =
  "px-3 py-1 border rounded text-sm transition hover:opacity-90";

/* =================================== */

export default function AdminInstagramAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/instagram-accounts");
      setAccounts(res.data || []);
    } catch {
      alert("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  /* ================= ACTIONS ================= */
  const updateField = async (id, field, value) => {
    if (value === undefined || value === null) return;

    try {
      await API.put(`/instagram-accounts/${id}`, {
        [field]: value,
      });

      //  ALWAYS re-fetch from backend
      fetchAccounts();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await API.put(`/instagram-accounts/${id}`, { status });
      fetchAccounts();
    } catch {
      alert("Status update failed");
    }
  };

  const deleteAccount = async (id) => {
    if (!confirm("Delete this account?")) return;
    try {
      await API.delete(`/instagram-accounts/${id}`);
      fetchAccounts();
    } catch {
      alert("Delete failed");
    }
  };

  /* ================= FILTER ================= */
  const filtered = accounts.filter((acc) => {
    const q = search.toLowerCase();
    return (
      acc.username?.toLowerCase().includes(q) ||
      acc.name?.toLowerCase().includes(q)
    );
  });

  /* ================= COUNTS ================= */
  const total = accounts.length;
  const working = accounts.filter((a) => a.status === "working").length;
  const suspicious = accounts.filter((a) => a.status === "suspicious").length;
  const notWorking = accounts.filter((a) => a.status === "not_working").length;

  /* ================= UI ================= */
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Instagram Accounts
        </h2>

        <button
          onClick={fetchAccounts}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
        >
          Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 rounded bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-300">
          Total: {total}
        </div>
        <div className="p-3 rounded bg-green-100 text-green-900 dark:bg-green-500/20 dark:text-green-300">
          Working: {working}
        </div>
        <div className="p-3 rounded bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-300">
          Suspicious: {suspicious}
        </div>
        <div className="p-3 rounded bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-300">
          Not Working: {notWorking}
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search by username / name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={searchInput}
      />

      {/* TABLE */}
      <div
        className="rounded shadow overflow-x-auto
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700"
      >
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-900">
            <tr className="text-left text-gray-700 dark:text-gray-300">
              <th className="py-2 px-2">Sr</th>
              <th>Name</th>
              <th>Username</th>
              <th>Password</th>
              <th>Link</th>
              <th>Status</th>
              <th className="text-right pr-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-gray-400">
                  No accounts found
                </td>
              </tr>
            ) : (
              filtered.map((acc, i) => (
                <tr
                  key={acc._id}
                  className="border-t border-gray-200 dark:border-gray-700
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="px-2 py-2 text-gray-900 dark:text-gray-100">
                    {i + 1}
                  </td>

                  <td className="py-2">
                    <input
                      value={acc.name || ""}
                      onChange={(e) =>
                        setAccounts((prev) =>
                          prev.map((a) =>
                            a._id === acc._id
                              ? { ...a, name: e.target.value }
                              : a
                          )
                        )
                      }
                      onBlur={(e) =>
                        updateField(acc._id, "name", e.target.value)
                      }
                      className={inputInline}
                    />
                  </td>

                  <td className="py-2">
                    <input
                      defaultValue={acc.username}
                      placeholder="—"
                      onBlur={(e) =>
                        updateField(acc._id, "username", e.target.value)
                      }
                      className={inputInline}
                    />
                  </td>

                  <td className="py-2">
                    <input
                      defaultValue={acc.password}
                      placeholder="—"
                      onBlur={(e) =>
                        updateField(acc._id, "password", e.target.value)
                      }
                      className={inputInline}
                    />
                  </td>

                  <td className="py-2">
                    <input
                      defaultValue={acc.link}
                      placeholder="—"
                      onBlur={(e) =>
                        updateField(acc._id, "link", e.target.value)
                      }
                      className={inputInline}
                    />
                  </td>

                  <td className="py-2">
                    <select
                      value={acc.status}
                      onChange={(e) => changeStatus(acc._id, e.target.value)}
                      className={selectStatus}
                    >
                      <option value="working">Working</option>
                      <option value="suspicious">Suspicious</option>
                      <option value="not_working">Not Working</option>
                    </select>
                  </td>

                  <td className="py-2 text-right pr-2">
                    <button
                      onClick={() => deleteAccount(acc._id)}
                      className={`${actionBtn} border-red-600 text-red-600 dark:text-red-400`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
