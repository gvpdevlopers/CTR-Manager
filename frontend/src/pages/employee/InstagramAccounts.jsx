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
      const res = await API.get("/instagram-accounts");
      setAccounts(res.data || []);
    } catch {
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
        map[row.accountId.toString()] = true;
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
        platform: "instagram",
      });

      setCtrDoneMap((prev) => ({ ...prev, [accountId]: true }));
    } catch (err) {
      console.error("CTR ERROR:", err.response?.data || err.message);
    }
  };

  /* ======================
     FILTER + COUNTS
  ====================== */
  const filteredAccounts = accounts.filter((acc) =>
    (acc.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = accounts.length;
  const working = accounts.filter((a) => a.status === "working").length;
  const suspicious = accounts.filter((a) => a.status === "suspicious").length;
  const notWorking = accounts.filter((a) => a.status === "not_working").length;

  /* ======================
     STYLES
  ====================== */
  const card =
    "rounded border p-3 font-semibold bg-white border-gray-200 " +
    "dark:bg-gray-800 dark:border-gray-700";

  const input =
    "p-2 rounded border w-full md:w-1/3 bg-white text-gray-900 placeholder-gray-400 " +
    "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 " +
    "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500";

  const tableWrap =
    "rounded border overflow-x-auto bg-white border-gray-200 " +
    "dark:bg-gray-800 dark:border-gray-700";

  /* ======================
     UI
  ====================== */
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Instagram Accounts
      </h2>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${card} text-blue-600 dark:text-blue-400`}>
          Total: {total}
        </div>
        <div className={`${card} text-green-600 dark:text-green-400`}>
          Working: {working}
        </div>
        <div className={`${card} text-yellow-600 dark:text-yellow-400`}>
          Suspicious: {suspicious}
        </div>
        <div className={`${card} text-red-600 dark:text-red-400`}>
          Not Working: {notWorking}
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search by username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={input}
      />

      {/* TABLE */}
      <div className={tableWrap}>
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr className="text-gray-700 dark:text-gray-100">
              <th className="py-2 px-3 text-left">Sr</th>
              <th>User ID</th>
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Username</th>
              <th className="py-2 px-3 text-left">Password</th>
              <th className="py-2 px-3 text-left">Link</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-center">CTR Done</th>
            </tr>
          </thead>

          <tbody className="text-gray-800 dark:text-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-gray-500">
                  No Instagram accounts found
                </td>
              </tr>
            ) : (
              filteredAccounts.map((acc, index) => (
                <tr
                  key={acc._id}
                  className="
          border-t border-gray-200 dark:border-gray-700
          hover:bg-gray-100 dark:hover:bg-gray-700/60
        "
                >
                  <td className="py-2 px-3">{index + 1}</td>
                  <td className="py-2 px-3">{acc.userId || "—"}</td>
                  <td className="py-2 px-3">{acc.name || "—"}</td>
                  <td className="py-2 px-3">{acc.username}</td>
                  <td className="py-2 px-3">{acc.password}</td>
                  <td className="py-2 px-3 truncate max-w-xs">
                    {acc.link || "—"}
                  </td>

                  {/* STATUS */}
                  <td className="py-2 px-3">
                    <select
                      value={acc.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        try {
                          await API.patch(
                            `/instagram-accounts/${acc._id}/toggle`,
                            { status: newStatus }
                          );
                          setAccounts((prev) =>
                            prev.map((a) =>
                              a._id === acc._id
                                ? { ...a, status: newStatus }
                                : a
                            )
                          );
                        } catch {
                          alert("Failed to update status");
                        }
                      }}
                      className="
                        bg-white text-gray-900 border border-gray-300
                        rounded px-2 py-1 text-xs
                        focus:outline-none focus:ring-1 focus:ring-blue-500
                        dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700
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
                      className="w-4 h-4 accent-green-600 disabled:opacity-50"
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
