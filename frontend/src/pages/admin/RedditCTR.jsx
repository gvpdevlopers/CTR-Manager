import { useEffect, useState } from "react";
import StatusSelect from "../../components/StatusSelect";
import API from "../../services/api";
import useVerificationRun from "../../hooks/useVerificationRun";

const statusStyles = {
  done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  suspicious: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  not_done: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
  unavailable: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};
const labels = { done: "Done", suspicious: "Suspicious", not_done: "Not Done", pending: "Pending", unavailable: "Unavailable" };
const formatDate = (value) => value ? new Date(value).toLocaleString() : "—";

export default function RedditCTR() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchCTRStatus = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const { data } = await API.get("/admin/reddit/ctr-status");
      setRows(data.rows || []);
      setSummary(data.summary || {});
    } catch {
      setLoadError("Unable to load Reddit results. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const { run, error: runError, starting, start, refresh } = useVerificationRun(
    "/admin/reddit/verification-status", "/admin/reddit/verify-now", fetchCTRStatus,
  );
  useEffect(() => { fetchCTRStatus(); }, []);
  const filtered = rows.filter((row) => {
    const q = search.trim().toLowerCase();
    return (statusFilter === "all" || row.status === statusFilter) &&
      [row.usernames?.user1, row.usernames?.user2, row.ctrDoneBy, row.userId]
        .some((value) => String(value || "").toLowerCase().includes(q));
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Reddit CTR Monitor</h1>
        <div className="flex gap-2">
          <button onClick={fetchCTRStatus} className="px-4 py-2 rounded bg-gray-600 text-white">Refresh</button>
          <button onClick={() => { if (window.confirm("Verify Reddit CTR now?")) start(); }} disabled={starting || run.status === "running" || run.status === "loading" || !!runError} className="px-4 py-2 rounded bg-blue-600 text-white">Verify Now</button>
        </div>
      </div>
      {loadError && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">{loadError} <button type="button" onClick={fetchCTRStatus} className="underline">Retry</button></div>}
      <div role="status" className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
        {runError ? <span>{runError} <button type="button" className="underline" onClick={refresh}>Retry</button></span> : run.status === "running" ? "Verification is running. Results will refresh when it finishes." : run.status === "completed" ? "The last verification run finished. Review each account's result below." : run.status === "failed" ? (run.error || "The last verification run failed.") : run.status === "loading" ? "Checking verification status..." : "No verification run has started yet."}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">Automatic verification runs at 11:00 PM IST. Verify Now checks pending claims and retries unavailable results; completed checks are skipped.</p>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[ ["total", "Total"], ["done", "Done"], ["suspicious", "Suspicious"], ["not_done", "Not Done"], ["pending", "Pending"], ["unavailable", "Unavailable"] ].map(([key, label]) => (
          <div key={key} className="p-4 rounded-lg bg-white dark:bg-gray-900 border dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
            <p className={`text-2xl font-semibold ${key === "done" ? "text-green-600 dark:text-green-400" : key === "suspicious" ? "text-yellow-600 dark:text-yellow-400" : key === "not_done" ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}>{summary[key] ?? 0}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <input aria-label="Search username or employee" placeholder="Search username or employee..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full md:w-1/3 px-4 py-2 rounded-lg border bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" />
        <StatusSelect aria-label="Verification status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full md:w-1/4 px-4 py-2 rounded-lg border bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
          <option value="all">All Status</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </StatusSelect>
      </div>
      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100"><tr>
            <th className="px-4 py-3 text-left">Usernames</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-center">Comments (24h)</th><th className="px-4 py-3 text-center">Posts (15d)</th><th className="px-4 py-3 text-left">CTR Done By</th><th className="px-4 py-3 text-left">Marked at</th><th className="px-4 py-3 text-left">Verified at</th>
          </tr></thead>
          <tbody className="divide-y dark:divide-gray-700 text-gray-700 dark:text-gray-200">
            {loading ? <tr><td colSpan="7" className="text-center py-6">Loading...</td></tr> : filtered.length === 0 ? <tr><td colSpan="7" className="text-center py-10 text-gray-500">No records found</td></tr> : filtered.map((row, index) => {
              const status = row.status || "pending";
              const observed = status !== "pending" && status !== "unavailable" && row.actual;
              return <tr key={row.ctrCheckId || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3"><div className="font-medium">{row.usernames?.user1 || "—"}</div><div className="text-xs text-gray-500 dark:text-gray-300">{row.usernames?.user2 || ""}</div></td>
                <td className="px-4 py-3"><span className={`inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || statusStyles.pending}`}>{labels[status] || status.replaceAll("_", " ")}</span>{(row.error || row.failureReasons?.length > 0) && <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{row.error || row.failureReasons.join(", ")}</p>}</td>
                <td className="px-4 py-3 text-center">{observed && row.actual.comments24h != null && row.actual.commentsRequired != null ? `${row.actual.comments24h} / ${row.actual.commentsRequired}` : "—"}</td>
                <td className="px-4 py-3 text-center">{observed ? (row.actual.postValidTill ? "1 / 1" : "0 / 1") : "—"}</td>
                <td className="px-4 py-3">{row.ctrDoneBy || "—"}</td><td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-300">{formatDate(row.markedAt || row.clickedAt)}</td><td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-300">{formatDate(row.verifiedAt || row.lastVerifiedAt)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
