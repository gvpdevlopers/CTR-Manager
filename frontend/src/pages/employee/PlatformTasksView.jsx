import { useEffect, useState } from "react";
import API from "../../services/api";

export default function PlatformTasksView() {
  const [tasks, setTasks] = useState([]);
  const [platform, setPlatform] = useState("instagram");

  useEffect(() => {
    API.get("/platform-tasks").then((res) => setTasks(res.data));
  }, []);

  const filtered = tasks.filter((t) => t.platform === platform);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4 dark:text-white">
        Daily Tasks & Keywords
      </h2>

      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="p-2 border rounded mb-4"
      >
        <option value="instagram">Instagram</option>
        <option value="reddit">Reddit</option>
        <option value="quora">Quora</option>
        <option value="bhw">BHW</option>
      </select>

      <ul className="space-y-2">
        {filtered.map((task) => (
          <li key={task._id} className="border p-3 rounded dark:text-gray-300">
            <strong>{task.title}</strong>
            <div className="text-sm text-gray-500">{task.keywordOrTask}</div>
            <div className="text-xs text-gray-400">{task.category}</div>
          </li>
        ))}

        {filtered.length === 0 && (
          <li className="text-gray-400">No tasks available</li>
        )}
      </ul>
    </div>
  );
}
