import { useEffect, useState } from "react";
import API from "../../services/api";

const RETRY_COOLDOWN_SECONDS = 10 * 60; // fallback (10 min)

export default function AdminBhwCTR() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    done: 0,
    partial: 0,
    failed: 0,
    pending: 0,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    fetchBhwCTR();
  }, []);

  const fetchBhwCTR = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/bhw/dashboard");
      setRows(res.data.rows || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      if (err.response?.data?.cooldown) {
        alert("Retry cooldown active.");
      } else {
        alert("Retry did not change status.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (bhwAccountId) => {
    try {
      setRetryingId(bhwAccountId);

      await API.post(
        `/admin/bhw/run/${bhwAccountId}`,
        {},
        { timeout: 120000 }, // 🔒 2 minutes
      );

      await fetchBhwCTR();
    } catch (err) {
      if (err.response?.status === 429) {
        alert("Retry cooldown active. Please wait.");
      } else {
        alert(
          err.response?.data?.error ||
            "Retry failed. Please wait, Selenium may still be running.",
        );
      }
    } finally {
      setRetryingId(null);
    }
  };

  const filteredRows = rows.filter((row) => {
    const q = search.toLowerCase();
    const matchesSearch = row.username?.toLowerCase().includes(q);

    let rowStatus = row.status;
    if (row.status === "not_done" && row.error) rowStatus = "failed";

    const matchesStatus = statusFilter === "all" || rowStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusStyles = {
    done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    pending: "bg-gray-200 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300",
  };

  const getDisplayStatus = (row) => {
    if (row.status === "done_manual") return "done";
    if (row.status === "not_done" && row.error) return "failed";
    return row.status;
  };

  const getCooldownRemaining = (row) => {
    if (!row.lastRetryAt) return 0;

    if (row.cooldownRemainingSeconds !== undefined) {
      return row.cooldownRemainingSeconds;
    }

    const diff =
      RETRY_COOLDOWN_SECONDS * 1000 -
      (Date.now() - new Date(row.lastRetryAt).getTime());

    return Math.max(0, Math.ceil(diff / 1000));
  };

  const formatCooldown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          BHW CTR Monitor
        </h1>

        <button
          onClick={fetchBhwCTR}
          className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="Total" value={summary.total} />
        <SummaryCard label="Done" value={summary.done} color="green" />
        <SummaryCard label="Partial" value={summary.partial} color="blue" />
        <SummaryCard label="Failed" value={summary.failed} color="red" />
        <SummaryCard label="Pending" value={summary.pending} />
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 rounded-lg border bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-1/4 px-4 py-2 rounded-lg border bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
        >
          <option value="all">All Status</option>
          <option value="done">Done</option>
          <option value="partial">Partial</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Messages</th>
              <th className="px-4 py-3 text-center">Reactions</th>
              <th className="px-4 py-3 text-center">CTR Done By</th>
              <th className="px-4 py-3 text-center">Time</th>
              <th className="px-4 py-3 text-center">Retries</th>
              <th className="px-4 py-3">Last Retry</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y dark:divide-gray-700 text-gray-700 dark:text-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-10 text-gray-500 dark:text-gray-400"
                >
                  No records found
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => {
                const cooldown = getCooldownRemaining(row);
                const displayStatus = getDisplayStatus(row);

                const showRetry =
                  row.canRetry &&
                  displayStatus !== "pending" &&
                  displayStatus !== "done";

                return (
                  <tr
                    key={row._id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800/60"
                  >
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{row.username}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[displayStatus]}`}
                      >
                        {displayStatus.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {`${row.delta?.messages ?? 0} / 2`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.snapshot?.reactionScore ?? 0}
                    </td>

                    <td className="px-4 py-3">{row.ctrDoneBy || "—"}</td>

                    <td className="px-4 py-3 text-xs text-gray-400">
                      {row.ctrDoneAt
                        ? new Date(row.ctrDoneAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.retryCount ?? 0}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {row.lastRetryAt
                        ? new Date(row.lastRetryAt).toLocaleString()
                        : "—"}
                    </td>

                    {/* <td className="px-4 py-3 text-center">
                      {canRetry ? (
                        <button
                          onClick={() => handleRetry(row.bhwAccountId)}
                          disabled={retryingId === row.bhwAccountId}
                          className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {retryingId === row.bhwAccountId
                            ? "Retrying..."
                            : "Retry"}
                        </button>
                      ) : cooldown > 0 ? (
                        <span className="text-xs text-gray-400">
                          Cooldown ({formatCooldown(cooldown)})
                        </span>
                      ) : (
                        "—"
                      )}
                    </td> */}
                    <td className="px-4 py-3 text-center">
                      {row.canRetry ? (
                        <button
                          onClick={() => handleRetry(row.bhwAccountId)}
                          disabled={retryingId === row.bhwAccountId}
                          className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {retryingId === row.bhwAccountId
                            ? "Retrying..."
                            : "Retry"}
                        </button>
                      ) : row.status === "pending" ? (
                        <span className="text-xs text-gray-400">
                          Waiting for Selenium
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colors = {
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="p-4 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm">
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p
        className={`text-2xl font-semibold ${colors[color] || "text-gray-900 dark:text-gray-100"}`}
      >
        {value ?? 0}
      </p>
    </div>
  );
}
