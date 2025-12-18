import { useEffect, useState } from "react";
import API from "../../services/api"; // your axios instance

export default function RedditCTR() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  /* =========================
     FETCH DATA
  ========================= */
  const fetchCTRStatus = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/reddit/ctr-status");
      setData(res.data || []);
    } catch (err) {
      console.error("Failed to load Reddit CTR data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCTRStatus();
  }, []);

  /* =========================
     FILTER LOGIC
  ========================= */
  const filteredData = data.filter((row) => {
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;

    const matchesSearch =
      row.usernames.user1.toLowerCase().includes(search.toLowerCase()) ||
      row.usernames.user2.toLowerCase().includes(search.toLowerCase()) ||
      row.clickedBy?.name?.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  /* =========================
     VERIFY NOW
  ========================= */

  const verifyNow = async () => {
    if (!window.confirm("Verify Reddit CTR now?")) return;

    try {
      setLoading(true);
      await API.post("/admin/reddit/verify-now");
      await fetchCTRStatus(); // refresh table
    } catch {
      alert("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     STATUS STYLES
  ========================= */
  const statusStyles = {
    done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    suspicious:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    not_done: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Reddit CTR Monitor
        </h1>

        <div className="flex gap-2">
          <button
            onClick={fetchCTRStatus}
            className="px-4 py-2 rounded bg-gray-600 text-white"
          >
            Refresh
          </button>

          <button
            onClick={verifyNow}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Verify Now
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search username or employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-1/4 px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
        >
          <option value="all">All Status</option>
          <option value="done">Done</option>
          <option value="suspicious">Suspicious</option>
          <option value="not_done">Not Done</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">Usernames</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Comments</th>
              <th className="px-4 py-3 text-center">Posts</th>
              <th className="px-4 py-3 text-left">CTR Done By</th>
              <th className="px-4 py-3 text-left">Time</th>
            </tr>
          </thead>

          <tbody className="divide-y dark:divide-gray-700 text-gray-800 dark:text-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-10 text-gray-500 dark:text-gray-400"
                >
                  No records found
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr
                  key={row.ctrCheckId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.usernames.user1}</div>
                    <div className="text-xs text-gray-500">
                      {row.usernames.user2}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusStyles[row.status]
                      }`}
                    >
                      {row.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {row.actual?.user1Comments || 0} /{" "}
                    {row.actual?.user2Comments || 0}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {row.actual?.user1Posts || 0} /{" "}
                    {row.actual?.user2Posts || 0}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {row.clickedBy?.name || "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {row.clickedBy?.email}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(row.clickedAt).toLocaleString()}
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
