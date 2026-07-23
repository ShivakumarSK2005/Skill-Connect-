import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { getCurrentUser, getHomeRoute } from "./Services/auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCategories from "./pages/AdminCategories";
import AdminBookings from "./pages/AdminBookings";
import AdminUsers from "./pages/AdminUsers";
import AdminServices from "./pages/AdminServices";
import Services from "./pages/Services";
import Bookings from "./pages/Bookings";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderBookings from "./pages/ProviderBookings";
import ProviderServices from "./pages/ProviderServices";
import Profile from "./pages/Profile";

function HomeRedirect() {
  const user = getCurrentUser();

  if (!user) {
    return <Login />;
  }

  return <Navigate to={getHomeRoute(user.role)} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-categories"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-users"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-services"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-bookings"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute allowedRole="customer">
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute allowedRole="customer">
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider-dashboard"
          element={
            <ProtectedRoute allowedRole="provider">
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider-bookings"
          element={
            <ProtectedRoute allowedRole="provider">
              <ProviderBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider-services"
          element={
            <ProtectedRoute allowedRole="provider">
              <ProviderServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
