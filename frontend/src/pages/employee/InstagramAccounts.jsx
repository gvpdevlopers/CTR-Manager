import { useEffect, useState } from "react";
import API from "../../services/api";

export default function InstagramAccounts() {
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
      const res = await API.get("/instagram-accounts/me");
      setAccounts(res.data || []);
    } catch (err) {
      alert("Failed to load Instagram accounts");
    } finally {
      setLoading(false);
    }
  };

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
    // ✅ HARD STOP: do not call API again
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
    } catch (err) {
      // ✅ 400 = already marked → silently accept
      if (err.response?.status === 400) {
        setCtrDoneMap((prev) => ({
          ...prev,
          [accountId]: true,
        }));
        return;
      }

      console.error("CTR ERROR:", err);
    }
  };

  /* ======================
     FILTER
  ====================== */
  const filteredAccounts = accounts.filter((acc) =>
    (acc.username || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ======================
     COUNTS (MATCH DB VALUES)
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
      <h2 className="text-2xl font-bold text-white">Instagram Accounts</h2>

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
        placeholder="Search by username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-1/3 p-2 rounded bg-gray-900 text-gray-200 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* TABLE */}
      <div className="bg-gray-800 rounded shadow overflow-x-auto">
        <table className="w-full text-sm text-gray-200">
          <thead>
            <tr className="border-b border-gray-700 text-gray-300">
              <th className="py-2 px-3 text-left">Sr</th>
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Username</th>
              <th className="py-2 px-3 text-left">Password</th>
              <th className="py-2 px-3 text-left">Link</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-center">CTR Done</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-gray-400">
                  No Instagram accounts found
                </td>
              </tr>
            ) : (
              filteredAccounts.map((acc, index) => (
                <tr
                  key={acc._id}
                  className="border-b border-gray-700 hover:bg-gray-700/40 transition"
                >
                  <td className="py-2 px-3">{index + 1}</td>
                  <td className="py-2 px-3">{acc.name || "—"}</td>
                  <td className="py-2 px-3">{acc.username}</td>
                  <td className="py-2 px-3">{acc.password}</td>
                  <td className="py-2 px-3 truncate max-w-xs">
                    {acc.link || "—"}
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={acc.status} // must match DB value exactly
                      onChange={async (e) => {
                        const newStatus = e.target.value;

                        try {
                          await API.patch(
                            `/instagram-accounts/${acc._id}/toggle`,
                            {
                              status: newStatus,
                            }
                          );

                          setAccounts((prev) =>
                            prev.map((a) =>
                              a._id === acc._id
                                ? { ...a, status: newStatus }
                                : a
                            )
                          );
                        } catch (err) {
                          alert("Failed to update status");
                        }
                      }}
                      className="bg-gray-900 text-gray-200 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="working">Working</option>
                      <option value="suspicious">Suspicious</option>
                      <option value="not_working">Not Working</option>
                    </select>
                  </td>

                  {/* CTR CHECKBOX */}
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
