import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../components/AdminLayout";
import VoterLayout from "../components/VoterLayout";
import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";
import Voters from "../pages/Voters";
import Elections from "../pages/Elections";
import Candidates from "../pages/Candidates";
import VoterDashboard from "../pages/VoterDashboard";
import Dashboard from "../pages/Dashboard";
import Positions from "../pages/Position";
import Applications from "../pages/Applications";
import SignupApplication from "../pages/SignupApplication";

function App() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === "admin" ? "/dashboard/admin" : "/dashboard/voter"} replace />
            ) : (
              <Login />
            )
          }
        />
        
        <Route path="/applications/dis" element={<SignupApplication />} />
        <Route path="/applications/dcs" element={<SignupApplication />} />

      
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard/admin" element={<Dashboard />} />
            <Route path="/dashboard/admin/elections" element={<Elections />} />
            <Route path="/dashboard/admin/voters" element={<Voters />} />
            <Route path="/dashboard/admin/positions" element={<Positions />} />
            <Route path="/dashboard/admin/candidates" element={<Candidates />} />
            <Route path="/dashboard/admin/applications" element={<Applications />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["voter"]} />}>
          <Route element={<VoterLayout />}>
            <Route path="/dashboard/voter" element={<VoterDashboard />} />
          </Route>
        </Route>

        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;