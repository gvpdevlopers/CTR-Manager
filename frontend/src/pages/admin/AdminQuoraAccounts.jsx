import ConfirmDialog from "../../components/ConfirmDialog";
import StatusSelect from "../../components/StatusSelect";
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

export default function AdminQuoraAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [capturing, setCapturing] = useState({});
  const [savingProfile, setSavingProfile] = useState({});
  const [baselineMessages, setBaselineMessages] = useState({});

  /* ================= FETCH ================= */
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/quora-accounts");
      setAccounts(res.data || []);
    } catch {
      alert("Failed to load Quora accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  /* ================= ACTIONS ================= */
  const captureBaseline = async (account) => {
    if (capturing[account._id] || !account.profileUrl) return;
    setCapturing((current) => ({ ...current, [account._id]: true }));
    setBaselineMessages((current) => ({ ...current, [account._id]: null }));
    try {
      const { data } = await API.post(`/admin/quora-accounts/${account._id}/capture-baseline`, null, { timeout: 180000 });
      if (!data.success) throw new Error(data.message || "Baseline capture failed.");
      setBaselineMessages((current) => ({ ...current, [account._id]: { type: "success", text: data.message } }));
      await fetchAccounts();
    } catch (error) {
      const text = error.code === "ECONNABORTED"
        ? "The request timed out; the capture may still finish. Refresh the account list before retrying."
        : error.response?.data?.message || error.message || "Baseline capture failed.";
      setBaselineMessages((current) => ({ ...current, [account._id]: { type: "error", text } }));
    } finally {
      setCapturing((current) => ({ ...current, [account._id]: false }));
    }
  };

  const changeProfileAndReset = async (account) => {
    const profileUrl = window.prompt("Enter the correct public Quora profile URL:", account.profileUrl || "");
    if (!profileUrl || profileUrl === account.profileUrl) return;
    if (!window.confirm("Changing this profile clears its current baseline. A new baseline will need to be captured. Continue?")) return;
    try {
      await API.put(`/quora-accounts/${account._id}`, { profileUrl, resetBaseline: true });
      await fetchAccounts();
    } catch (error) {
      setBaselineMessages((current) => ({ ...current, [account._id]: { type: "error", text: error.response?.data?.message || "Unable to change profile." } }));
    }
  };

  const updateField = async (id, field, value) => {
    if (field === "profileUrl") setSavingProfile((current) => ({ ...current, [id]: true }));
    try {
      const { data } = await API.put(`/quora-accounts/${id}`, { [field]: value });
      setAccounts((prev) => prev.map((a) => (a._id === id ? data : a)));
    } catch (error) {
      alert(error.response?.data?.message || "Update failed");
      await fetchAccounts();
    } finally {
      if (field === "profileUrl") setSavingProfile((current) => ({ ...current, [id]: false }));
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await API.put(`/quora-accounts/${id}`, { status });
      fetchAccounts();
    } catch {
      alert("Status update failed");
    }
  };

  const deleteAccount = async (id) => {
    try {
      await API.delete(`/quora-accounts/${id}`);
      fetchAccounts();
    } catch {
      alert("Delete failed");
    }
  };

  const exportCSV = async () => {
    try {
      const res = await API.get("/quora-accounts/export/csv", {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quora_accounts.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("CSV export failed");
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
    <div className="account-sheet-page space-y-5">
      {deleteId && <ConfirmDialog title="Delete account?" description="This account will be removed. This action cannot be undone." onClose={() => setDeleteId(null)} onConfirm={() => deleteAccount(deleteId)} />}
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quora Accounts
        </h2>

        <button
          onClick={exportCSV}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
        >
          Export CSV
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
              <th>Public profile</th>
              <th>Baseline</th>
              <th>Status</th>
              <th className="text-right pr-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" className="py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="12" className="py-6 text-center text-gray-400">
                  No Quora accounts found
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

                  <td className="py-2 text-gray-700 dark:text-gray-200">
                    <input key={`${acc._id}-${acc.profileUrl || "empty"}`} defaultValue={acc.profileUrl || ""} placeholder="https://www.quora.com/profile/..." aria-label={`Public profile URL for ${acc.userId}`} onBlur={(event) => { if (event.target.value !== (acc.profileUrl || "")) updateField(acc._id, "profileUrl", event.target.value); }} className={inputInline} />
                  </td>
                  <td className="py-2 text-gray-700 dark:text-gray-200">
                    <span>{acc.baselineCapturedAt ? `Captured ${new Date(acc.baselineCapturedAt).toLocaleString()}` : "Not captured"}</span>
                    {acc.baselineCapturedAt && <button type="button" onClick={() => changeProfileAndReset(acc)} className={`${actionBtn} ml-2 border-gray-300 dark:border-gray-600`}>Change profile &amp; reset</button>}
                    {!acc.baselineCapturedAt && <button type="button" onClick={() => captureBaseline(acc)} disabled={capturing[acc._id] || savingProfile[acc._id] || !acc.profileUrl} className={`${actionBtn} ml-2 border-gray-300 dark:border-gray-600`}>
                      {capturing[acc._id] ? "Capturing..." : "Capture baseline"}
                    </button>}
                    {!acc.profileUrl && <p className="mt-1">A public profile URL is required.</p>}
                    {baselineMessages[acc._id] && <p role={baselineMessages[acc._id].type === "error" ? "alert" : "status"} className="mt-1">{baselineMessages[acc._id].text}</p>}
                  </td>
                  <td className="py-2">
                    <StatusSelect
                      aria-label={`Status for ${acc.username || acc.userId || acc.name1 || "account"}`}
                      value={acc.status}
                      onChange={(e) => changeStatus(acc._id, e.target.value)}
                      className={selectStatus}
                    >
                      <option value="working">Working</option>
                      <option value="suspicious">Suspicious</option>
                      <option value="not_working">Not Working</option>
                    </StatusSelect>
                  </td>

                  <td className="py-2 text-right pr-2">
                    <button
                      onClick={() => setDeleteId(acc._id)}
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
