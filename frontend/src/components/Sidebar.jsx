import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded ${
      isActive ? "bg-blue-600 text-white" : "hover:bg-gray-700 text-white"
    }`;

  return (
    <div
      className={`fixed md:relative z-50 top-0 left-0 h-screen w-64 
  bg-gray-900 shadow-lg transform overflow-y-auto 
  ${isOpen ? "translate-x-0" : "-translate-x-full"} 
  md:translate-x-0 transition-transform duration-300`}
    >
      <div className="p-4 text-lg font-bold border-b text-white sticky top-0 bg-gray-900 z-10">
        CTR Monitor
      </div>

      <nav className="p-4 flex flex-col gap-2 text-sm">
        {/*  ADMIN LINKS */}
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

        {/*  EMPLOYEE LINKS */}
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
