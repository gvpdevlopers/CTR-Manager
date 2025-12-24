// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanUsername = username.trim();
    const cleanPassword = password.replace(/\s/g, "");

    const res = await login({
      username: cleanUsername,
      password: cleanPassword,
    });

    setLoading(false);

    if (res.ok) {
      if (res.user.role === "admin") navigate("/admin");
      else navigate("/employee");
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <div
      className="
      min-h-screen flex items-center justify-center 
      px-4
      bg-gradient-to-br 
      from-gray-100 to-gray-300
      dark:from-gray-900 dark:via-gray-800 dark:to-black
    "
    >
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        {/* APP BRAND */}
        <h1 className="text-3xl font-extrabold mb-2 text-center text-blue-600">
          CTR Monitor
        </h1>

        {/* SUBTITLE */}
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
          Secure Login to your Dashboard
        </p>

        {/* ERROR BOX */}
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* USERNAME */}
        <input
          type="text"
          placeholder="Enter your username"
          className="w-full p-2.5 mb-4 border rounded-lg bg-transparent 
            text-gray-900 dark:text-white 
            placeholder-gray-500 dark:placeholder-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-600"
          onChange={(e) => setUsername(e.target.value)}
          value={username}
          required
        />

        {/* PASSWORD WITH TOGGLE */}
        <div className="relative mb-5">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="w-full p-2.5 border rounded-lg bg-transparent
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-300
              focus:outline-none focus:ring-2 focus:ring-blue-600"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />

          {/* Eye Icon */}
          <div
            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 dark:text-gray-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </div>
        </div>

        {/* LOGIN BUTTON WITH LOADING STATE */}
        <button
          disabled={loading}
          className={`
            w-full py-2.5 rounded-lg font-semibold text-white
            transition 
            ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              Logging in...
            </div>
          ) : (
            "Login"
          )}
        </button>

        {/* FOOTER TEXT */}
        <p className="text-xs text-center text-gray-400 mt-5">
          Authorized Access Only • Internal System
        </p>
      </form>
    </div>
  );
}
