import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
export default function ConfirmDialog({ title, description, onClose, onConfirm }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { await onConfirm(); onClose(); } finally { setBusy(false); } };
  return <dialog ref={dialog} className="reset-dialog" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}><form onSubmit={submit}><div className="reset-dialog-header"><span className="reset-dialog-icon"><AlertTriangle size={20}/></span><button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Close"><X size={18}/></button></div><h2>{title}</h2><p>{description}</p><div className="reset-dialog-actions"><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Please wait..." : "Delete"}</button></div></form></dialog>;
}
