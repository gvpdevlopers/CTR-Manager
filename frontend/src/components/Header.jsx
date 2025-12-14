import { Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../contexts/AuthContext";

export default function Header({ setIsOpen }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 shadow">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Menu className="w-6 h-6 dark:text-white" />
        </button>

        <h1 className="font-semibold dark:text-white">
          Welcome, {user?.fullName}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={logout}
          className="px-3 py-1 text-sm border rounded dark:text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
