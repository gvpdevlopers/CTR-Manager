import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";

export default function ResetPasswordDialog({ employee, onClose, onSubmit }) {
  const dialog = useRef(null);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  const submit = async (event) => {
    event.preventDefault();
    if (!password.trim()) { setError("Enter a new password."); return; }
    setBusy(true); setError("");
    try { await onSubmit(employee._id, password); onClose(); }
    catch (err) { setError(err.response?.data?.message || "Password reset failed. Please try again."); }
    finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="reset-dialog" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}><form onSubmit={submit}><div className="reset-dialog-header"><span className="reset-dialog-icon"><KeyRound size={20}/></span><button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Close"><X size={18}/></button></div><h2>Reset password</h2><p>Set a new password for <strong>{employee.fullName || employee.username}</strong>.</p><label htmlFor="new-employee-password">New password</label><div className="reset-password-field"><input id="new-employee-password" type={visible ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{error && <p role="alert" className="reset-error">{error}</p>}<div className="reset-dialog-actions"><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Saving..." : "Reset password"}</button></div></form></dialog>;
}
