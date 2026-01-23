import { useEffect, useState } from "react";
import API from "../../services/api";

export default function BhwAccounts() {
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
      const res = await API.get("/bhw-accounts");
      setAccounts(res.data || []);
    } catch {
      alert("Failed to load BHW accounts");
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

      setCtrDoneMap((prev) => ({ ...prev, [accountId]: true }));
    } catch {
      // backend is idempotent
      setCtrDoneMap((prev) => ({ ...prev, [accountId]: true }));
    }
  };

  /* ======================
     STATUS CHANGE
  ====================== */
  const changeStatus = async (id, status) => {
    try {
      await API.patch(`/bhw-accounts/${id}/toggle`, { status });
      setAccounts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a)),
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
      acc.name?.toLowerCase().includes(q) ||
      acc.email?.toLowerCase().includes(q)
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
    <div className="space-y-6 p-4">
      {/* TITLE */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        BHW Accounts
      </h2>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 p-3 rounded font-semibold">
          Total: {total}
        </div>
        <div className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 p-3 rounded font-semibold">
          Working: {working}
        </div>
        <div className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 p-3 rounded font-semibold">
          Suspicious: {suspicious}
        </div>
        <div className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 p-3 rounded font-semibold">
          Not Working: {notWorking}
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search by User ID, Name or Email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
          w-full md:w-1/2 p-2 rounded
          bg-white text-gray-900 border border-gray-300
          dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />

      {/* TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr className="text-gray-700 dark:text-gray-100">
              <th className="py-2 px-3 w-12 text-left">Sr</th>
              <th className="py-2 px-3 w-24 text-left">User ID</th>
              <th className="py-2 px-3 w-40 text-left">Name</th>
              <th className="py-2 px-3 w-56 text-left">Email</th>
              <th className="py-2 px-3 w-32 text-left">Password</th>
              <th className="py-2 px-3 w-64 text-left">Link</th>
              <th className="py-2 px-3 w-32 text-center">Status</th>
              <th className="py-2 px-3 w-24 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="text-gray-800 dark:text-gray-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-6 text-center text-gray-400">
                  No BHW accounts found
                </td>
              </tr>
            ) : (
              filtered.map((acc, i) => (
                <tr
                  key={acc._id}
                  className="
                    border-b border-gray-200 dark:border-gray-700
                    hover:bg-gray-100 dark:hover:bg-gray-700/60
                  "
                >
                  <td className="py-2 px-3 whitespace-nowrap">{i + 1}</td>

                  <td className="py-2 px-3 whitespace-nowrap">{acc.userId}</td>

                  <td className="py-2 px-3 truncate max-w-[160px]">
                    {acc.name}
                  </td>

                  <td className="py-2 px-3 truncate max-w-[220px]">
                    {acc.email}
                  </td>

                  <td className="py-2 px-3 truncate max-w-[140px]">
                    {acc.password}
                  </td>

                  <td className="py-2 px-3 truncate max-w-[260px]">
                    {acc.link || "—"}
                  </td>

                  {/* STATUS */}
                  <td className="py-2 px-3">
                    <select
                      value={acc.status}
                      onChange={(e) => changeStatus(acc._id, e.target.value)}
                      className="
                        bg-white text-gray-900 border border-gray-300
                        dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700
                        rounded px-2 py-1 text-xs
                      "
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
