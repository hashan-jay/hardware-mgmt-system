import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AuditLogsPage from './pages/AuditLogsPage';
import BarcodeManagementPage from './pages/BarcodeManagementPage';
import BrandDetailPage from './pages/BrandDetailPage';
import ComponentDetailPage from './pages/ComponentDetailPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import InventoryPage from './pages/InventoryPage';
import IssuePage from './pages/IssuePage';
import LoginPage from './pages/LoginPage';
import ScansPage from './pages/ScansPage';

function LegacyScanRedirect() {
  const { id } = useParams();
  return <Navigate to={`/scans/${id}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="issue" element={<IssuePage />} />
              <Route path="components" element={<Navigate to="/issue" replace />} />
              <Route path="components/:id" element={<ComponentDetailPage />} />
              <Route path="brands/:id" element={<BrandDetailPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/:id" element={<LegacyScanRedirect />} />
              <Route path="scans" element={<ScansPage />} />
              <Route path="scans/reports" element={<Navigate to="/scans" replace />} />
              <Route path="scans/:id" element={<Navigate to="/scans" replace />} />
              <Route path="barcodes" element={<BarcodeManagementPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
