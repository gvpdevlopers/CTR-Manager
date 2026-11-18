import BrandLogo from "./BrandLogo";
import { Menu, LogOut, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../contexts/AuthContext";

export default function Header({ setIsOpen }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const current = pathname.split("/").filter(Boolean).pop();
  const title = !current || current === "admin" || current === "employee" ? "Overview" : current.replace(/-/g, " ");
  const name = user?.fullName || user?.username || "Account";
  return <header className="app-header"><div className="header-start"><button className="icon-button menu-button" onClick={() => setIsOpen(true)} aria-label="Open navigation" aria-controls="main-navigation"><Menu size={20}/></button><BrandLogo className="header-brand"/><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{title}</strong></div></div><div className="header-actions"><ThemeToggle/><div className="header-user"><span className="avatar">{name.charAt(0).toUpperCase()}</span><span className="header-user-text"><strong>{name}</strong><small>{user?.role}</small></span></div><button onClick={logout} className="icon-button logout-button" aria-label="Log out" title="Log out"><LogOut size={18}/></button></div></header>;
}
