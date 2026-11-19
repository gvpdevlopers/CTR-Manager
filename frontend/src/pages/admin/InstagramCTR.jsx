import StatusSelect from "../../components/StatusSelect";
import { useEffect, useState } from "react";
import API from "../../services/api";
import useVerificationRun from "../../hooks/useVerificationRun";

export default function InstagramCTR() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    done: 0,
    suspicious: 0,
    not_done: 0,
    pending: 0,
    unavailable: 0,
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { run, error: runError, starting, start: startVerification, refresh: refreshRun } = useVerificationRun("/admin/instagram/verification-status", "/admin/instagram/verify-now", () => fetchInstagramCTR());
  const verifyNow = () => { if (window.confirm("Verify Instagram CTR now?")) startVerification(); };

  /* =========================
     FETCH DATA
  ========================= */
  const fetchInstagramCTR = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await API.get("/admin/instagram/dashboard");
      setRows(res.data.rows || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error("Failed to load Instagram CTR data", err);
      setLoadError("Unable to load Instagram results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstagramCTR();
  }, []);



  /* =========================
     FILTER LOGIC
  ========================= */
  const filteredRows = rows.filter((row) => {
    const q = search.toLowerCase();

    const matchesSearch =
      row.username?.toLowerCase().includes(q) ||
      row.ctrDoneBy?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || row.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  /* =========================
     STATUS STYLES
  ========================= */
  const statusStyles = {
    done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    suspicious:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    not_done: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    pending: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
    unavailable: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Instagram CTR Monitor
        </h1>

        <div>
          <button
            onClick={fetchInstagramCTR}
            className="px-4 py-2 mr-2 rounded bg-gray-600 text-white cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={verifyNow}
            disabled={starting || run.status === "running" || run.status === "loading" || !!runError}
            className="px-4 py-2 rounded bg-blue-600 text-white cursor-pointer"
          >
            Verify Now
          </button>
        </div>
      </div>

      {loadError && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">{loadError} <button type="button" onClick={fetchInstagramCTR} className="underline">Retry</button></div>}
      <div role="status" className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
        {runError ? <span>{runError} <button type="button" className="underline" onClick={refreshRun}>Retry</button></span> : run.status === "running" ? "Verification is running. Results will refresh when it finishes." : run.status === "completed" ? "The last verification run finished. Review each account's result below." : run.status === "failed" ? (run.error || "The last verification run failed.") : run.status === "loading" ? "Checking verification status..." : "No verification run has started since the server restarted."}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">Automatic verification runs at 11:00 PM IST. Verify Now checks pending claims and retries unavailable results after 15 minutes; completed checks are skipped.</p>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <SummaryCard label="Total" value={summary.total} />
        <SummaryCard label="Done" value={summary.done} color="green" />
        <SummaryCard
          label="Suspicious"
          value={summary.suspicious}
          color="yellow"
        />
        <SummaryCard label="Not Done" value={summary.not_done} color="red" />
        <SummaryCard label="Pending" value={summary.pending} />
        <SummaryCard label="Unavailable" value={summary.unavailable} />
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search username or employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 rounded-lg border 
             bg-white text-gray-900 
             dark:bg-gray-900 dark:text-gray-100 
             dark:border-gray-700"
        />

        <StatusSelect
          aria-label="Verification status filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-1/4 px-4 py-2 rounded-lg border 
             bg-white text-gray-900 
             dark:bg-gray-900 dark:text-gray-100 
             dark:border-gray-700"
        >
          <option value="all">All Status</option>
          <option value="done">Done</option>
          <option value="suspicious">Suspicious</option>
          <option value="not_done">Not Done</option>
          <option value="pending">Pending</option>
          <option value="unavailable">Unavailable</option>
        </StatusSelect>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <tr>
              <th className="px-4 py-3">Sr</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Following (24h)</th>
              <th className="px-4 py-3 text-center">Posts (15d)</th>
              <th className="px-4 py-3">CTR Done By</th>
              <th className="px-4 py-3">Marked at</th>
              <th className="px-4 py-3">Verified at</th>
            </tr>
          </thead>

          <tbody className="divide-y dark:divide-gray-700 text-gray-700 dark:text-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => (
                <tr
                  key={row._id || index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {row.username}
                  </td>

                  {/* STATUS + REASONS */}
                  <td className="px-4 py-3">
                    <span
                      className={`relative group inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold ${
                        statusStyles[row.status]
                      }`}
                    >
                      {row.status.replaceAll("_", " ").toUpperCase()}


                    </span>
                    {row.failureReasons?.length > 0 && <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{row.failureReasons.join(", ")}</p>}
                  </td>

                  {/* <td className="px-4 py-3 text-center">{row.following}</td> */}
                  <td className="px-4 py-3 text-center">
                    {row.following == null ? "?" : row.following > 0 ? `+${row.following}` : row.following}
                  </td>
                  <td className="px-4 py-3 text-center">{row.posts ?? "?"}</td>

                  <td className="px-4 py-3">{row.ctrDoneBy || "—"}</td>

                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-300">{row.markedAt ? new Date(row.markedAt).toLocaleString() : "?"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-300">
                    {row.verifiedAt
                      ? new Date(row.verifiedAt).toLocaleString()
                      : "—"}
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

/* =========================
   SMALL COMPONENT
========================= */
function SummaryCard({ label, value, color }) {
  const colors = {
    green: "text-green-600 dark:text-green-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    red: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p
        className={`text-2xl font-semibold ${
          colors[color] || "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value ?? 0}
      </p>
    </div>
  );
}
