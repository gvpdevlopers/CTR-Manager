// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import EmployeeRoute from "./components/EmployeeRoute";
import MyAccounts from "./pages/employee/MyAccounts";
import AddAccounts from "./pages/employee/AddAccounts";
import InstagramAccounts from "./pages/employee/InstagramAccounts";
import RedditAccounts from "./pages/employee/RedditAccounts";
import QuoraAccounts from "./pages/employee/QuoraAccounts";
import BhwAccounts from "./pages/employee/BhwAccounts";
import DailyTasks from "./pages/employee/DailyTasks";
import Keywords from "./pages/employee/Keywords";
import AdminAddAccounts from "./pages/admin/AdminAddAccounts";
import AdminInstagramAccounts from "./pages/admin/AdminInstagramAccounts";
import AdminRedditAccounts from "./pages/admin/AdminRedditAccounts";
import AdminQuoraAccounts from "./pages/admin/AdminQuoraAccounts";
import AdminBhwAccounts from "./pages/admin/AdminBhwAccounts";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminDailyTasks from "./pages/admin/AdminDailyTasks";
import AdminKeywords from "./pages/admin/AdminKeywords";
// import Employees from "./pages/admin/Employees";
// import PlatformAccounts from "./pages/admin/PlatformAccounts";
// import PlatformTasks from "./pages/admin/PlatformTasks";
// import PlatformTasksView from "./pages/employee/PlatformTasksView";
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />

            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="employees" element={<AdminEmployees />} />
              <Route path="add-accounts" element={<AdminAddAccounts />} />
              <Route path="instagram" element={<AdminInstagramAccounts />} />
              <Route path="reddit" element={<AdminRedditAccounts />} />
              <Route path="quora" element={<AdminQuoraAccounts />} />
              <Route path="bhw" element={<AdminBhwAccounts />} />
              <Route path="tasks" element={<AdminDailyTasks />} />
              <Route path="keywords" element={<AdminKeywords />} />
              {/* <Route path="employees" element={<Employees />} /> */}
              {/* <Route path="accounts" element={<PlatformAccounts />} /> */}
              {/* <Route path="tasks" element={<PlatformTasks />} /> */}
            </Route>

            <Route
              path="/employee/*"
              element={
                <ProtectedRoute>
                  <EmployeeRoute>
                    <EmployeeLayout />
                  </EmployeeRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<EmployeeDashboard />} />
              <Route path="accounts" element={<MyAccounts />} />
              <Route path="add-accounts" element={<AddAccounts />} />
              <Route path="instagram" element={<InstagramAccounts />} />
              <Route path="reddit" element={<RedditAccounts />} />
              {/* <Route path="tasks" element={<PlatformTasksView />} /> */}
              <Route path="quora" element={<QuoraAccounts />} />
              <Route path="bhw" element={<BhwAccounts />} />
              <Route path="tasks" element={<DailyTasks />} />
              <Route path="keywords" element={<Keywords />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
