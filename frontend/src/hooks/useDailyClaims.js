import { useCallback, useEffect, useState } from "react";
import API from "../services/api";

export default function useDailyClaims(platform) {
  const [claims, setClaims] = useState({});
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [claimError, setClaimError] = useState("");
  const [submitting, setSubmitting] = useState({});

  const refreshClaims = useCallback(async () => {
    setLoadingClaims(true);
    setClaimError("");
    try {
      const { data } = await API.get("/ctr/today");
      const next = {};
      for (const row of data) {
        if (row.platform === platform && row.accountId && !next[String(row.accountId)]) next[String(row.accountId)] = row;
      }
      setClaims(next);
    } catch {
      setClaimError("Unable to load today's CTR claims. Try again before marking an account.");
    } finally {
      setLoadingClaims(false);
    }
  }, [platform]);

  useEffect(() => { refreshClaims(); }, [refreshClaims]);

  const markDone = async (accountId) => {
    if (loadingClaims || claimError || claims[accountId] || submitting[accountId]) return;
    setSubmitting((current) => ({ ...current, [accountId]: true }));
    try {
      await API.post("/ctr/mark-done", { accountId, platform });
      await refreshClaims();
    } catch {
      setClaimError("Unable to confirm that CTR was saved. Reload today's claims and try again.");
    } finally {
      setSubmitting((current) => ({ ...current, [accountId]: false }));
    }
  };

  return { claims, loadingClaims, claimError, submitting, refreshClaims, markDone };
}
