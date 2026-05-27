import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Outlet, Route, Routes, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.js';
import { AquariumDetailPage } from './pages/AquariumDetailPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { NewAquariumPage } from './pages/NewAquariumPage.js';
import { NewWaterTestPage } from './pages/NewWaterTestPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { TestParametersPage } from './pages/TestParametersPage.js';
import { Button } from './components/ui/button.js';

const queryClient = new QueryClient();

function Shell() {
  const { token, logout } = useAuth();
  const loc = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-lg font-semibold text-sky-800">
            AquaManager
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100" to="/">
              Dashboard
            </Link>
            <Link className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100" to="/test-parameters">
              Parâmetros
            </Link>
            <Link className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100" to="/settings">
              Configurações
            </Link>
            <Button variant="outline" size="sm" type="button" onClick={() => logout()}>
              Sair
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<Shell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/aquariums/new" element={<NewAquariumPage />} />
            <Route path="/aquariums/:aquariumId" element={<AquariumDetailPage />} />
            <Route path="/aquariums/:aquariumId/water-tests/new" element={<NewWaterTestPage />} />
            <Route path="/test-parameters" element={<TestParametersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}
