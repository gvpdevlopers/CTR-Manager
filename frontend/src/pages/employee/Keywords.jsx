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
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Keywords
      </h2>

      {/* FILTER */}
      <div className="flex items-center gap-3">
        <span className="text-gray-900 dark:text-white">Filter:</span>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="
            px-3 py-2 rounded
            bg-white text-gray-900 border border-gray-300
            dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          <option value="all">All</option>
          <option value="instagram">Instagram</option>
          <option value="reddit">Reddit</option>
          <option value="quora">Quora</option>
          <option value="bhw">BHW</option>
        </select>
      </div>

      {/* LIST */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded shadow">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          All Keywords
        </h3>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading keywords…</p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        ) : filteredKeywords.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No keywords available.
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredKeywords.map((item) => (
              <li
                key={item._id}
                className="
                  flex justify-between items-center
                  px-4 py-2 rounded
                  bg-gray-100 text-gray-900
                  dark:bg-gray-900 dark:text-gray-100
                "
              >
                <span>{item.keyword}</span>
                {/* <span className="text-xs uppercase opacity-70">
                  {item.platform}
                </span> */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
