// src/components/EmployeeRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function EmployeeRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "employee") return <Navigate to="/admin" replace />;
  return children;
}
