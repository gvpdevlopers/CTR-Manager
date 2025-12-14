// src/pages/employee/AddAccounts.jsx
import { useEffect, useState } from "react";
import API from "../../services/api";

export default function AddAccounts() {
  const [platform, setPlatform] = useState("instagram");
  const [form, setForm] = useState({});
  const [bulkText, setBulkText] = useState("");
  const [loading, setLoading] = useState(false);

  // toast state: { type: 'success'|'error', text: '...' } or null
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // 🔁 Handle form change dynamically
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Get API based on platform
  const getApiUrl = () => {
    if (platform === "instagram") return "/instagram-accounts";
    if (platform === "reddit") return "/reddit-accounts";
    if (platform === "quora") return "/quora-accounts";
    if (platform === "bhw") return "/bhw-accounts";
  };

  // small helper: show toast
  const showToast = (type, text) => {
    setToast({ type, text });
  };

  // small validation per platform (basic)
  const validateSingle = () => {
    if (platform === "instagram") {
      return form.name && form.username;
    }
    if (platform === "reddit" || platform === "quora") {
      return form.userId && (form.email1 || form.name1);
    }
    if (platform === "bhw") {
      return form.userId && (form.email || form.name);
    }
    return true;
  };

  // ✅ SINGLE ADD
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateSingle()) {
      showToast("error", "Please fill required fields before submitting.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post(getApiUrl(), form);
      setLoading(false);
      setForm({});
      showToast("success", "Account added successfully");
    } catch (err) {
      setLoading(false);
      showToast("error", "Failed to add account");
      console.error(err);
    }
  };

  // ✅ BULK ADD
  const handleBulkAdd = async () => {
    if (!bulkText.trim()) {
      showToast("error", "Paste some data first");
      return;
    }

    const rows = bulkText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
    setLoading(true);

    try {
      for (let row of rows) {
        const values = row.split(",").map((v) => v.trim());

        let payload = {};

        // ✅ Instagram: name,username,password,link
        if (platform === "instagram") {
          const [name, username, password, link] = values;
          payload = { name, username, password, link };
        }

        // ✅ Reddit / Quora:
        // userId,name1,email1,pass1,name2,email2,pass2
        if (platform === "reddit" || platform === "quora") {
          const [userId, name1, email1, password1, name2, email2, password2] =
            values;

          payload = {
            userId,
            name1,
            email1,
            password1,
            name2,
            email2,
            password2,
          };
        }

        // ✅ BHW: userId,name,email,password,link
        if (platform === "bhw") {
          const [userId, name, email, password, link] = values;
          payload = { userId, name, email, password, link };
        }

        await API.post(getApiUrl(), payload);
      }

      setLoading(false);
      setBulkText("");
      showToast("success", "Bulk upload successful");
    } catch (err) {
      setLoading(false);
      showToast("error", "Bulk upload failed");
      console.error(err);
    }
  };

  // Tailwind-friendly input classes used across all inputs
  const inputClass =
    "w-full p-2 border rounded bg-transparent text-white placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const textareaClass =
    "w-full p-2 border rounded bg-transparent text-white placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADING */}
      <h2 className="text-2xl font-bold dark:text-white">Add Accounts</h2>

      {/* PLATFORM SELECT */}
      <div>
        <select
          value={platform}
          onChange={(e) => {
            setPlatform(e.target.value);
            setForm({});
          }}
          className="p-2 border rounded bg-gray-800 text-white 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="instagram" className="text-black bg-white">
            Instagram
          </option>
          <option value="reddit" className="text-black bg-white">
            Reddit
          </option>
          <option value="quora" className="text-black bg-white">
            Quora
          </option>
          <option value="bhw" className="text-black bg-white">
            BHW
          </option>
        </select>
      </div>

      {/* SINGLE ADD FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 dark:bg-gray-800 p-5 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <h3 className="md:col-span-2 font-semibold dark:text-white">
          Add Platform Account (Single)
        </h3>

        {/* Instagram */}
        {platform === "instagram" && (
          <>
            <input
              name="name"
              placeholder="Name"
              className={inputClass}
              onChange={handleChange}
              value={form.name || ""}
            />
            <input
              name="username"
              placeholder="Username"
              className={inputClass}
              onChange={handleChange}
              value={form.username || ""}
            />
            <input
              name="password"
              placeholder="Password"
              className={inputClass}
              onChange={handleChange}
              value={form.password || ""}
            />
            <input
              name="link"
              placeholder="Profile Link"
              className={inputClass}
              onChange={handleChange}
              value={form.link || ""}
            />
          </>
        )}

        {/* Reddit / Quora */}
        {(platform === "reddit" || platform === "quora") && (
          <>
            <input
              name="userId"
              placeholder="User ID"
              className={inputClass}
              onChange={handleChange}
              value={form.userId || ""}
            />

            <input
              name="name1"
              placeholder="Name 1"
              className={inputClass}
              onChange={handleChange}
              value={form.name1 || ""}
            />
            <input
              name="email1"
              placeholder="Email 1"
              className={inputClass}
              onChange={handleChange}
              value={form.email1 || ""}
            />
            <input
              name="password1"
              placeholder="Password 1"
              className={inputClass}
              onChange={handleChange}
              value={form.password1 || ""}
            />

            <input
              name="name2"
              placeholder="Name 2"
              className={inputClass}
              onChange={handleChange}
              value={form.name2 || ""}
            />
            <input
              name="email2"
              placeholder="Email 2"
              className={inputClass}
              onChange={handleChange}
              value={form.email2 || ""}
            />
            <input
              name="password2"
              placeholder="Password 2"
              className={inputClass}
              onChange={handleChange}
              value={form.password2 || ""}
            />
          </>
        )}

        {/* BHW */}
        {platform === "bhw" && (
          <>
            <input
              name="userId"
              placeholder="User ID"
              className={inputClass}
              onChange={handleChange}
              value={form.userId || ""}
            />
            <input
              name="name"
              placeholder="Name"
              className={inputClass}
              onChange={handleChange}
              value={form.name || ""}
            />
            <input
              name="email"
              placeholder="Email"
              className={inputClass}
              onChange={handleChange}
              value={form.email || ""}
            />
            <input
              name="password"
              placeholder="Password"
              className={inputClass}
              onChange={handleChange}
              value={form.password || ""}
            />
            <input
              name="link"
              placeholder="Profile Link"
              className={inputClass}
              onChange={handleChange}
              value={form.link || ""}
            />
          </>
        )}

        <button
          disabled={loading}
          className="cursor-pointer md:col-span-2 bg-blue-600 text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add Account"}
        </button>
      </form>

      {/* BULK ADD */}
      <div className="bg-white/5 dark:bg-gray-800 p-5 rounded shadow space-y-3">
        <h3 className="font-semibold dark:text-white">
          Bulk Paste (Google Sheet Style)
        </h3>

        <textarea
          rows="6"
          className={textareaClass}
          placeholder="Paste comma-separated data here..."
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
        />

        <button
          onClick={handleBulkAdd}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Uploading..." : "Bulk Upload"}
        </button>
      </div>

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-2 rounded shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {/* icon */}
          <span
            className={`inline-block w-6 h-6 flex items-center justify-center rounded ${
              toast.type === "success" ? "bg-green-800" : "bg-red-800"
            }`}
            aria-hidden
          >
            {toast.type === "success" ? "✅" : "❌"}
          </span>

          <div className="font-medium text-sm">{toast.text}</div>

          <button
            onClick={() => setToast(null)}
            className="ml-3 opacity-80 hover:opacity-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
