import { lazy, Suspense } from "react";
import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { AdminAuthGate } from "./admin/AdminAuthGate";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminLoginPage } from "./admin/pages/AdminLoginPage";
import { AppLayout } from "./app/AppLayout";
import { DashboardPage } from "./app/pages/DashboardPage";
import { SubscriptionPage } from "./app/pages/SubscriptionPage";
import { AuthGate } from "./shared/auth/AuthGate";

// Code-splitting de las páginas más pesadas (editor con Fabric.js/jsPDF, admin con recharts)
// para no inflar el bundle inicial que carga cualquier usuario.
const EditorPage = lazy(() => import("./app/pages/EditorPage").then((m) => ({ default: m.EditorPage })));
const CucardasPage = lazy(() => import("./app/pages/CucardasPage").then((m) => ({ default: m.CucardasPage })));
const ProductsPage = lazy(() => import("./app/pages/ProductsPage").then((m) => ({ default: m.ProductsPage })));
const ClientsPage = lazy(() => import("./admin/pages/ClientsPage").then((m) => ({ default: m.ClientsPage })));
const ClientDetailPage = lazy(() =>
  import("./admin/pages/ClientDetailPage").then((m) => ({ default: m.ClientDetailPage })),
);
const ErrorsPage = lazy(() => import("./admin/pages/ErrorsPage").then((m) => ({ default: m.ErrorsPage })));
const ErrorDetailPage = lazy(() =>
  import("./admin/pages/ErrorDetailPage").then((m) => ({ default: m.ErrorDetailPage })),
);
const AnalyticsPage = lazy(() => import("./admin/pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));

function PageFallback() {
  return <p style={{ padding: 24 }}>Cargando...</p>;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminAuthGate>
                <AdminLayout />
              </AdminAuthGate>
            }
          >
            <Route index element={<Navigate to="clients" replace />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="errors" element={<ErrorsPage />} />
            <Route path="errors/:id" element={<ErrorDetailPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>

          <Route
            path="/*"
            element={
              <AuthGate>
                <AppLayout />
              </AuthGate>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="cucardas" element={<CucardasPage />} />
            <Route path="editor" element={<EditorPage />} />
            <Route path="editor/:designId" element={<EditorPage />} />
            <Route path="designs" element={<Navigate to="/cucardas" replace />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
