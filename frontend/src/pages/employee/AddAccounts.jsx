// src/pages/employee/AddAccounts.jsx
import { useEffect, useState } from "react";
import API from "../../services/api";

export default function AddAccounts() {
  const [platform, setPlatform] = useState("instagram");
  const [form, setForm] = useState({});
  const [bulkText, setBulkText] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getApiUrl = () => {
    if (platform === "instagram") return "/instagram-accounts";
    if (platform === "reddit") return "/reddit-accounts";
    if (platform === "quora") return "/quora-accounts";
    if (platform === "bhw") return "/bhw-accounts";
  };

  const showToast = (type, text) => setToast({ type, text });

  const validateSingle = () => {
    if (platform === "instagram") return form.name && form.username;
    if (platform === "reddit" || platform === "quora")
      return form.userId && (form.email1 || form.name1);
    if (platform === "bhw") return form.userId && (form.email || form.name);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateSingle()) {
      showToast("error", "Please fill required fields.");
      return;
    }

    try {
      setLoading(true);
      await API.post(getApiUrl(), form);
      setForm({});
      showToast("success", "Account added successfully");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to add account");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) {
      showToast("error", "Paste some data first");
      return;
    }

    const rows = bulkText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      setLoading(true);

      for (const row of rows) {
        const v = row.split(",").map((x) => x.trim());
        let payload = {};

        if (platform === "instagram") {
          const [name, username, password, link] = v;
          payload = { name, username, password, link };
        }

        if (platform === "reddit" || platform === "quora") {
          const [userId, name1, email1, password1, name2, email2, password2] =
            v;
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

        if (platform === "bhw") {
          const [userId, name, email, password, link] = v;
          payload = { userId, name, email, password, link };
        }

        await API.post(getApiUrl(), payload);
      }

      setBulkText("");
      showToast("success", "Bulk upload successful");
    } catch (err) {
      console.error(err);
      showToast("error", "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= STYLES ================= */

  const inputClass =
    "w-full p-2 rounded border bg-white text-gray-900 placeholder-gray-400 " +
    "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 " +
    "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500";

  const textareaClass =
    "w-full p-2 rounded border bg-white text-gray-900 placeholder-gray-400 " +
    "border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 " +
    "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500";

  return (
    <div className="max-w-full space-y-2">
      {/* TITLE */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Add Accounts
      </h2>

      {/* PLATFORM SELECT */}
      <select
        value={platform}
        onChange={(e) => {
          setPlatform(e.target.value);
          setForm({});
        }}
        className={inputClass + " w-48"}
      >
        <option value="instagram">Instagram</option>
        <option value="reddit">Reddit</option>
        <option value="quora">Quora</option>
        <option value="bhw">BHW</option>
      </select>

      {/* SINGLE ADD */}
      <form
        onSubmit={handleSubmit}
        className="p-5 rounded border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <h3 className="md:col-span-2 font-semibold text-gray-900 dark:text-gray-100">
          Add Platform Account (Single)
        </h3>

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
          className="md:col-span-2 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add Account"}
        </button>
      </form>

      {/* BULK ADD */}
      <div className="p-5 rounded border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
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
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Bulk Upload"}
        </button>
      </div>

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2 rounded shadow text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
