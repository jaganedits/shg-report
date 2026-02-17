import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LangProvider } from '@/contexts/LangContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { AppSkeleton, PageSkeleton } from '@/components/shared';

// Lazy-loaded pages — each becomes its own chunk
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const OverviewPage = lazy(() => import('@/pages/OverviewPage'));
const MonthlyPage = lazy(() => import('@/pages/MonthlyPage'));
const MembersPage = lazy(() => import('@/pages/MembersPage'));
const LoansPage = lazy(() => import('@/pages/LoansPage'));
const DataEntryPage = lazy(() => import('@/pages/DataEntryPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function PageFallback() {
  return <PageSkeleton type="dashboard" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <DataProvider>
            <Routes>
              <Route path="/login" element={<Suspense fallback={<AppSkeleton />}><LoginPage /></Suspense>} />
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/overview" element={<Suspense fallback={<PageFallback />}><OverviewPage /></Suspense>} />
                  <Route path="/monthly" element={<Suspense fallback={<PageFallback />}><MonthlyPage /></Suspense>} />
                  <Route path="/members" element={<Suspense fallback={<PageFallback />}><MembersPage /></Suspense>} />
                  <Route path="/loans" element={<Suspense fallback={<PageFallback />}><LoansPage /></Suspense>} />
                  <Route path="/entry" element={<Suspense fallback={<PageFallback />}><DataEntryPage /></Suspense>} />
                  <Route path="/reports" element={<Suspense fallback={<PageFallback />}><ReportsPage /></Suspense>} />
                  <Route path="/settings" element={<Suspense fallback={<PageFallback />}><SettingsPage /></Suspense>} />
                  <Route path="/" element={<Navigate to="/overview" replace />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
