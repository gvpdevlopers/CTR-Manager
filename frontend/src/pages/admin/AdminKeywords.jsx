import { useEffect, useState } from "react";
import API from "../../services/api";

/* =====================
   COMMON STYLES
===================== */
const inputClass =
  "w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

const selectClass =
  "bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function AdminKeywords() {
  const [keywords, setKeywords] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [bulkText, setBulkText] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /* =====================
     TOAST
  ===================== */
  const showToast = (type, text, timeout = 2500) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), timeout);
  };

  /* =====================
     FETCH
  ===================== */
  const fetchKeywords = async () => {
    try {
      const res = await API.get("/keywords");
      setKeywords(res.data || []);
    } catch {
      showToast("error", "Failed to load keywords");
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  /* =====================
     ADD SINGLE
  ===================== */
  const addSingleKeyword = async () => {
    if (!keyword.trim()) {
      showToast("error", "Keyword cannot be empty");
      return;
    }

    try {
      setLoading(true);
      await API.post("/keywords", { keyword, platform });
      setKeyword("");
      showToast("success", "Keyword added successfully");
      fetchKeywords();
    } catch {
      showToast("error", "Failed to add keyword");
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     BULK ADD
  ===================== */
  const addBulkKeywords = async () => {
    if (!bulkText.trim()) {
      showToast("error", "Paste keywords first");
      return;
    }

    const rows = bulkText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      setLoading(true);

      for (const row of rows) {
        await API.post("/keywords", { keyword: row, platform });
      }

      setBulkText("");
      showToast("success", "Bulk keywords uploaded");
      fetchKeywords();
    } catch {
      showToast("error", "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     DELETE
  ===================== */
  const deleteKeyword = async (id) => {
    if (!confirm("Delete this keyword?")) return;

    try {
      await API.delete(`/keywords/${id}`);
      showToast("success", "Keyword deleted");
      fetchKeywords();
    } catch {
      showToast("error", "Delete failed");
    }
  };

  /* =====================
     CSV EXPORT
  ===================== */
  const exportCSV = async () => {
    try {
      const res = await API.get("/keywords/export/csv", {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "keywords.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast("error", "CSV export failed");
    }
  };

  /* =====================
     FILTER
  ===================== */
  const filteredKeywords =
    filter === "all" ? keywords : keywords.filter((k) => k.platform === filter);

  /* =====================
     UI
  ===================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Keywords Management</h2>

        <button
          onClick={exportCSV}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>
      </div>

      {/* SINGLE ADD */}
      <div className="bg-gray-800 p-5 rounded shadow space-y-3">
        <h3 className="font-semibold text-white">Add Keyword (Single)</h3>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter keyword..."
            className={`${inputClass} flex-[3]`}
          />

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className={`${selectClass} flex-[1]`}
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

          <button
            onClick={addSingleKeyword}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {loading ? "Adding..." : "Add Keyword"}
          </button>
        </div>
      </div>

      {/* BULK ADD */}
      <div className="bg-gray-800 p-5 rounded shadow space-y-3">
        <h3 className="font-semibold text-white">
          Bulk Upload Keywords (One per line)
        </h3>

        <textarea
          rows="5"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={`Example:
buy followers
best reels strategy
reddit karma`}
          className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={addBulkKeywords}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {loading ? "Uploading..." : "Bulk Upload"}
        </button>
      </div>

      {/* FILTER */}
      <div className="flex gap-3 items-center">
        <span className="text-white">Filter:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={selectClass}
        >
          <option className="bg-white text-black" value="all">
            All
          </option>
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
      </div>

      {/* LIST */}
      <div className="bg-gray-800 p-5 rounded shadow">
        <h3 className="font-semibold mb-3 text-white">All Keywords</h3>

        {filteredKeywords.length === 0 ? (
          <p className="text-gray-400">No keywords found.</p>
        ) : (
          <ul className="space-y-2">
            {filteredKeywords.map((item) => (
              <li
                key={item._id}
                className="border border-gray-700 p-2 rounded flex justify-between items-center text-white"
              >
                <span>
                  {item.keyword}
                  <span className="text-xs text-gray-400 ml-2">
                    ({item.platform})
                  </span>
                </span>

                <button
                  onClick={() => deleteKeyword(item._id)}
                  className="text-red-400 hover:text-red-500 border border-red-500/40 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
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
          <span className="text-lg">
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
