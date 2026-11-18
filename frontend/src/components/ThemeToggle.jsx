import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
export default function ThemeToggle() {
 const { theme, setTheme } = useContext(ThemeContext);
 const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
 return <button type="button" className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={label} title={label}>{theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</button>;
}
