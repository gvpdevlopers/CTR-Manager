import { useEffect, useState } from "react";
import API from "../../services/api";

export default function EmployeeDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    working: 0,
    suspicious: 0,
    notWorking: 0,
  });

  const [recentAccounts, setRecentAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= NORMALIZER ================= */

  const normalizeAccount = (acc, platform) => ({
    _id: acc._id,
    platform,
    status: acc.status,
    createdAt: acc.createdAt,
    displayName:
      acc.username || // Instagram
      acc.userId || // Reddit / Quora
      acc.name || // BHW
      acc.name1 || // fallback
      "Unnamed",
  });

  /* ================= FETCH DASHBOARD ================= */

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [ig, reddit, quora, bhw] = await Promise.all([
        API.get("/instagram-accounts"),
        API.get("/reddit-accounts"),
        API.get("/quora-accounts"),
        API.get("/bhw-accounts"),
      ]);

      const allAccounts = [
        ...(ig.data || []).map((a) => normalizeAccount(a, "Instagram")),
        ...(reddit.data || []).map((a) => normalizeAccount(a, "Reddit")),
        ...(quora.data || []).map((a) => normalizeAccount(a, "Quora")),
        ...(bhw.data || []).map((a) => normalizeAccount(a, "BHW")),
      ];

      setStats({
        total: allAccounts.length,
        working: allAccounts.filter((a) => a.status === "working").length,
        suspicious: allAccounts.filter((a) => a.status === "suspicious").length,
        notWorking: allAccounts.filter((a) => a.status === "not_working")
          .length,
      });

      setRecentAccounts(
        allAccounts
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      );
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Dashboard
      </h2>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Accounts" value={stats.total} />
        <StatCard label="Working" value={stats.working} color="green" />
        <StatCard label="Suspicious" value={stats.suspicious} color="yellow" />
        <StatCard label="Not Working" value={stats.notWorking} color="red" />
      </div>

      {/* ================= ACCOUNTS OVERVIEW ================= */}
      <div className="rounded p-5 border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Accounts Overview
        </h3>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : recentAccounts.length === 0 ? (
          <p className="text-gray-500">No accounts found.</p>
        ) : (
          <ul className="space-y-2">
            {recentAccounts.map((acc) => (
              <li
                key={acc._id}
                className="flex justify-between items-center px-4 py-2 rounded bg-gray-100 dark:bg-gray-700/40"
              >
                <div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {acc.displayName}
                  </p>
                  <p className="text-xs text-gray-500">{acc.platform}</p>
                </div>
                <StatusBadge status={acc.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ================= RECENT ACTIVITY ================= */}
      <div className="rounded p-5 border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Recent Activity
        </h3>

        {recentAccounts.length === 0 ? (
          <p className="text-gray-500">No recent activity.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentAccounts.map((acc) => (
              <li key={acc._id} className="text-gray-700 dark:text-gray-300">
                • {acc.platform} account{" "}
                <span className="font-medium">{acc.displayName}</span> marked as{" "}
                <span className="capitalize font-medium">
                  {acc.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ label, value, color }) {
  const colorMap = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <div className="rounded p-4 border bg-white dark:bg-gray-800">
      <p className="text-sm text-gray-600">{label}</p>
      <p
        className={`text-2xl font-bold ${
          color ? colorMap[color] : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    working: "bg-green-100 text-green-700",
    suspicious: "bg-yellow-100 text-yellow-800",
    not_working: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        map[status] || "bg-gray-200"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
