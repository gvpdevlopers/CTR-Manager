// src/pages/admin/AdminAddAccounts.jsx
import { useEffect, useState } from "react";
import API from "../../services/api";

const inputClass =
  "w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

const selectClass =
  "bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function AdminAddAccounts() {
  const [platform, setPlatform] = useState("instagram");
  const [form, setForm] = useState({});
  const [bulkText, setBulkText] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔔 TOAST STATE
  const [toast, setToast] = useState(null);
  // { type: "success" | "error", text: string }

  /* ===========================
     FETCH EMPLOYEES
  ============================ */
  useEffect(() => {
    API.get("/admin/employees")
      .then((res) => setEmployees(res.data || []))
      .catch(() => setEmployees([]));
  }, []);

  /* ===========================
     TOAST AUTO DISMISS
  ============================ */
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ===========================
     HELPERS
  ============================ */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => setForm({});

  const showToast = (type, text) => {
    setToast({ type, text });
  };

  const getApiUrl = () => {
    if (platform === "instagram") return "/instagram-accounts";
    if (platform === "reddit") return "/reddit-accounts";
    if (platform === "quora") return "/quora-accounts";
    if (platform === "bhw") return "/bhw-accounts";
  };

  /* ===========================
     SINGLE ADD
  ============================ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = { ...form };
      if (!payload.ownerEmployeeId) delete payload.ownerEmployeeId;

      await API.post(getApiUrl(), payload);

      resetForm();
      showToast("success", "Account added successfully");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to add account");
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     BULK ADD
  ============================ */
  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;

    const rows = bulkText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      setLoading(true);

      for (const row of rows) {
        const values = row.split(",").map((v) => v.trim());
        let payload = {};

        if (platform === "instagram") {
          const [name, username, password, link, ownerId] = values;
          payload = { name, username, password, link };
          if (ownerId) payload.ownerEmployeeId = ownerId;
        }

        if (platform === "reddit" || platform === "quora") {
          const [
            userId,
            name1,
            email1,
            password1,
            name2,
            email2,
            password2,
            ownerId,
          ] = values;

          payload = {
            userId,
            name1,
            email1,
            password1,
            name2,
            email2,
            password2,
          };
          if (ownerId) payload.ownerEmployeeId = ownerId;
        }

        if (platform === "bhw") {
          const [userId, name, email, password, link, ownerId] = values;
          payload = { userId, name, email, password, link };
          if (ownerId) payload.ownerEmployeeId = ownerId;
        }

        await API.post(getApiUrl(), payload);
      }

      setBulkText("");
      showToast("success", "Bulk upload completed successfully");
    } catch (err) {
      console.error(err);
      showToast("error", "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     UI
  ============================ */
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">Add CTR Accounts</h2>

      {/* PLATFORM SELECT */}
      <select
        value={platform}
        onChange={(e) => {
          setPlatform(e.target.value);
          resetForm();
        }}
        className={selectClass}
      >
        <option className="bg-white text-black" value="instagram">
          Instagram
        </option>
        <option className="bg-white text-black" value="reddit">
          Reddit
        </option>
        <option className="bg-white text-black" value="quora">
          Quora
        </option>
        <option className="bg-white text-black" value="bhw">
          BHW
        </option>
      </select>

      {/* SINGLE ADD */}
      <form
        onSubmit={handleSubmit}
        className={`bg-gray-800 p-5 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4 ${
          loading ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <h3 className="md:col-span-2 font-semibold text-white">
          Add Platform Account (Single)
        </h3>

        {/* OWNER */}
        <select
          name="ownerEmployeeId"
          value={form.ownerEmployeeId || ""}
          onChange={handleChange}
          className={`${selectClass} md:col-span-2`}
        >
          <option value="">Assign to (optional)</option>
          {employees.map((emp) => (
            <option
              key={emp._id}
              value={emp._id}
              className="bg-white text-black"
            >
              {emp.fullName || emp.username}
            </option>
          ))}
        </select>

        {/* PLATFORM FIELDS */}
        {platform === "instagram" && (
          <>
            <input
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              placeholder="Name"
              className={inputClass}
            />
            <input
              name="username"
              value={form.username || ""}
              onChange={handleChange}
              placeholder="Username"
              className={inputClass}
            />
            <input
              name="password"
              value={form.password || ""}
              onChange={handleChange}
              placeholder="Password"
              className={inputClass}
            />
            <input
              name="link"
              value={form.link || ""}
              onChange={handleChange}
              placeholder="Profile Link"
              className={inputClass}
            />
          </>
        )}

        {(platform === "reddit" || platform === "quora") && (
          <>
            <input
              name="userId"
              value={form.userId || ""}
              onChange={handleChange}
              placeholder="User ID"
              className={inputClass}
            />
            <input
              name="name1"
              value={form.name1 || ""}
              onChange={handleChange}
              placeholder="Name 1"
              className={inputClass}
            />
            <input
              name="email1"
              value={form.email1 || ""}
              onChange={handleChange}
              placeholder="Email 1"
              className={inputClass}
            />
            <input
              name="password1"
              value={form.password1 || ""}
              onChange={handleChange}
              placeholder="Password 1"
              className={inputClass}
            />
            <input
              name="name2"
              value={form.name2 || ""}
              onChange={handleChange}
              placeholder="Name 2"
              className={inputClass}
            />
            <input
              name="email2"
              value={form.email2 || ""}
              onChange={handleChange}
              placeholder="Email 2"
              className={inputClass}
            />
            <input
              name="password2"
              value={form.password2 || ""}
              onChange={handleChange}
              placeholder="Password 2"
              className={inputClass}
            />
          </>
        )}

        {platform === "bhw" && (
          <>
            <input
              name="userId"
              value={form.userId || ""}
              onChange={handleChange}
              placeholder="User ID"
              className={inputClass}
            />
            <input
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              placeholder="Name"
              className={inputClass}
            />
            <input
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              placeholder="Email"
              className={inputClass}
            />
            <input
              name="password"
              value={form.password || ""}
              onChange={handleChange}
              placeholder="Password"
              className={inputClass}
            />
            <input
              name="link"
              value={form.link || ""}
              onChange={handleChange}
              placeholder="Profile Link"
              className={inputClass}
            />
          </>
        )}

        <button
          type="submit"
          className="md:col-span-2 bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded"
        >
          {loading ? "Adding..." : "Add Account"}
        </button>
      </form>

      {/* BULK ADD */}
      <div
        className={`bg-gray-800 p-5 rounded shadow space-y-3 ${
          loading ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <h3 className="font-semibold text-white">
          Bulk Paste (Google Sheet Style)
        </h3>

        <textarea
          rows="6"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Paste comma separated rows..."
          className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleBulkAdd}
          className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded"
        >
          {loading ? "Uploading..." : "Bulk Upload"}
        </button>
      </div>

      {/* 🔔 TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-2 rounded shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span
            className={`w-6 h-6 flex items-center justify-center rounded ${
              toast.type === "success" ? "bg-green-800" : "bg-red-800"
            }`}
          >
            {toast.type === "success" ? "✅" : "❌"}
          </span>

          <span className="text-sm font-medium">{toast.text}</span>

          <button
            onClick={() => setToast(null)}
            className="ml-2 opacity-80 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
