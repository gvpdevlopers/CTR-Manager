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
  "rounded px-2 py-1 text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 " +
  "bg-white text-gray-900 border-gray-300 " +
  "dark:bg-gray-900 dark:text-white dark:border-gray-600";

const actionBtn =
  "px-3 py-1 border rounded text-xs transition hover:opacity-90";

/* ==================================== */

export default function AdminRedditAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/reddit-accounts");
      setAccounts(res.data || []);
    } catch {
      alert("Failed to load Reddit accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  /* ================= ACTIONS ================= */
  const updateField = async (id, field, value) => {
    try {
      await API.put(`/reddit-accounts/${id}`, { [field]: value });
      setAccounts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, [field]: value } : a))
      );
    } catch {
      alert("Update failed");
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await API.put(`/reddit-accounts/${id}`, { status });
      fetchAccounts();
    } catch {
      alert("Status update failed");
    }
  };

  const deleteAccount = async (id) => {
    if (!confirm("Delete this Reddit account?")) return;
    try {
      await API.delete(`/reddit-accounts/${id}`);
      fetchAccounts();
    } catch {
      alert("Delete failed");
    }
  };

  /* ================= FILTER ================= */
  const filtered = accounts.filter((acc) => {
    const q = search.toLowerCase();
    return (
      (acc.userId || "").toLowerCase().includes(q) ||
      (acc.name1 || "").toLowerCase().includes(q) ||
      (acc.email1 || "").toLowerCase().includes(q) ||
      (acc.name2 || "").toLowerCase().includes(q) ||
      (acc.email2 || "").toLowerCase().includes(q)
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
          Reddit Accounts
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
        placeholder="Search by userId / name / email..."
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
        <table className="w-full text-xs">
          <thead className="bg-gray-100 dark:bg-gray-900">
            <tr className="text-left text-gray-700 dark:text-gray-300">
              <th className="px-2 py-2">Sr</th>
              <th>User ID</th>
              <th>Name 1</th>
              <th>Email 1</th>
              <th>Pass 1</th>
              <th>Name 2</th>
              <th>Email 2</th>
              <th>Pass 2</th>
              <th>Status</th>
              <th className="text-right pr-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-6 text-center text-gray-400">
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
                      defaultValue={acc.userId}
                      placeholder="—"
                      onBlur={(e) =>
                        updateField(acc._id, "userId", e.target.value)
                      }
                      className={inputInline}
                    />
                  </td>

                  <td className="py-2">
                    <input
                      defaultValue={acc.name1}
                      placeholder="—"
                      onBlur={(e) =>
                        updateField(acc._id, "name1", e.target.value)
                      }
                      className={inputInline}
                    />
                  </td>

                  <td className="py-2">
                    <input
                      defaultValue={acc.email1}
                      placeholder="—"
                      onBlur={(e) =>
                        updateField(acc._id, "email1", e.target.value)
                      }
                      className={inputInline}
                    />
                  </td>

                  <td className="py-2">
                    <input
                      defaultValue={acc.password1}
                      placeholder="—"
                      onBlur={(e) =>
                        updateField(acc._id, "password1", e.target.value)
                      }
                      className={inputInline}
                    />
                  </td>

                  <td className="py-2">
                    <input
                      defaultValue={acc.name2}
                      placeholder="—"
                      onBlur={(e) =>
                        updateField(acc._id, "name2", e.target.value)
                      }
                      className={inputInline}
                    />
                  </td>

                  <td className="py-2">
                    <input
                      defaultValue={acc.email2}
                      placeholder="—"
                      onBlur={(e) =>
                        updateField(acc._id, "email2", e.target.value)
                      }
                      className={inputInline}
                    />
                  </td>

                  <td className="py-2">
                    <input
                      defaultValue={acc.password2}
                      placeholder="—"
                      onBlur={(e) =>
                        updateField(acc._id, "password2", e.target.value)
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
