import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();

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
      {/* Navigation */}
      <nav className="p-4 flex flex-col gap-2 text-sm overflow-y-auto h-[calc(100vh-64px)] sidebar-scroll">
        {/* ADMIN LINKS */}
        {user?.role === "admin" && (
          <>
            <NavLink to="/admin" end className={linkClass}>
              Dashboard
            </NavLink>

            <NavLink to="/admin/employees" className={linkClass}>
              Employees
            </NavLink>

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

            <NavLink to="/admin/add-accounts" className={linkClass}>
              Add Accounts
            </NavLink>

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

            <NavLink to="/admin/tasks" className={linkClass}>
              Daily Tasks
            </NavLink>

            <NavLink to="/admin/keywords" className={linkClass}>
              Keywords
            </NavLink>
          </>
        )}

        {/* EMPLOYEE LINKS */}
        {user?.role === "employee" && (
          <>
            <NavLink to="/employee" end className={linkClass}>
              Dashboard
            </NavLink>

            <NavLink to="/employee/add-accounts" className={linkClass}>
              Add Accounts
            </NavLink>

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
