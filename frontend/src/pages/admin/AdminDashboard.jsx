import { useEffect, useState } from "react";
import API from "../../services/api";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employees: 0,
    instagram: [],
    reddit: [],
    quora: [],
    bhw: [],
    tasks: [],
  });

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [empRes, igRes, rdRes, quRes, bhwRes, taskRes] = await Promise.all([
        API.get("/admin/employees"),
        API.get("/instagram-accounts/all"),
        API.get("/reddit-accounts/all"),
        API.get("/quora-accounts/all"),
        API.get("/bhw-accounts/all"),
        API.get("/platform-tasks"),
      ]);

      setStats({
        employees: empRes.data.length,
        instagram: igRes.data || [],
        reddit: rdRes.data || [],
        quora: quRes.data || [],
        bhw: bhwRes.data || [],
        tasks: taskRes.data || [],
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  /* ================== CALCULATIONS ================== */

  const totalAccounts =
    stats.instagram.length +
    stats.reddit.length +
    stats.quora.length +
    stats.bhw.length;

  const countStatus = (arr, status) =>
    arr.filter((a) => a.status === status).length;

  const totalWorking =
    countStatus(stats.instagram, "working") +
    countStatus(stats.reddit, "working") +
    countStatus(stats.quora, "working") +
    countStatus(stats.bhw, "working");

  const totalSuspicious =
    countStatus(stats.instagram, "suspicious") +
    countStatus(stats.reddit, "suspicious") +
    countStatus(stats.quora, "suspicious") +
    countStatus(stats.bhw, "suspicious");

  const totalNotWorking =
    countStatus(stats.instagram, "not_working") +
    countStatus(stats.reddit, "not_working") +
    countStatus(stats.quora, "not_working") +
    countStatus(stats.bhw, "not_working");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-white text-xl">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Dashboard</h2>
        <button
          onClick={fetchStats}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
        >
          Refresh
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard title="Employees" value={stats.employees} />
        <StatCard title="Total Accounts" value={totalAccounts} />
        <StatCard title="Daily Tasks" value={stats.tasks.length} />
        <StatCard title="Keywords" value="Coming Soon" />
      </div>

      {/* PLATFORM OVERVIEW */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-4">
          Platform Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard title="Instagram" value={stats.instagram.length} />
          <StatCard title="Reddit" value={stats.reddit.length} />
          <StatCard title="Quora" value={stats.quora.length} />
          <StatCard title="BHW" value={stats.bhw.length} />
        </div>
      </section>

      {/* ACCOUNT HEALTH */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-4">
          Account Health
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <HealthCard title="Working" value={totalWorking} type="green" />
          <HealthCard
            title="Suspicious"
            value={totalSuspicious}
            type="yellow"
          />
          <HealthCard title="Not Working" value={totalNotWorking} type="red" />
        </div>
      </section>
    </div>
  );
}

/* ================== COMPONENTS ================== */

function StatCard({ title, value }) {
  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded p-5 text-white">
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  );
}

function HealthCard({ title, value, type }) {
  const styles = {
    green: "bg-green-500/15 text-green-300",
    yellow: "bg-yellow-400/20 text-yellow-300",
    red: "bg-red-500/15 text-red-300",
  };

  return (
    <div className={`rounded p-5 ${styles[type]}`}>
      <p className="text-sm mb-1">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  );
}
