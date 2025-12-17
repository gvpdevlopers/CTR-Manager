import { useEffect, useState } from "react";
import API from "../../services/api";

/* =========================
   INPUT / SELECT CLASSES
========================= */
const inputClass =
  "w-full rounded px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "bg-white text-gray-900 border-gray-300 placeholder-gray-500 " +
  "dark:bg-gray-900 dark:text-white dark:border-gray-500 dark:placeholder-gray-400";

const selectClass =
  "rounded px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "bg-white text-gray-900 border-gray-300 " +
  "dark:bg-gray-900 dark:text-white dark:border-gray-600";

export default function AdminDailyTasks() {
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [bulkText, setBulkText] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /* =========================
     TOAST
  ========================= */
  const showToast = (type, text, timeout = 2500) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), timeout);
  };

  /* =========================
     FETCH TASKS
  ========================= */
  const fetchTasks = async () => {
    try {
      const res = await API.get("/platform-tasks");
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  /* =========================
     ADD SINGLE TASK
  ========================= */
  const addSingleTask = async () => {
    if (!taskText.trim()) return;

    try {
      setLoading(true);

      await API.post("/platform-tasks", {
        platform,
        title: "Daily Task",
        keywordOrTask: taskText,
        category: "daily-task",
      });

      setTaskText("");
      showToast("success", "Task added successfully");
      fetchTasks();
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     BULK ADD
  ========================= */
  const addBulkTasks = async () => {
    if (!bulkText.trim()) return;

    const rows = bulkText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      setLoading(true);

      for (const row of rows) {
        await API.post("/platform-tasks", {
          platform,
          title: "Daily Task",
          keywordOrTask: row,
          category: "daily-task",
        });
      }

      setBulkText("");
      showToast("success", "Bulk tasks added");
      fetchTasks();
    } catch (err) {
      console.error(err);
      showToast("error", "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DELETE TASK
  ========================= */
  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;

    try {
      await API.delete(`/platform-tasks/${id}`);
      showToast("success", "Task deleted");
      fetchTasks();
    } catch {
      showToast("error", "Delete failed");
    }
  };

  /* =========================
     EXPORT CSV
  ========================= */
  const exportCSV = async () => {
    try {
      const res = await API.get("/platform-tasks/export/csv", {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "daily_tasks.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("error", "CSV export failed");
    }
  };

  /* =========================
     FILTER
  ========================= */
  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.platform === filter);

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Daily Tasks
        </h2>

        <button
          onClick={exportCSV}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>
      </div>

      {/* ADD SINGLE */}
      <div
        className="p-5 rounded shadow space-y-3
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Add Task (Single)
        </h3>

        <div className="flex flex-col md:flex-row gap-3 items-center">
          <input
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="Enter task..."
            className={`flex-1 ${inputClass}`}
          />

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className={selectClass}
          >
            <option value="instagram">Instagram</option>
            <option value="reddit">Reddit</option>
            <option value="quora">Quora</option>
            <option value="bhw">BHW</option>
          </select>

          <button
            onClick={addSingleTask}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {loading ? "Adding..." : "Add Task"}
          </button>
        </div>
      </div>

      {/* BULK UPLOAD */}
      <div
        className="p-5 rounded shadow space-y-3
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Bulk Upload (One task per line)
        </h3>

        <textarea
          rows="5"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={`Example:
Follow 10 profiles
Like 20 posts
Comment on 5 reels`}
          className={inputClass}
        />

        <button
          onClick={addBulkTasks}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {loading ? "Uploading..." : "Bulk Upload"}
        </button>
      </div>

      {/* FILTER */}
      <div className="flex items-center gap-3">
        <span className="text-gray-900 dark:text-white font-medium">
          Filter:
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">All</option>
          <option value="instagram">Instagram</option>
          <option value="reddit">Reddit</option>
          <option value="quora">Quora</option>
          <option value="bhw">BHW</option>
        </select>
      </div>

      {/* TASK LIST */}
      <div
        className="p-5 rounded shadow
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700"
      >
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
                className="flex justify-between items-center px-3 py-2 rounded border
                  bg-gray-50 border-gray-200
                  dark:bg-gray-900 dark:border-gray-700"
              >
                <span className="text-gray-900 dark:text-gray-100">
                  {task.keywordOrTask}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    ({task.platform})
                  </span>
                </span>

                <button
                  onClick={() => deleteTask(task._id)}
                  className="text-red-600 hover:text-red-700
                    dark:text-red-400 dark:hover:text-red-500
                    border border-red-500/40 px-3 py-1 rounded"
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
          className={`fixed top-5 right-5 z-50 px-4 py-2 rounded shadow-lg text-white
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
