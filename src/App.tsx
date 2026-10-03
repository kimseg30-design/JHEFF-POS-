import React, { Suspense, lazy } from 'react';
import { RouterProvider, usePathname } from '@/lib/router-shim';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { ReceiptProvider } from '@/lib/context/receipt-context';
import { StoreProvider } from '@/lib/hooks/use-store';
import { Loader2 } from 'lucide-react';

// Lazy-loaded Pages for instant bundle delivery and minimal device memory usage
const Home = lazy(() => import('@/pages/page'));
const Login = lazy(() => import('@/pages/login/page'));
const Signup = lazy(() => import('@/pages/signup/page'));
const Pos = lazy(() => import('@/pages/pos/page'));
const PosHistory = lazy(() => import('@/pages/pos/history/page'));
const EwalletHistory = lazy(() => import('@/pages/pos/ewallet-history/page'));
const Products = lazy(() => import('@/pages/products/page'));
const Restocking = lazy(() => import('@/pages/restocking/page'));
const Utang = lazy(() => import('@/pages/utang/page'));
const Expenses = lazy(() => import('@/pages/expenses/page'));
const Settings = lazy(() => import('@/pages/settings/page'));
const Reports = lazy(() => import('@/pages/reports/page'));
const ReportsDaily = lazy(() => import('@/pages/reports/daily/page'));
const ReportsSalesJournal = lazy(() => import('@/pages/reports/sales-journal/page'));
const AdminAuditTrail = lazy(() => import('@/pages/admin/audit-trail/page'));
const AdminUsers = lazy(() => import('@/pages/admin/users/page'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
    </div>
  );
}

function AppContent() {
  const pathname = usePathname();

  // Route matching logic with lazy loaded components
  switch (pathname) {
    case '/':
      return <Home />;
    case '/login':
      return <Login />;
    case '/signup':
      return <Signup />;
    case '/pos':
      return <Pos />;
    case '/pos/history':
      return <PosHistory />;
    case '/pos/ewallet-history':
      return <EwalletHistory />;
    case '/products':
      return <Products />;
    case '/restocking':
      return <Restocking />;
    case '/utang':
      return <Utang />;
    case '/expenses':
      return <Expenses />;
    case '/settings':
      return <Settings />;
    case '/reports':
      return <Reports />;
    case '/reports/daily':
      return <ReportsDaily />;
    case '/reports/sales-journal':
      return <ReportsSalesJournal />;
    case '/admin/audit-trail':
      return <AdminAuditTrail />;
    case '/admin/users':
      return <AdminUsers />;
    default:
      return <Home />;
  }
}

export default function App() {
  return (
    <RouterProvider>
      <StoreProvider>
        <AuthProvider>
          <ReceiptProvider>
            <Suspense fallback={<PageLoader />}>
              <AppContent />
            </Suspense>
          </ReceiptProvider>
        </AuthProvider>
      </StoreProvider>
    </RouterProvider>
  );
}
