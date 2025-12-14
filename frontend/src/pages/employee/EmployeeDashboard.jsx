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

  // 🔹 Fetch Instagram accounts (employee-owned)
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const res = await API.get("/instagram-accounts/me");
      const accounts = res.data || [];

      setStats({
        total: accounts.length,
        working: accounts.filter((a) => a.status === "working").length,
        suspicious: accounts.filter((a) => a.status === "suspicious").length,
        notWorking: accounts.filter((a) => a.status === "not_working").length,
      });

      // last 5 accounts (recent activity simulation)
      setRecentAccounts(accounts.slice(-5).reverse());
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
      {/* TITLE */}
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>

      {/* ================= STATS ROW ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Accounts" value={stats.total} />
        <StatCard label="Working" value={stats.working} color="green" />
        <StatCard label="Suspicious" value={stats.suspicious} color="yellow" />
        <StatCard label="Not Working" value={stats.notWorking} color="red" />
      </div>

      {/* ================= ACCOUNTS OVERVIEW ================= */}
      <div className="bg-white/5 rounded p-5">
        <h3 className="text-lg font-semibold text-white mb-3">
          Accounts Overview
        </h3>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : recentAccounts.length === 0 ? (
          <p className="text-gray-400">No accounts found.</p>
        ) : (
          <ul className="space-y-2">
            {recentAccounts.map((acc) => (
              <li
                key={acc._id}
                className="flex justify-between items-center bg-black/30 px-4 py-2 rounded"
              >
                <span className="text-white">{acc.username || "Unnamed"}</span>

                <StatusBadge status={acc.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ================= RECENT ACTIVITY (OPTIONAL) ================= */}
      <div className="bg-white/5 rounded p-5">
        <h3 className="text-lg font-semibold text-white mb-3">
          Recent Activity
        </h3>

        {recentAccounts.length === 0 ? (
          <p className="text-gray-400">No recent activity.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentAccounts.map((acc) => (
              <li key={acc._id} className="text-gray-300">
                • Account <span className="text-white">{acc.username}</span>{" "}
                marked as <span className="capitalize">{acc.status}</span>
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
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
  };

  return (
    <div className="bg-white/10 rounded p-4">
      <p className="text-sm text-gray-300">{label}</p>
      <p
        className={`text-2xl font-bold ${
          color ? colorMap[color] : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    working: "bg-green-600",
    suspicious: "bg-yellow-500 text-black",
    not_working: "bg-red-600",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium text-white ${
        map[status] || "bg-gray-600"
      }`}
    >
      {status?.replace("_", " ")}
    </span>
  );
}
