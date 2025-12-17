import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        p-2 rounded-full
        bg-gray-200 hover:bg-gray-300
        dark:bg-gray-700 dark:hover:bg-gray-600
        border border-gray-300 dark:border-gray-600
        transition
        flex items-center justify-center
      "
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme === "dark" ? (
        <SunIcon
          className="h-5 w-5 text-yellow-400 transition-transform duration-300 rotate-0 hover:rotate-12
"
        />
      ) : (
        <MoonIcon
          className="h-5 w-5 text-gray-800 dark:text-gray-200 transition-transform duration-300 rotate-0 hover:rotate-12
"
        />
      )}
    </button>
  );
}
