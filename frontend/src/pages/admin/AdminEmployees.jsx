import { useEffect, useState } from "react";
import API from "../../services/api";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const inputClass =
  "w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal + form
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
  });

  // toast
  const [toast, setToast] = useState(null);

  const showToast = (type, text, time = 2500) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), time);
  };

  /* ================= FETCH ================= */
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/employees");
      setEmployees(res.data || []);
    } catch {
      showToast("error", "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  /* ================= ADD ================= */
  const addEmployee = async () => {
    if (!form.fullName || !form.username || !form.password) {
      return showToast("error", "All fields are required");
    }

    try {
      await API.post("/admin/employees", form);
      showToast("success", "Employee added successfully");
      setForm({ fullName: "", username: "", password: "" });
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      showToast(
        "error",
        err?.response?.data?.message || "Failed to add employee"
      );
    }
  };

  /* ================= STATUS ================= */
  const toggleStatus = async (id) => {
    try {
      await API.put(`/admin/employees/${id}/status`);
      showToast("success", "Status updated");
      fetchEmployees();
    } catch {
      showToast("error", "Failed to update status");
    }
  };

  /* ================= RESET PASSWORD ================= */
  const resetPassword = async (id) => {
    const newPassword = prompt("Enter new password");
    if (!newPassword) return;

    try {
      await API.put(`/admin/employees/${id}/reset-password`, {
        newPassword,
      });

      showToast("success", "Password reset successful");
    } catch {
      showToast("error", "Password reset failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-2 rounded shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span className="text-lg">
            {toast.type === "success" ? "✅" : "❌"}
          </span>
          <span className="text-sm font-medium">{toast.text}</span>
          <button onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Employees Management</h2>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Add Employee
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-gray-800 rounded shadow overflow-x-auto">
        <table className="w-full text-sm text-white">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-3">Sr</th>
              <th>Full Name</th>
              <th>Username</th>
              <th>Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-400">
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((emp, i) => (
                <tr
                  key={emp._id}
                  className="border-b border-gray-700 hover:bg-gray-700"
                >
                  <td className="p-3">{i + 1}</td>
                  <td>{emp.fullName}</td>
                  <td>{emp.username}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        emp.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {emp.isActive ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="text-right space-x-2 p-3">
                    <button
                      onClick={() => toggleStatus(emp._id)}
                      className="border px-3 py-1 rounded text-blue-400"
                    >
                      {emp.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => resetPassword(emp._id)}
                      className="border px-3 py-1 rounded text-orange-400"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded w-96 space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Add New Employee
            </h3>

            <input
              placeholder="Full Name"
              className={inputClass}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />

            <input
              placeholder="Username"
              className={inputClass}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            {/* PASSWORD WITH EYE */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={inputClass}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {/* Eye Icon */}
              <div
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 dark:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </div>
              {/* <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-400"
              >
                {showPassword ? "🙈" : "👁️"}
              </button> */}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-500 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={addEmployee}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
