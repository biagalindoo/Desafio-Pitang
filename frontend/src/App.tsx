import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewReembolsoPage } from "./pages/NewReembolsoPage";
import { ReembolsoDetailPage } from "./pages/ReembolsoDetailPage";
import { EditReembolsoPage } from "./pages/EditReembolsoPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reembolsos/novo"
        element={
          <ProtectedRoute>
            <NewReembolsoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reembolsos/:id"
        element={
          <ProtectedRoute>
            <ReembolsoDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reembolsos/:id/editar"
        element={
          <ProtectedRoute>
            <EditReembolsoPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
