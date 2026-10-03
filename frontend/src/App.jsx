import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { OfflineProvider } from "@/context/OfflineContext";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminAdmins from "@/pages/admin/AdminAdmins";
import AdminUmkms from "@/pages/admin/AdminUmkms";
import AdminUmkmProducts from "@/pages/admin/AdminUmkmProducts";
import AdminProductApprovals from "@/pages/admin/AdminProductApprovals";
import AdminPasswordResets from "@/pages/admin/AdminPasswordResets";
import AdminTransactions from "@/pages/admin/AdminTransactions";
import AdminSettlement from "@/pages/admin/AdminSettlement";
import AdminAuditLog from "@/pages/admin/AdminAuditLog";
import AdminSettings from "@/pages/admin/AdminSettings";
import UmkmDashboard from "@/pages/umkm/UmkmDashboard";
import Pos from "@/pages/umkm/Pos";
import Products from "@/pages/umkm/Products";
import Customers from "@/pages/umkm/Customers";
import Transactions from "@/pages/umkm/Transactions";
import Reports from "@/pages/umkm/Reports";
import Settings from "@/pages/umkm/Settings";
import "@/App.css";

function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/admin" element={<ProtectedRoute role="admin"><Layout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="admins" element={<AdminAdmins />} />
              <Route path="umkms" element={<AdminUmkms />} />
              <Route path="umkms/:umkmId/products" element={<AdminUmkmProducts />} />
              <Route path="product-approvals" element={<AdminProductApprovals />} />
              <Route path="password-resets" element={<AdminPasswordResets />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="settlement" element={<AdminSettlement />} />
              <Route path="audit" element={<AdminAuditLog />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="/umkm" element={<ProtectedRoute role="umkm"><Layout /></ProtectedRoute>}>
              <Route index element={<UmkmDashboard />} />
              <Route path="pos" element={<Pos />} />
              <Route path="products" element={<Products />} />
              <Route path="customers" element={<Customers />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </OfflineProvider>
    </AuthProvider>
  );
}

export default App;