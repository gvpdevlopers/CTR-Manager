// import { useEffect, useState } from "react";
// import API from "../../services/api";

// export default function PlatformAccounts() {
//   const [accounts, setAccounts] = useState([]);
//   const [filtered, setFiltered] = useState([]);
//   const [platform, setPlatform] = useState("all");
//   const [search, setSearch] = useState("");
//   const [loading, setLoading] = useState(false);

//   const fetchAccounts = async () => {
//     try {
//       setLoading(true);
//       const res = await API.get("/platform-accounts/all");
//       setAccounts(res.data);
//       setFiltered(res.data);
//       setLoading(false);
//     } catch (err) {
//       alert("Failed to load accounts");
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAccounts();
//   }, []);

//   useEffect(() => {
//     let data = accounts;

//     if (platform !== "all") {
//       data = data.filter((acc) => acc.platform === platform);
//     }

//     if (search.trim()) {
//       const s = search.toLowerCase();
//       data = data.filter(
//         (acc) =>
//           acc.username.toLowerCase().includes(s) ||
//           acc.ownerUserId?.fullName?.toLowerCase().includes(s)
//       );
//     }

//     setFiltered(data);
//   }, [platform, search, accounts]);

//   const statusBadge = (status) => {
//     if (status === "working") return "bg-green-600";
//     if (status === "suspicious") return "bg-orange-500";
//     return "bg-red-600";
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
//       <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-4">
//         <h2 className="text-xl font-bold dark:text-white">
//           All Platform Accounts
//         </h2>

//         <div className="flex gap-2">
//           <select
//             value={platform}
//             onChange={(e) => setPlatform(e.target.value)}
//             className="p-2 border rounded"
//           >
//             <option value="all">All Platforms</option>
//             <option value="instagram">Instagram</option>
//             <option value="reddit">Reddit</option>
//             <option value="quora">Quora</option>
//             <option value="bhw">BHW</option>
//           </select>

//           <input
//             placeholder="Search user or employee..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="p-2 border rounded"
//           />
//         </div>
//       </div>

//       {loading ? (
//         <p className="dark:text-white">Loading...</p>
//       ) : (
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="text-left border-b dark:text-white">
//                 <th>Employee</th>
//                 <th>Platform</th>
//                 <th>Username</th>
//                 <th>Status</th>
//                 <th>Working</th>
//                 <th>Profile</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map((acc) => (
//                 <tr
//                   key={acc._id}
//                   className="border-b dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
//                 >
//                   <td>{acc.ownerUserId?.fullName || "N/A"}</td>
//                   <td className="capitalize">{acc.platform}</td>
//                   <td>{acc.username}</td>
//                   <td>
//                     {acc.status === "active" ? (
//                       <span className="text-green-600">Active</span>
//                     ) : (
//                       <span className="text-red-600">Inactive</span>
//                     )}
//                   </td>
//                   <td>
//                     <span
//                       className={`text-white text-xs px-2 py-1 rounded ${statusBadge(
//                         acc.workingStatus
//                       )}`}
//                     >
//                       {acc.workingStatus || "working"}
//                     </span>
//                   </td>
//                   <td>
//                     <a
//                       href={acc.profileLink}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="text-blue-600 underline"
//                     >
//                       Open
//                     </a>
//                   </td>
//                 </tr>
//               ))}

//               {filtered.length === 0 && (
//                 <tr>
//                   <td colSpan="6" className="text-center py-6 text-gray-400">
//                     No accounts found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }
