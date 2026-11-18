import { BHW_ENABLED, isVisiblePlatform } from "../../config/platforms";
import { useEffect, useState } from "react";
import API from "../../services/api";
import { Users, Layers3, ListChecks, Tags, RefreshCw, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employees: 0,
    instagram: [],
    reddit: [],
    quora: [],
    bhw: [],
    tasks: [],
    keywords: [],
  });

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [empRes, igRes, rdRes, quRes, bhwRes, taskRes, keywordRes] =
        await Promise.all([
          API.get("/admin/employees"),
          API.get("/instagram-accounts"),
          API.get("/reddit-accounts"),
          API.get("/quora-accounts"),
          BHW_ENABLED ? API.get("/bhw-accounts") : Promise.resolve({ data: [] }),
          API.get("/platform-tasks"),
          API.get("/keywords"),
        ]);

      setStats({
        employees: empRes.data.length,
        instagram: igRes.data || [],
        reddit: rdRes.data || [],
        quora: quRes.data || [],
        bhw: bhwRes.data || [],
        tasks: (taskRes.data || []).filter((item) => isVisiblePlatform(item.platform)),
        keywords: (keywordRes.data || []).filter((item) => isVisiblePlatform(item.platform)),
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

  if (loading) return <div className="dashboard-loading" role="status">Loading dashboard...</div>;
  const overview = [
    {label:"Employees", value:stats.employees, icon:<Users size={18}/>, note:"Team members"},
    {label:"Total accounts", value:totalAccounts, icon:<Layers3 size={18}/>, note:"Across all platforms"},
    {label:"Daily tasks", value:stats.tasks.length, icon:<ListChecks size={18}/>, note:"Tasks in workspace"},
    {label:"Keywords", value:stats.keywords.length, icon:<Tags size={18}/>, note:"Available keywords"},
  ];
  const platforms = [ ["Instagram",stats.instagram.length,"instagram"], ["Reddit",stats.reddit.length,"reddit"], ["Quora",stats.quora.length,"quora"], ["BlackHatWorld",stats.bhw.length,"bhw"] ].filter(([, , platform]) => isVisiblePlatform(platform));
  return <div className="dashboard-page">
    <div className="dashboard-heading"><div><span className="eyebrow">WORKSPACE OVERVIEW</span><h2>Dashboard</h2><p>A snapshot of your team and platform accounts.</p></div><button onClick={fetchStats} className="dashboard-refresh"><RefreshCw size={15}/> Refresh</button></div>
    <div className="dashboard-stats">{overview.map(({label,value,icon,note}) => <div className="metric-card" key={label}><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong>{value}</strong><small>{note}</small></div>)}</div>
    <div className="dashboard-grid"><section className="dashboard-panel"><div className="panel-heading"><div><h3>Platform overview</h3><p>Accounts across your connected platforms</p></div><span className="panel-count">{totalAccounts} total</span></div><div className="platform-list">{platforms.map(([name,count,path]) => <Link to={`/admin/${path}`} key={path} className="platform-row"><span className={`platform-symbol platform-${path}`}>{name.charAt(0)}</span><span className="platform-name"><strong>{name}</strong><small>Platform accounts</small></span><span className="platform-count">{count}</span><ArrowUpRight size={16}/></Link>)}</div></section>
    <section className="dashboard-panel"><div className="panel-heading"><div><h3>Account health</h3><p>Current status across all platforms</p></div></div><div className="health-total"><strong>{totalAccounts}</strong><span>Total accounts</span></div><div className="health-list">{[["Working",totalWorking,"good"],["Suspicious",totalSuspicious,"warning"],["Not working",totalNotWorking,"bad"]].map(([label,value,type]) => <div className="health-row" key={label}><span><i className={`health-dot ${type}`}/>{label}</span><strong>{value}</strong></div>)}</div></section></div>
  </div>;
}
