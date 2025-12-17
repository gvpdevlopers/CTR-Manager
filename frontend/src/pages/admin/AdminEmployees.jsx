import { useEffect, useState } from "react";
import API from "../../services/api";
import { EyeIcon, EyeSlashIcon, TrashIcon } from "@heroicons/react/24/outline";

/* ================= INPUT ================= */
const inputClass =
  "w-full rounded px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "bg-white text-gray-900 border-gray-300 placeholder-gray-400 " +
  "dark:bg-gray-900 dark:text-white dark:border-gray-600 dark:placeholder-gray-500";

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

  /* ================= DELETE ================= */
  const deleteEmployee = async (id, name) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete "${name}"?\nThis action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await API.delete(`/admin/employees/${id}`);
      showToast("success", "Employee deleted");
      fetchEmployees();
    } catch {
      showToast("error", "Failed to delete employee");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2 rounded shadow-lg text-white
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.text}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Employees Management
        </h2>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Add Employee
        </button>
      </div>

      {/* TABLE */}
      <div
        className="rounded-lg border overflow-x-auto
   bg-white border-gray-200
   dark:bg-gray-800 dark:border-gray-700"
      >
        <table className="w-full text-sm">
          <thead
            className="
  bg-gray-100 border-b border-gray-200
   dark:bg-gray-900 dark:border-gray-700
 "
          >
            <tr className="text-left text-gray-700 dark:text-gray-200">
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
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((emp, i) => (
                <tr
                  key={emp._id}
                  className={`
    border-b border-gray-200
    bg-gray-50
    hover:bg-gray-100

    dark:border-gray-700
    dark:bg-gray-800
    dark:hover:bg-gray-700

    transition
  `}
                >
                  <td className="p-3 text-gray-900 dark:text-gray-100">
                    {i + 1}
                  </td>
                  <td className="text-gray-900 dark:text-gray-100">
                    {emp.fullName}
                  </td>
                  <td className="text-gray-900 dark:text-gray-100">
                    {emp.username}
                  </td>

                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs
                        ${
                          emp.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                        }`}
                    >
                      {emp.isActive ? "Active" : "Blocked"}
                    </span>
                  </td>

                  <td className="text-right space-x-2 p-3">
                    <button
                      onClick={() => toggleStatus(emp._id)}
                      className="border px-3 py-1 rounded text-blue-600 border-blue-600 hover:bg-blue-50
                        dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-500/10"
                    >
                      {emp.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => resetPassword(emp._id)}
                      className="border px-3 py-1 rounded text-orange-600 border-orange-600 hover:bg-orange-50
                        dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-500/10"
                    >
                      Reset Password
                    </button>

                    <button
                      onClick={() => deleteEmployee(emp._id, emp.fullName)}
                      className="border px-2 py-1 rounded text-red-600 border-red-600 hover:bg-red-50
                        dark:text-red-400 dark:border-red-400 dark:hover:bg-red-500/10"
                      title="Delete Employee"
                    >
                      <TrashIcon className="h-4 w-4 inline" />
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
          <div
            className="rounded p-6 w-96 space-y-4
            bg-white text-gray-900
            dark:bg-gray-800 dark:text-white"
          >
            <h3 className="text-lg font-semibold">Add New Employee</h3>

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

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={inputClass}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <div
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded
                  border-gray-300 dark:border-gray-600"
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
