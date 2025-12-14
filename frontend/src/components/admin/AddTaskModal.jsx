import { useState } from "react";
import API from "../../services/api";

export default function AddTaskModal({ onClose, refresh }) {
  const [platform, setPlatform] = useState("instagram");
  const [title, setTitle] = useState("");
  const [keywordOrTask, setKeywordOrTask] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/platform-tasks", {
        platform,
        title,
        keywordOrTask,
        category,
      });
      refresh();
      onClose();
    } catch {
      alert("Failed to add task");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <form
        className="bg-white dark:bg-gray-800 p-6 rounded w-96"
        onSubmit={handleSubmit}
      >
        <h2 className="font-bold mb-4 dark:text-white">Add Task / Keyword</h2>

        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        >
          <option value="instagram">Instagram</option>
          <option value="reddit">Reddit</option>
          <option value="quora">Quora</option>
          <option value="bhw">BHW</option>
        </select>

        <input
          placeholder="Title"
          className="w-full p-2 mb-3 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Keyword or Task"
          className="w-full p-2 mb-3 border rounded"
          value={keywordOrTask}
          onChange={(e) => setKeywordOrTask(e.target.value)}
        />

        <input
          placeholder="Category"
          className="w-full p-2 mb-3 border rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border px-4 py-1 rounded"
          >
            Cancel
          </button>
          <button className="bg-blue-600 text-white px-4 py-1 rounded">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
