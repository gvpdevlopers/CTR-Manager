import StatusSelect from "../../components/StatusSelect";
import { validateAccount } from "../../utils/accountValidation";
import { BHW_ENABLED } from "../../config/platforms";
import { useEffect, useState } from "react";
import API from "../../services/api";

/* ================= INPUT / SELECT CLASSES ================= */

const inputClass =
  "w-full rounded px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "bg-white text-gray-900 border-gray-300 placeholder-gray-400 " +
  "dark:bg-gray-900 dark:text-white dark:border-gray-600 dark:placeholder-gray-500";

const selectClass =
  "rounded px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "bg-white text-gray-900 border-gray-300 " +
  "dark:bg-gray-900 dark:text-white dark:border-gray-600";

export default function AdminAddAccounts() {
  const [platform, setPlatform] = useState("instagram");
  const [form, setForm] = useState({});
  const [bulkText, setBulkText] = useState("");
  const [bulkResult, setBulkResult] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [bulkErrors, setBulkErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState(null);

  /* ================= TOAST AUTO HIDE ================= */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ================= HELPERS ================= */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => setForm({});

  const showToast = (type, text) => setToast({ type, text });

  const getApiUrl = () => {
    if (platform === "instagram") return "/instagram-accounts";
    if (platform === "reddit") return "/reddit-accounts";
    if (platform === "quora") return "/quora-accounts";
    if (platform === "bhw") return "/bhw-accounts";
  };

  /* ================= SINGLE ADD ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateAccount(platform, form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      setLoading(true);

      const payload = { ...form };

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

  /* ================= BULK ADD ================= */
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

  /* ================= UI ================= */
  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* TITLE */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Add CTR Accounts
      </h2>

      {/* PLATFORM SELECT */}
      <StatusSelect
        aria-label="Platform"
        value={platform}
        onChange={(e) => {
          setPlatform(e.target.value);
          resetForm();
        }}
        className={selectClass}
      >
        <option value="instagram">Instagram</option>
        <option value="reddit">Reddit</option>
        <option value="quora">Quora</option>
        {BHW_ENABLED && <option value="bhw">BHW</option>}
      </StatusSelect>

      {/* SINGLE ADD */}
      <form
        onSubmit={handleSubmit}
        className={`p-5 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          ${loading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <h3 className="md:col-span-2 font-semibold text-gray-900 dark:text-white">
          Add Platform Account (Single)
        </h3>

        {Object.keys(fieldErrors).length > 0 && <ul role="alert" className="md:col-span-2 text-sm text-red-700 dark:text-red-300">{Object.entries(fieldErrors).map(([field, message]) => <li key={field}>{message}</li>)}</ul>}
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
              name="userId"
              value={form.userId || ""}
              onChange={handleChange}
              placeholder="User ID"
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

        {platform === "quora" && <input name="profileUrl" placeholder="Public Quora profile URL (optional)" aria-label="Public Quora profile URL" value={form.profileUrl || ""} onChange={handleChange} className={inputClass} />}

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
          className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          {loading ? "Adding..." : "Add Account"}
        </button>
      </form>

      {/* BULK ADD */}
      <div
        className={`p-5 rounded shadow space-y-3
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          ${loading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Bulk Paste (Google Sheet Style)
        </h3>

        {bulkErrors.length > 0 && <ul role="alert" className="text-sm text-red-700 dark:text-red-300">{bulkErrors.map((message, index) => <li key={index}>{message}</li>)}</ul>}
        {bulkResult && <p role="status" className="text-sm text-gray-700 dark:text-gray-200">{bulkResult}</p>}
        <textarea
          rows="6"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Paste comma separated rows..."
          className="w-full rounded p-3 border focus:outline-none focus:ring-2 focus:ring-blue-500
            bg-white text-gray-900 border-gray-300 placeholder-gray-400
            dark:bg-gray-900 dark:text-white dark:border-gray-600 dark:placeholder-gray-500"
        />

        <button
          onClick={handleBulkAdd}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {loading ? "Uploading..." : "Bulk Upload"}
        </button>
      </div>

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2 rounded shadow-lg text-white
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
