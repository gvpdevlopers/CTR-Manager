// src/pages/employee/Keywords.jsx
import { useEffect, useState } from "react";
import API from "../../services/api";

const KEYWORD_API = "/keywords";

export default function Keywords() {
  const [keywords, setKeywords] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ======================
     FETCH KEYWORDS (READ ONLY)
  ====================== */
  const fetchKeywords = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(KEYWORD_API);

      // ✅ Directly store keywords
      setKeywords(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load keywords.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  /* ======================
     FILTER
  ====================== */
  const filteredKeywords =
    filter === "all" ? keywords : keywords.filter((k) => k.platform === filter);

  return (
    <div className="space-y-6">
      {/* TITLE */}
      <h2 className="text-2xl font-bold text-white">Keywords</h2>

      {/* FILTER */}
      <div className="flex items-center gap-3">
        <span className="text-white">Filter:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2"
        >
          <option value="all">All</option>
          <option value="instagram">Instagram</option>
          <option value="reddit">Reddit</option>
          <option value="quora">Quora</option>
          <option value="bhw">BHW</option>
        </select>
      </div>

      {/* LIST */}
      <div className="bg-gray-800 p-5 rounded">
        <h3 className="font-semibold text-white mb-3">All Keywords</h3>

        {loading ? (
          <p className="text-gray-400">Loading keywords…</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : filteredKeywords.length === 0 ? (
          <p className="text-gray-400">No keywords available.</p>
        ) : (
          <ul className="space-y-2">
            {filteredKeywords.map((item) => (
              <li
                key={item._id}
                className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded text-white"
              >
                <span>{item.keyword}</span>
                <span className="text-xs text-gray-400 uppercase">
                  {item.platform}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
