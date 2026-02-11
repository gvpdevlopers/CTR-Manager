import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();

  const [ctrOpen, setCtrOpen] = useState(true);
  const [dbOpen, setDbOpen] = useState(true);
  const [employeeAccountsOpen, setEmployeeAccountsOpen] = useState(true);

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded transition-colors
     ${
       isActive
         ? "bg-blue-600 text-white"
         : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
     }`;

  return (
    <div
      className={`fixed md:relative z-50 top-0 left-0 h-screen w-64
      bg-white dark:bg-gray-900
      border-r border-gray-200 dark:border-gray-700
      shadow-lg transform
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      md:translate-x-0 transition-transform duration-300`}
    >
      <div
        className="p-4 text-lg font-bold sticky top-0 z-10
        bg-white dark:bg-gray-900
        text-gray-900 dark:text-white
        border-b border-gray-200 dark:border-gray-700"
      >
        CTR Monitor
      </div>

      <nav className="p-4 flex flex-col gap-2 text-sm overflow-y-auto h-[calc(100vh-64px)] sidebar-scroll">
        {user?.role === "admin" && (
          <>
            <NavLink to="/admin" end className={linkClass}>
              Dashboard
            </NavLink>

            <NavLink to="/admin/employees" className={linkClass}>
              Employees
            </NavLink>

           <NavLink to="/admin/add-accounts" className={linkClass}>
              Add Accounts
            </NavLink>

            {/* ================= CTR CHECK DROPDOWN ================= */}
            <button
              onClick={() => setCtrOpen(!ctrOpen)}
              className="text-left px-3 py-2  text-gray-600 dark:text-gray-300 hover:text-blue-600"
            >
              CTR Check {ctrOpen ? "▾" : "▸"}
            </button>

            {ctrOpen && (
              <div className="ml-3 flex flex-col gap-1">
                <NavLink to="/admin/instagram-ctr" className={linkClass}>
                  Instagram CTR
                </NavLink>
                <NavLink to="/admin/reddit-ctr" className={linkClass}>
                  Reddit CTR
                </NavLink>
                <NavLink to="/admin/quora-ctr" className={linkClass}>
                  Quora CTR
                </NavLink>
                <NavLink to="/admin/bhw-ctr" className={linkClass}>
                  BHW CTR
                </NavLink>
              </div>
            )}

            {/* ================= DATABASE DROPDOWN ================= */}
            <button
              onClick={() => setDbOpen(!dbOpen)}
              className="text-left px-3 py-2  text-gray-600 dark:text-gray-300 hover:text-blue-600"
            >
              Database {dbOpen ? "▾" : "▸"}
            </button>

            {dbOpen && (
              <div className="ml-3 flex flex-col gap-1">
                <NavLink to="/admin/instagram" className={linkClass}>
                  Instagram Accounts
                </NavLink>
                <NavLink to="/admin/reddit" className={linkClass}>
                  Reddit Accounts
                </NavLink>
                <NavLink to="/admin/quora" className={linkClass}>
                  Quora Accounts
                </NavLink>
                <NavLink to="/admin/bhw" className={linkClass}>
                  BHW Accounts
                </NavLink>
              </div>
            )}

            <NavLink to="/admin/tasks" className={linkClass}>
              Daily Tasks
            </NavLink>

            <NavLink to="/admin/keywords" className={linkClass}>
              Keywords
            </NavLink>
          </>
        )}

        {/* Employee Section */}
        {user?.role === "employee" && (
          <>
            <NavLink to="/employee" end className={linkClass}>
              Dashboard
            </NavLink>

            <NavLink to="/employee/add-accounts" className={linkClass}>
              Add Accounts
            </NavLink>

            {/* ================= PLATFORM ACCOUNTS DROPDOWN ================= */}
            <button
              onClick={() => setEmployeeAccountsOpen(!employeeAccountsOpen)}
              className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600"
            >
              Platform Accounts {employeeAccountsOpen ? "▾" : "▸"}
            </button>

            {employeeAccountsOpen && (
              <div className="ml-3 flex flex-col gap-1">
                <NavLink to="/employee/instagram" className={linkClass}>
                  Instagram Accounts
                </NavLink>

                <NavLink to="/employee/reddit" className={linkClass}>
                  Reddit Accounts
                </NavLink>

                <NavLink to="/employee/quora" className={linkClass}>
                  Quora Accounts
                </NavLink>

                <NavLink to="/employee/bhw" className={linkClass}>
                  BHW Accounts
                </NavLink>
              </div>
            )}

            <NavLink to="/employee/tasks" className={linkClass}>
              Daily Tasks
            </NavLink>

            <NavLink to="/employee/keywords" className={linkClass}>
              Keywords
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
}
