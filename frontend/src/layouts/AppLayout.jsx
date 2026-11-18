import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);
  return <div className="app-shell">
    <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
    {isOpen && <button className="sidebar-backdrop" onClick={() => setIsOpen(false)} aria-label="Close navigation" />}
    <div className="app-main"><Header setIsOpen={setIsOpen} /><main className="app-content"><Outlet /></main></div>
  </div>;
}
