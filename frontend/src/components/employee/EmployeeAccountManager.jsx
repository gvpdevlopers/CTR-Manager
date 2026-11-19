import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, RefreshCw, Trash2, X } from "lucide-react";
import API from "../../services/api";
import StatusSelect from "../StatusSelect";
import { validateAccount } from "../../utils/accountValidation";
import { REDDIT_CTR_ENABLED } from "../../config/platforms";

const DETAILS = {
  instagram: { name: "Instagram", fields: [["userId", "User ID"], ["name", "Name"], ["username", "Username"], ["password", "Password"], ["link", "Profile link"]] },
  reddit: { name: "Reddit", fields: [["userId", "User ID"], ["name1", "Name 1"], ["email1", "Email 1"], ["password1", "Password 1"], ["name2", "Name 2"], ["email2", "Email 2"], ["password2", "Password 2"]] },
  quora: { name: "Quora", fields: [["userId", "User ID"], ["name1", "Name 1"], ["email1", "Email 1"], ["password1", "Password 1"], ["name2", "Name 2"], ["email2", "Email 2"], ["password2", "Password 2"], ["profileUrl", "Public profile URL"]] },
};

function AccountDialog({ account, platform, mode, onClose, onSaved }) {
  const dialog = useRef(null);
  const fields = DETAILS[platform].fields;
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(([key]) => [key, account[key] || ""])));
  const [reset, setReset] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const profileChanged = platform === "quora" && values.profileUrl !== (account.profileUrl || "");
  const needsReset = profileChanged && Boolean(account.baselineCapturedAt);
  useEffect(() => { dialog.current?.showModal(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (needsReset && !reset) { setError("Confirm that the existing baseline will be cleared."); return; }
    const changes = Object.fromEntries(fields.filter(([key]) => values[key] !== (account[key] || "")).map(([key]) => [key, values[key]]));
    if (mode === "edit" && !Object.keys(changes).length) { onClose(); return; }
    if (mode === "edit") {
      const allErrors = validateAccount(platform, values);
      const changedErrors = Object.fromEntries(Object.entries(allErrors).filter(([key]) => Object.hasOwn(changes, key)));
      if (Object.keys(changedErrors).length) { setFieldErrors(changedErrors); return; }
    }
    if (needsReset) changes.resetBaseline = true;
    setBusy(true); setError("");
    try {
      if (mode === "delete") await API.delete(`/${platform}-accounts/${account._id}`);
      else await API.put(`/${platform}-accounts/${account._id}`, changes);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.message || `Unable to ${mode === "delete" ? "delete" : "save"} this account. Please try again.`); }
    finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="reset-dialog employee-account-dialog" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={submit}>
      <div className="reset-dialog-header"><span className="reset-dialog-icon">{mode === "delete" ? <Trash2 size={20} /> : <Pencil size={20} />}</span><button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Close"><X size={18} /></button></div>
      <h2>{mode === "delete" ? "Delete shared account?" : `Edit ${DETAILS[platform].name} account`}</h2>
      {mode === "delete" ? <p>This removes the account for the whole team. This action cannot be undone.</p> : <>
        <p>Changes are visible to everyone using this account.</p>
        <div className="employee-account-fields">{fields.map(([key, label]) => <label key={key}>{label}<input value={values[key]} onChange={(event) => { setValues((old) => ({ ...old, [key]: event.target.value })); setFieldErrors((old) => ({ ...old, [key]: "" })); }} aria-invalid={Boolean(fieldErrors[key])} autoComplete="off" />{fieldErrors[key] && <span className="reset-error" role="alert">{fieldErrors[key]}</span>}</label>)}</div>
        {needsReset && <label className="employee-baseline-confirm"><input type="checkbox" checked={reset} onChange={(event) => setReset(event.target.checked)} /> <span>Changing this profile clears its existing baseline. A new baseline must be captured before verification.</span></label>}
      </>}
      {error && <p role="alert" className="reset-error">{error}</p>}
      <div className="reset-dialog-actions"><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "delete" ? "Delete account" : "Save changes"}</button></div>
    </form>
  </dialog>;
}

function AccountValue({ field, value }) {
  if (!value) return "-";
  if (field === "link" || field === "profileUrl") {
    try {
      const url = new URL(value);
      if (url.protocol === "http:" || url.protocol === "https:") value = url.href;
      else return value;
    } catch { /* Display invalid saved URLs as text. */ }
    if (value.startsWith("http://") || value.startsWith("https://")) return <a href={value} target="_blank" rel="noopener noreferrer" className="employee-account-link">{value}</a>;
  }
  return value;
}

