import { useEffect, useState } from "react";
import API from "../../services/api";

export default function QuoraAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [ctrDoneMap, setCtrDoneMap] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ======================
     FETCH ACCOUNTS
  ====================== */
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/quora-accounts/me");
      setAccounts(res.data || []);
    } catch {
      alert("Failed to load Quora accounts");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     FETCH TODAY CTR
  ====================== */
  const fetchTodayCtr = async () => {
    try {
      const res = await API.get("/ctr/today");
      const map = {};
      res.data.forEach((row) => {
        map[row.accountId] = true;
      });
      setCtrDoneMap(map);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchTodayCtr();
  }, []);

  /* ======================
     MARK CTR DONE
  ====================== */
  const markCtrDone = async (accountId) => {
    if (ctrDoneMap[accountId]) return;

    try {
      await API.post("/ctr/mark-done", {
        accountId,
        date: new Date().toISOString().slice(0, 10),
      });

      setCtrDoneMap((prev) => ({
        ...prev,
        [accountId]: true,
      }));
    } catch {
      // already handled backend-side (idempotent)
      setCtrDoneMap((prev) => ({
        ...prev,
        [accountId]: true,
      }));
    }
  };

  /* ======================
     STATUS CHANGE
  ====================== */
  const changeStatus = async (id, status) => {
    try {
      await API.put(`/quora-accounts/${id}`, { status });
      setAccounts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a))
      );
    } catch {
      alert("Status update failed");
    }
  };

  /* ======================
     FILTER
  ====================== */
  const q = search.toLowerCase();
  const filtered = accounts.filter((acc) => {
    return (
      acc.userId?.toLowerCase().includes(q) ||
      acc.name1?.toLowerCase().includes(q) ||
      acc.email1?.toLowerCase().includes(q) ||
      acc.name2?.toLowerCase().includes(q) ||
      acc.email2?.toLowerCase().includes(q)
    );
  });

  /* ======================
     COUNTS
  ====================== */
  const total = accounts.length;
  const working = accounts.filter((a) => a.status === "working").length;
  const suspicious = accounts.filter((a) => a.status === "suspicious").length;
  const notWorking = accounts.filter((a) => a.status === "not_working").length;

  /* ======================
     UI
  ====================== */
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Quora Accounts</h2>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-500/20 text-blue-300 p-3 rounded font-semibold">
          Total: {total}
        </div>
        <div className="bg-green-500/20 text-green-300 p-3 rounded font-semibold">
          Working: {working}
        </div>
        <div className="bg-yellow-500/20 text-yellow-300 p-3 rounded font-semibold">
          Suspicious: {suspicious}
        </div>
        <div className="bg-red-500/20 text-red-300 p-3 rounded font-semibold">
          Not Working: {notWorking}
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search by User ID, Name or Email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-1/2 p-2 rounded bg-gray-900 text-gray-200 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* TABLE */}
      <div className="bg-gray-800 rounded shadow overflow-x-auto">
        <table className="w-full text-sm text-gray-200">
          <thead>
            <tr className="border-b border-gray-700 text-gray-300">
              <th className="py-2 px-3">Sr</th>
              <th className="py-2 px-3">User ID</th>
              <th className="py-2 px-3">Name 1</th>
              <th className="py-2 px-3">Email 1</th>
              <th className="py-2 px-3">Pass 1</th>
              <th className="py-2 px-3">Name 2</th>
              <th className="py-2 px-3">Email 2</th>
              <th className="py-2 px-3">Pass 2</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-center">CTR Done</th>
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
                  No Quora accounts found
                </td>
              </tr>
            ) : (
              filtered.map((acc, i) => (
                <tr
                  key={acc._id}
                  className="border-b border-gray-700 hover:bg-gray-700/40 transition"
                >
                  <td className="py-2 px-3">{i + 1}</td>
                  <td className="py-2 px-3">{acc.userId}</td>
                  <td className="py-2 px-3">{acc.name1}</td>
                  <td className="py-2 px-3">{acc.email1}</td>
                  <td className="py-2 px-3">{acc.password1}</td>
                  <td className="py-2 px-3">{acc.name2 || "—"}</td>
                  <td className="py-2 px-3">{acc.email2 || "—"}</td>
                  <td className="py-2 px-3">{acc.password2 || "—"}</td>

                  {/* STATUS */}
                  <td className="py-2 px-3">
                    <select
                      value={acc.status}
                      onChange={(e) => changeStatus(acc._id, e.target.value)}
                      className="bg-gray-900 text-gray-200 border border-gray-700 rounded px-2 py-1 text-xs"
                    >
                      <option value="working">Working</option>
                      <option value="suspicious">Suspicious</option>
                      <option value="not_working">Not Working</option>
                    </select>
                  </td>

                  {/* CTR */}
                  <td className="py-2 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={ctrDoneMap[acc._id] === true}
                      disabled={
                        ctrDoneMap[acc._id] === true ||
                        acc.status === "not_working"
                      }
                      onChange={() => markCtrDone(acc._id)}
                      className="w-4 h-4 accent-green-500 cursor-pointer disabled:opacity-50"
                      title={
                        acc.status === "not_working"
                          ? "Account not working"
                          : ctrDoneMap[acc._id]
                          ? "CTR already marked"
                          : "Mark CTR done"
                      }
                    />
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
