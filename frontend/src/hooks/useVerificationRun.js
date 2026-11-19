import { useCallback, useEffect, useRef, useState } from "react";
import API from "../services/api";

export default function useVerificationRun(statusUrl, startUrl, onFinished) {
  const [run, setRun] = useState({ status: "loading" });
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const previous = useRef(null);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);
  const refresh = useCallback(async () => {
    try {
      const { data } = await API.get(statusUrl);
      setError("");
      setRun(data);
      if (previous.current === "running" && data.status !== "running") onFinishedRef.current?.();
      previous.current = data.status;
    } catch {
      setError("Unable to check verification progress. Try again.");
    }
  }, [statusUrl]);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [refresh]);
  const start = async () => {
    setStarting(true);
    setError("");
    try { await API.post(startUrl); await refresh(); }
    catch (err) {
      await refresh();
      setError(err.response?.data?.message || "Unable to start verification.");
    } finally { setStarting(false); }
  };
  return { run, error, starting, start, refresh };
}
