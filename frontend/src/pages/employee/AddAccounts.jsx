import StatusSelect from "../../components/StatusSelect";
import { validateAccount } from "../../utils/accountValidation";
import { BHW_ENABLED } from "../../config/platforms";
// src/pages/employee/AddAccounts.jsx
import { useEffect, useState } from "react";
import API from "../../services/api";

export default function AddAccounts() {
  const [platform, setPlatform] = useState("instagram");
  const [form, setForm] = useState({});
  const [bulkText, setBulkText] = useState("");
  const [bulkResult, setBulkResult] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [bulkErrors, setBulkErrors] = useState([]);
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



  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateAccount(platform, form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;


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
    const rows = bulkText.split("\n").map((row) => row.trim()).filter(Boolean);
    if (!rows.length) { showToast("error", "Paste some data first"); return; }
    setLoading(true);
    const failed = [];
    const details = [];
    let added = 0;
    for (const [index, row] of rows.entries()) {
      const values = row.split(",").map((value) => value.trim());
      let payload;
      if (platform === "instagram") {
        const [name, username, userId, password, link] = values;
        payload = { name, username, userId, password, link };
      } else if (platform === "reddit" || platform === "quora") {
        const [userId, name1, email1, password1, name2, email2, password2] = values;
        payload = { userId, name1, email1, password1, name2, email2, password2 };
      } else {
        const [userId, name, email, password, link] = values;
        payload = { userId, name, email, password, link };
      }
      const errors = validateAccount(platform, payload);
      if (Object.keys(errors).length) { failed.push(row); details.push(`Row ${index + 1}: ${Object.values(errors).join(" ")}`); continue; }
      try { await API.post(getApiUrl(), payload); added++; }
      catch (error) { failed.push(row); details.push(`Row ${index + 1}: ${error.response?.data?.message || "Could not confirm the result; check the account list before retrying."}`); }
    }
    setBulkErrors(details);
    setBulkText(failed.join("\n"));
    setBulkResult(failed.length ? `${added} confirmed added; ${failed.length} could not be confirmed. Only those rows remain. Check the account list before retrying; a timed-out request may have succeeded.` : `${added} account(s) added.`);
    setLoading(false);
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
      <StatusSelect
        aria-label="Platform"
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
        {BHW_ENABLED && <option value="bhw">BHW</option>}
      </StatusSelect>

      {/* SINGLE ADD */}
      <form
        onSubmit={handleSubmit}
        className="p-5 rounded border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <h3 className="md:col-span-2 font-semibold text-gray-900 dark:text-gray-100">
          Add Platform Account (Single)
        </h3>

        {Object.keys(fieldErrors).length > 0 && <ul role="alert" className="md:col-span-2 text-sm text-red-700 dark:text-red-300">{Object.entries(fieldErrors).map(([field, message]) => <li key={field}>{message}</li>)}</ul>}
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
              name="userId"
              placeholder="User ID"
              className={inputClass}
              onChange={handleChange}
              value={form.userId || ""}
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

        {platform === "quora" && <input name="profileUrl" placeholder="Public Quora profile URL (optional)" aria-label="Public Quora profile URL" value={form.profileUrl || ""} onChange={handleChange} className={inputClass} />}

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

        {bulkErrors.length > 0 && <ul role="alert" className="text-sm text-red-700 dark:text-red-300">{bulkErrors.map((message, index) => <li key={index}>{message}</li>)}</ul>}
        {bulkResult && <p role="status" className="text-sm text-gray-700 dark:text-gray-200">{bulkResult}</p>}
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
