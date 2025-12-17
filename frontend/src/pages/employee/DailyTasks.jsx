// src/pages/employee/DailyTasks.jsx
import { useEffect, useState } from "react";
import API from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const TASK_API = "/platform-tasks";

export default function DailyTasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [bulkText, setBulkText] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ======================
     FETCH TASKS
  ====================== */
  const fetchTasks = async () => {
    try {
      setError("");
      const res = await API.get(TASK_API);
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load daily tasks.");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  /* ======================
     ADD SINGLE TASK (ADMIN)
  ====================== */
  const addSingleTask = async () => {
    if (!title.trim()) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await API.post(TASK_API, {
        platform,
        title,
        keywordOrTask: title,
        category: "task",
      });

      setTitle("");
      setSuccess("Task added successfully.");
      fetchTasks();
    } catch (err) {
      console.error(err);
      setError("Failed to add task.");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     BULK ADD TASKS (ADMIN)
  ====================== */
  const addBulkTasks = async () => {
    if (!bulkText.trim()) return;

    const rows = bulkText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      for (const row of rows) {
        await API.post(TASK_API, {
          platform,
          title: row,
          keywordOrTask: row,
          category: "task",
        });
      }

      setBulkText("");
      setSuccess("Bulk tasks uploaded successfully.");
      fetchTasks();
    } catch (err) {
      console.error(err);
      setError("Bulk upload failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     FILTER
  ====================== */
  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.platform === filter);

  return (
    <div className="space-y-6">
      {/* TITLE */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Daily Tasks
      </h2>

      {/* STATUS MESSAGES */}
      {error && (
        <div className="bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 px-4 py-2 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 px-4 py-2 rounded">
          {success}
        </div>
      )}

      {/* ================= ADMIN ONLY ================= */}
      {user?.role === "admin" && (
        <>
          {/* ADD SINGLE */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded shadow space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Add Task (Single)
            </h3>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task..."
                className="
                  flex-1 px-3 py-2 rounded
                  bg-white text-gray-900 border border-gray-300
                  dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
              />

              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="
                  px-3 py-2 rounded
                  bg-white text-gray-900 border border-gray-300
                  dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600
                "
              >
                <option value="instagram">Instagram</option>
                <option value="reddit">Reddit</option>
                <option value="quora">Quora</option>
                <option value="bhw">BHW</option>
              </select>

              <button
                onClick={addSingleTask}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add Task"}
              </button>
            </div>
          </div>

          {/* BULK ADD */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded shadow space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Bulk Upload Tasks (One per line)
            </h3>

            <textarea
              rows="5"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Follow 5 accounts\nLike 10 posts\nComment on 3 reels`}
              className="
                w-full p-3 rounded
                bg-white text-gray-900 border border-gray-300
                dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600
                focus:outline-none focus:ring-2 focus:ring-green-500
              "
            />

            <button
              onClick={addBulkTasks}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white disabled:opacity-60"
            >
              {loading ? "Uploading..." : "Bulk Upload"}
            </button>
          </div>
        </>
      )}

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
          "
        >
          <option value="all">All</option>
          <option value="instagram">Instagram</option>
          <option value="reddit">Reddit</option>
          <option value="quora">Quora</option>
          <option value="bhw">BHW</option>
        </select>
      </div>

      {/* TASK LIST */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded shadow">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          All Tasks
        </h3>

        {filteredTasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No tasks found.</p>
        ) : (
          <ul className="space-y-2">
            {filteredTasks.map((task) => (
              <li
                key={task._id}
                className="
                  flex justify-between items-center
                  px-4 py-2 rounded
                  bg-gray-100 text-gray-900
                  dark:bg-gray-900 dark:text-gray-100
                "
              >
                <span>{task.keywordOrTask}</span>
                <span className="text-xs uppercase opacity-70">
                  {task.platform}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