export default function EmployeeAccountManager({ platform }) {
  const config = DETAILS[platform];
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claims, setClaims] = useState({});
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [claimError, setClaimError] = useState("");
  const [submitting, setSubmitting] = useState({});
  const [dialog, setDialog] = useState(null);
  const [capturing, setCapturing] = useState({});
  const [baselineMessages, setBaselineMessages] = useState({});
  const claimsEnabled = platform !== "reddit" || REDDIT_CTR_ENABLED;

  const fetchAccounts = useCallback(async () => {
    setLoading(true); setError("");
    try { const { data } = await API.get(`/${platform}-accounts`); setAccounts(data || []); }
    catch { setError(`Unable to load ${config.name} accounts. Please try again.`); }
    finally { setLoading(false); }
  }, [platform, config.name]);
  const fetchClaims = useCallback(async () => {
    if (!claimsEnabled) { setLoadingClaims(false); return; }
    setLoadingClaims(true); setClaimError("");
    try {
      const { data } = await API.get(platform === "reddit" ? "/reddit/ctr/my-today" : "/ctr/today");
      if (!Array.isArray(data)) throw new Error("Invalid response");
      const next = {};
      for (const row of data) {
        if (platform !== "reddit" && row.platform !== platform) continue;
        const id = platform === "reddit" ? (row.redditAccountId?._id || row.redditAccountId) : row.accountId;
        if (id && !next[String(id)]) next[String(id)] = row;
      }
      setClaims(next);
    } catch { setClaimError("Unable to load today's CTR claims. Retry before marking an account."); }
    finally { setLoadingClaims(false); }
  }, [platform, claimsEnabled]);
  useEffect(() => { fetchAccounts(); fetchClaims(); }, [fetchAccounts, fetchClaims]);

  const markDone = async (id) => {
    if (loadingClaims || claimError || claims[id] || submitting[id]) return;
    setSubmitting((old) => ({ ...old, [id]: true }));
    try {
      await API.post(platform === "reddit" ? "/reddit/ctr-done" : "/ctr/mark-done", platform === "reddit" ? { redditAccountId: id } : { accountId: id, platform });
      await fetchClaims();
    } catch (err) {
      if (err.response?.status === 409) await fetchClaims();
      else setClaimError("Unable to confirm that CTR was saved. Reload today's claims and try again.");
    } finally { setSubmitting((old) => ({ ...old, [id]: false })); }
  };
  const changeStatus = async (account, status) => {
    setError("");
    try { const { data } = await API.patch(`/${platform}-accounts/${account._id}/toggle`, { status }); setAccounts((old) => old.map((a) => a._id === account._id ? { ...a, status: data.status } : a)); }
    catch (err) { setError(err.response?.data?.message || "Unable to update status. Please try again."); }
  };
  const captureBaseline = async (account) => {
    if (capturing[account._id] || !account.profileUrl) return;
    setCapturing((old) => ({ ...old, [account._id]: true }));
    setBaselineMessages((old) => ({ ...old, [account._id]: null }));
    try {
      const { data } = await API.post(`/admin/quora-accounts/${account._id}/capture-baseline`, null, { timeout: 180000 });
      if (!data.success) throw new Error(data.message || "Baseline capture failed.");
      setBaselineMessages((old) => ({ ...old, [account._id]: { text: data.message || "Baseline captured.", error: false } }));
      await fetchAccounts();
    } catch (err) {
      const text = err.code === "ECONNABORTED" ? "The request timed out; capture may still finish. Refresh before retrying." : err.response?.data?.message || err.message || "Baseline capture failed.";
      setBaselineMessages((old) => ({ ...old, [account._id]: { text, error: true } }));
    } finally { setCapturing((old) => ({ ...old, [account._id]: false })); }
  };
  const exportCSV = async () => {
    setError("");
    try {
      const { data } = await API.get("/quora-accounts/export/csv", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([data], { type: "text/csv" }));
      const link = document.createElement("a"); link.href = url; link.download = "quora_accounts.csv"; link.click(); URL.revokeObjectURL(url);
    } catch { setError("Unable to export Quora accounts. Please try again."); }
  };
  const filtered = accounts.filter((account) => config.fields.some(([key]) => !key.toLowerCase().includes("password") && String(account[key] || "").toLowerCase().includes(search.toLowerCase())));
  const counts = [["Total", accounts.length, "text-blue-600"], ["Working", accounts.filter((a) => a.status === "working").length, "text-green-600"], ["Suspicious", accounts.filter((a) => a.status === "suspicious").length, "text-yellow-600"], ["Not Working", accounts.filter((a) => a.status === "not_working").length, "text-red-600"]];
  return <div className="account-sheet-page space-y-6">
    {dialog && <AccountDialog account={dialog.account} platform={platform} mode={dialog.mode} onClose={() => setDialog(null)} onSaved={fetchAccounts} />}
    <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">{config.name} Accounts</h2><div className="employee-account-actions">{platform === "quora" && <button type="button" onClick={exportCSV}>Export CSV</button>}<button type="button" onClick={fetchAccounts} className="employee-account-refresh"><RefreshCw size={16} /> Refresh</button></div></div>
    {error && <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">{error} <button type="button" onClick={fetchAccounts} className="ml-2 underline">Retry</button></div>}
    {claimError && <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">{claimError} <button type="button" onClick={fetchClaims} className="ml-2 underline">Retry</button></div>}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{counts.map(([label, count, color]) => <div key={label} className={color}>{label}: {count}</div>)}</div>
    <input aria-label={`Search ${config.name} accounts`} placeholder="Search by user ID, name or username..." value={search} onChange={(e) => setSearch(e.target.value)} className="p-2 rounded border w-full md:w-1/2 bg-white text-gray-900 border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" />
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Sr</th>{config.fields.map(([key, label]) => <th key={key}>{label}</th>)}{platform === "quora" && <th>Baseline</th>}<th>Status</th>{claimsEnabled && <th>CTR Done</th>}<th>Actions</th></tr></thead><tbody>
      {loading || !filtered.length ? <tr><td colSpan={config.fields.length + (claimsEnabled ? 4 : 3) + (platform === "quora" ? 1 : 0)} className="py-6 text-center">{loading ? "Loading accounts..." : `No ${config.name} accounts found.`}</td></tr> : filtered.map((account, index) => <tr key={account._id}><td>{index + 1}</td>{config.fields.map(([key]) => <td key={key}><AccountValue field={key} value={account[key]} /></td>)}
      {platform === "quora" && <td><span>{account.baselineCapturedAt ? `Captured ${new Date(account.baselineCapturedAt).toLocaleString()}` : "Not captured"}</span>{!account.baselineCapturedAt && <button type="button" onClick={() => captureBaseline(account)} disabled={capturing[account._id] || !account.profileUrl} className="employee-account-refresh">{capturing[account._id] ? "Capturing..." : "Capture baseline"}</button>}{!account.profileUrl && <p>A public profile URL is required.</p>}{baselineMessages[account._id] && <p role={baselineMessages[account._id].error ? "alert" : "status"}>{baselineMessages[account._id].text}</p>}</td>}
      <td><StatusSelect aria-label={`Status for ${account.username || account.userId || account.name1 || "account"}`} value={account.status} onChange={(e) => changeStatus(account, e.target.value)}><option value="working">Working</option><option value="suspicious">Suspicious</option><option value="not_working">Not Working</option></StatusSelect></td>
      {claimsEnabled && <td className="text-center"><input type="checkbox" aria-label={`Mark CTR done for ${account.username || account.userId || account.name1 || "account"}`} checked={Boolean(claims[account._id])} disabled={loadingClaims || !!claimError || submitting[account._id] || Boolean(claims[account._id]) || account.status === "not_working"} onChange={() => markDone(account._id)} title={account.status === "not_working" ? "Account not working" : claims[account._id] ? "Already marked by a team member" : "Mark CTR done"} />{claims[account._id] && <span className="block mt-1 text-xs">{claims[account._id].employeeId?.fullName || claims[account._id].employeeId?.username || "Team member"}</span>}</td>}
      <td><div className="employee-account-actions"><button type="button" onClick={() => setDialog({ account, mode: "edit" })} aria-label={`Edit ${account.username || account.userId || account.name1 || "account"}`}><Pencil size={15} /> Edit</button><button type="button" className="employee-account-delete" onClick={() => setDialog({ account, mode: "delete" })} aria-label={`Delete ${account.username || account.userId || account.name1 || "account"}`}><Trash2 size={15} /> Delete</button></div></td></tr>)}
    </tbody></table></div>
  </div>;
}
