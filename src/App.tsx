import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppProvider, useApp } from './store/AppStore';
import { LoadingState } from './components/ui';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pools } from './pages/Pools';
import { Commitments } from './pages/Commitments';
import { Transactions } from './pages/Transactions';
import { Rules } from './pages/Rules';
import { Import } from './pages/Import';
import { Reports } from './pages/Reports';
import { Savings } from './pages/Savings';
import { Guide } from './pages/Guide';
import { Settings } from './pages/Settings';
import { Accounts } from './pages/Accounts';

function RequireAuth({ children }: { children: ReactNode }) {
  const { authed } = useApp();
  if (!authed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { authed, authLoading, dataLoading } = useApp();

  if (authLoading || (authed && dataLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <LoadingState label="Loading" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/pools" element={<RequireAuth><Pools /></RequireAuth>} />
      <Route path="/commitments" element={<RequireAuth><Commitments /></RequireAuth>} />
      <Route path="/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />
      <Route path="/rules" element={<RequireAuth><Rules /></RequireAuth>} />
      <Route path="/import" element={<RequireAuth><Import /></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/savings" element={<RequireAuth><Savings /></RequireAuth>} />
      <Route path="/guide" element={<RequireAuth><Guide /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/accounts" element={<RequireAuth><Accounts /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
