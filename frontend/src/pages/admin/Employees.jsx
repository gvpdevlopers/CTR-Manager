// import { useEffect, useState } from "react";
// import API from "../../services/api";
// import CreateEmployeeModal from "./CreateEmployeeModal";

// export default function Employees() {
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [open, setOpen] = useState(false);

//   const fetchEmployees = async () => {
//     try {
//       setLoading(true);
//       const res = await API.get("/admin/employees");
//       setEmployees(res.data);
//       setLoading(false);
//     } catch (err) {
//       alert("Failed to load employees");
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchEmployees();
//   }, []);

//   const toggleStatus = async (id, isActive) => {
//     try {
//       await API.put(`/admin/employees/${id}/status`, { isActive: !isActive });
//       fetchEmployees();
//     } catch (err) {
//       alert("Status update failed");
//     }
//   };

//   const resetPassword = async (id) => {
//     const newPassword = prompt("Enter new password:");
//     if (!newPassword) return;

//     try {
//       await API.put(`/admin/employees/${id}/reset-password`, {
//         newPassword,
//       });
//       alert("Password reset successfully");
//     } catch (err) {
//       alert("Password reset failed");
//     }
//   };

//   const deleteEmployee = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this employee?"))
//       return;

//     try {
//       await API.delete(`/admin/employees/${id}`);
//       fetchEmployees();
//     } catch (err) {
//       alert("Delete failed");
//     }
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-bold dark:text-white">Employees</h2>
//         <button
//           onClick={() => setOpen(true)}
//           className="px-4 py-2 bg-blue-600 text-white rounded"
//         >
//           + Add Employee
//         </button>
//       </div>

//       {loading ? (
//         <p className="dark:text-white">Loading...</p>
//       ) : (
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="text-left border-b dark:text-white">
//               <th>Name</th>
//               <th>Username</th>
//               <th>Status</th>
//               <th className="text-right">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {employees.map((emp) => (
//               <tr key={emp._id} className="border-b dark:text-gray-300">
//                 <td>{emp.fullName}</td>
//                 <td>{emp.username}</td>
//                 <td>
//                   {emp.isActive ? (
//                     <span className="text-green-600">Active</span>
//                   ) : (
//                     <span className="text-red-600">Inactive</span>
//                   )}
//                 </td>
//                 <td className="text-right space-x-2">
//                   <button
//                     onClick={() => toggleStatus(emp._id, emp.isActive)}
//                     className="px-2 py-1 border rounded"
//                   >
//                     Toggle
//                   </button>
//                   <button
//                     onClick={() => resetPassword(emp._id)}
//                     className="px-2 py-1 border rounded"
//                   >
//                     Reset
//                   </button>
//                   <button
//                     onClick={() => deleteEmployee(emp._id)}
//                     className="px-2 py-1 border rounded text-red-600"
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       {open && (
//         <CreateEmployeeModal
//           onClose={() => setOpen(false)}
//           refresh={fetchEmployees}
//         />
//       )}
//     </div>
//   );
// }
