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
     FETCH TASKS (ADMIN + EMPLOYEE)
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
        keywordOrTask: title, // 🔥 REQUIRED
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
          keywordOrTask: row, // 🔥 REQUIRED
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
     FILTERED TASKS
  ====================== */
  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.platform === filter);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Daily Tasks</h2>

      {/* STATUS MESSAGES */}
      {error && (
        <div className="bg-red-500/10 text-red-400 px-4 py-2 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded">
          {success}
        </div>
      )}

      {/* ADMIN ONLY */}
      {user?.role === "admin" && (
        <>
          {/* ADD SINGLE */}
          <div className="bg-gray-800 p-5 rounded space-y-3">
            <h3 className="font-semibold text-white">Add Task (Single)</h3>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task..."
                className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              />

              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2"
              >
                <option value="instagram">Instagram</option>
                <option value="reddit">Reddit</option>
                <option value="quora">Quora</option>
                <option value="bhw">BHW</option>
              </select>

              <button
                onClick={addSingleTask}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
              >
                {loading ? "Adding..." : "Add Task"}
              </button>
            </div>
          </div>

          {/* BULK ADD */}
          <div className="bg-gray-800 p-5 rounded space-y-3">
            <h3 className="font-semibold text-white">
              Bulk Upload Tasks (One per line)
            </h3>

            <textarea
              rows="5"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Follow 5 accounts\nLike 10 posts\nComment on 3 reels`}
              className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white placeholder-gray-400"
            />

            <button
              onClick={addBulkTasks}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
            >
              {loading ? "Uploading..." : "Bulk Upload"}
            </button>
          </div>
        </>
      )}

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

      {/* TASK LIST */}
      <div className="bg-gray-800 p-5 rounded">
        <h3 className="font-semibold text-white mb-3">All Tasks</h3>

        {filteredTasks.length === 0 ? (
          <p className="text-gray-400">No tasks found.</p>
        ) : (
          <ul className="space-y-2">
            {filteredTasks.map((task) => (
              <li
                key={task._id}
                className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded text-white"
              >
                <span>{task.keywordOrTask}</span>
                <span className="text-xs text-gray-400 uppercase">
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
