import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute, PublicRoute, RoleRoute } from './auth/RouteGuards';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import TenantSettingsPage from './pages/dashboard/TenantSettingsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import UsersPage from './pages/admin/UsersPage';
import {
  UserDetailPage,
  AuditLogsPage,
  AdminAuditLogsPage,
} from './pages/Placeholders';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* Protected Authenticated Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings/tenant" element={<TenantSettingsPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />

              {/* Role-Aware Admin Routes */}
              <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}