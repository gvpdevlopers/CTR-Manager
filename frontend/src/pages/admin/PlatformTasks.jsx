// import { useEffect, useState } from "react";
// import API from "../../services/api";
// import AddTaskModal from "../../components/admin/AddTaskModal";

// export default function PlatformTasks() {
//   const [tasks, setTasks] = useState([]);
//   const [platform, setPlatform] = useState("instagram");
//   const [open, setOpen] = useState(false);

//   const fetchTasks = async () => {
//     try {
//       const res = await API.get("/platform-tasks");
//       setTasks(res.data);
//     } catch {
//       alert("Failed to load tasks");
//     }
//   };

//   useEffect(() => {
//     fetchTasks();
//   }, []);

//   const deleteTask = async (id) => {
//     if (!window.confirm("Delete this task?")) return;
//     try {
//       await API.delete(`/platform-tasks/${id}`);
//       fetchTasks();
//     } catch {
//       alert("Delete failed");
//     }
//   };

//   const filtered = tasks.filter((t) => t.platform === platform);

//   return (
//     <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
//       <div className="flex justify-between mb-4">
//         <h2 className="text-xl font-bold dark:text-white">
//           Tasks & Keywords (Admin)
//         </h2>
//         <button
//           onClick={() => setOpen(true)}
//           className="bg-blue-600 text-white px-4 py-1 rounded"
//         >
//           + Add Task
//         </button>
//       </div>

//       <select
//         value={platform}
//         onChange={(e) => setPlatform(e.target.value)}
//         className="p-2 border rounded mb-4"
//       >
//         <option value="instagram">Instagram</option>
//         <option value="reddit">Reddit</option>
//         <option value="quora">Quora</option>
//         <option value="bhw">BHW</option>
//       </select>

//       <table className="w-full text-sm">
//         <thead>
//           <tr className="border-b dark:text-white">
//             <th>Title</th>
//             <th>Keyword / Task</th>
//             <th>Category</th>
//             <th className="text-right">Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filtered.map((task) => (
//             <tr key={task._id} className="border-b dark:text-gray-300">
//               <td>{task.title}</td>
//               <td>{task.keywordOrTask}</td>
//               <td>{task.category}</td>
//               <td className="text-right">
//                 <button
//                   onClick={() => deleteTask(task._id)}
//                   className="text-red-600"
//                 >
//                   Delete
//                 </button>
//               </td>
//             </tr>
//           ))}

//           {filtered.length === 0 && (
//             <tr>
//               <td colSpan="4" className="text-center py-4 text-gray-400">
//                 No tasks added yet
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       {open && (
//         <AddTaskModal onClose={() => setOpen(false)} refresh={fetchTasks} />
//       )}
//     </div>
//   );
// }
