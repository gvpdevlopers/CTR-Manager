// import { useState } from "react";
// import API from "../../services/api";

// export default function CreateEmployeeModal({ onClose, refresh }) {
//   const [fullName, setFullName] = useState("");
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       await API.post("/auth/create-employee", {
//         fullName,
//         username,
//         password,
//       });
//       refresh();
//       onClose();
//     } catch (err) {
//       alert("Failed to create employee");
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white dark:bg-gray-800 p-6 rounded w-96"
//       >
//         <h2 className="text-lg font-bold mb-4 dark:text-white">
//           Add New Employee
//         </h2>

//         <input
//           className="w-full p-2 mb-3 border rounded"
//           placeholder="Full Name"
//           value={fullName}
//           onChange={(e) => setFullName(e.target.value)}
//         />

//         <input
//           className="w-full p-2 mb-3 border rounded"
//           placeholder="Username"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//         />

//         <input
//           className="w-full p-2 mb-3 border rounded"
//           placeholder="Password"
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />

//         <div className="flex justify-end gap-2">
//           <button
//             type="button"
//             onClick={onClose}
//             className="px-4 py-1 border rounded"
//           >
//             Cancel
//           </button>
//           <button className="px-4 py-1 bg-blue-600 text-white rounded">
//             Create
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }
