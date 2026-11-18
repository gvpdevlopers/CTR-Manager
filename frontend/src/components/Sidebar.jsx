import { isVisiblePlatform, REDDIT_CTR_ENABLED } from "../config/platforms";
import BrandLogo from "./BrandLogo";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, Users, UserPlus, ListChecks, Tags, Database, CircleGauge, ChevronDown, Instagram, X } from "lucide-react";

const platforms = [ ["instagram", "Instagram"], ["reddit", "Reddit"], ["quora", "Quora"], ["bhw", "BlackHatWorld"] ];

function PlatformIcon({ platform }) {
  return <span className={`platform-nav-icon platform-nav-${platform}`} aria-hidden="true">
    {platform === "instagram" && <Instagram size={17} strokeWidth={1.8} />}
    {platform === "reddit" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 8 1.4-4.4 3.4.8"/><circle cx="18.3" cy="4.7" r="1.2"/>
      <path d="M5.1 12.1a2.1 2.1 0 0 1 2.1-3.5C8.5 7.8 10.2 7.4 12 7.4s3.5.4 4.8 1.2a2.1 2.1 0 0 1 2.1 3.5c.1.4.1.7.1 1.1 0 3-3.1 5.2-7 5.2s-7-2.2-7-5.2c0-.4 0-.7.1-1.1Z"/>
      <circle cx="9.1" cy="12.5" r=".7" fill="currentColor" stroke="none"/><circle cx="14.9" cy="12.5" r=".7" fill="currentColor" stroke="none"/><path d="M9.1 15.1c1.4 1.1 4.4 1.1 5.8 0"/>
    </svg>}
    {platform === "quora" && <span className="platform-quora-mark">Q</span>}
    {platform === "bhw" && <span className="platform-bhw-mark">BHW</span>}
  </span>;
}
export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();
  const admin = user?.role === "admin";
  const root = admin ? "/admin" : "/employee";
  const link = (to, label, icon, end = false) => <NavLink key={to} to={to} end={end} onClick={() => setIsOpen(false)} className={({isActive}) => `nav-link${isActive ? " active" : ""}`}>{icon}<span>{label}</span></NavLink>;
  const platformLink = (key, name, ctr = false) => link(`${root}/${key}${ctr ? "-ctr" : ""}`, name, <PlatformIcon platform={key} />);
  return <aside id="main-navigation" className={`app-sidebar ${isOpen ? "is-open" : ""}`}>
    <div className="sidebar-brand"><BrandLogo /><span><strong>CTR Monitor</strong><small>WORKSPACE</small></span><button className="sidebar-close icon-button" onClick={() => setIsOpen(false)} aria-label="Close navigation"><X size={19}/></button></div>
    <nav className="sidebar-nav sidebar-scroll" aria-label="Main navigation">
      <div className="nav-label">WORKSPACE</div>
      {link(root, "Overview", <LayoutDashboard size={18}/>, true)}
      {admin && <details className="nav-section" open>
        <summary className="nav-label nav-section-toggle"><CircleGauge size={14}/> CTR MONITORING <ChevronDown className="nav-section-chevron" size={15}/></summary>
        {platforms.filter(([key]) => isVisiblePlatform(key) && (key !== "reddit" || REDDIT_CTR_ENABLED)).map(([key,name]) => platformLink(key, name, true))}
      </details>}
      {admin && link(`${root}/employees`, "Employees", <Users size={18}/>)}
      {link(`${root}/add-accounts`, "Add accounts", <UserPlus size={18}/>)}
      <details className="nav-section" open>
        <summary className="nav-label nav-section-toggle"><Database size={14}/> PLATFORM ACCOUNTS <ChevronDown className="nav-section-chevron" size={15}/></summary>
        {platforms.filter(([key]) => isVisiblePlatform(key)).map(([key,name]) => platformLink(key, name))}
      </details>
      <div className="nav-label">MANAGEMENT</div>
      {link(`${root}/tasks`, "Daily tasks", <ListChecks size={18}/>)}
      {link(`${root}/keywords`, "Keywords", <Tags size={18}/>)}
      {!admin && link(`${root}/accounts`, "My accounts", <Users size={18}/>)}
    </nav>
    <div className="sidebar-footer"><span className="status-dot"/>CTR workspace <span aria-hidden="true">&middot;</span> {admin ? "Admin" : "Employee"}</div>
  </aside>;
}
