import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { Navbar } from './components/common/Navbar.js';
import { Sidebar } from './components/common/Sidebar.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { StudentDashboard } from './components/student/StudentDashboard.js';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard.js';
import { HrDashboard } from './components/hr/HrDashboard.js';
import { RegistrarDashboard } from './components/registrar/RegistrarDashboard.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { GraduationCap } from 'lucide-react';

// ─── App Loading Screen ──────────────────────────────────────────────────────
const AppLoadingScreen: React.FC = () => (
  <div className="app-loading-screen" role="status" aria-label="Loading Apex Institute">
    <div className="app-loading-logo">
      <GraduationCap size={36} />
    </div>
    <div className="app-loading-title">Apex Institute</div>
    <div className="app-loading-subtitle">School Management Portal</div>
    <div className="spinner" style={{ marginTop: '8px' }} />
  </div>
);

// ─── Auth Gate: Login / Register screens ─────────────────────────────────────
const AuthGate: React.FC = () => {
  const [view, setView] = useState<'login' | 'register'>('login');

  if (view === 'register') {
    return <RegisterPage onNavigateLogin={() => setView('login')} />;
  }
  return <LoginPage onNavigateRegister={() => setView('register')} />;
};

// ─── Dashboard Router ─────────────────────────────────────────────────────────
// Renders the correct role dashboard and handles sidebar tab state
const DashboardRouter: React.FC = () => {
  const { user, role } = useAuth();

  // Default active tab per role
  const defaultTab = useCallback((r: string | null): string => {
    switch (r) {
      case 'student':   return 'profile';
      case 'employee':  return 'profile';
      case 'hr':        return 'employees';
      case 'registrar': return 'students';
      case 'admin':     return 'overview';
      default:          return 'profile';
    }
  }, []);

  const [activeTab, setActiveTab] = useState<string>(defaultTab(role));

  // Reset tab when role changes (shouldn't normally happen mid-session, but safety)
  React.useEffect(() => {
    setActiveTab(defaultTab(role));
  }, [role, defaultTab]);

  if (!user || !role) return null;

  const renderDashboard = () => {
    switch (role) {
      case 'student':
        return <StudentDashboard activeTab={activeTab} />;
      case 'employee':
        return <EmployeeDashboard activeTab={activeTab} />;
      case 'hr':
        return <HrDashboard activeTab={activeTab} />;
      case 'registrar':
        return <RegistrarDashboard activeTab={activeTab} />;
      case 'admin':
        return <AdminDashboard activeTab={activeTab} />;
      default:
        return (
          <div className="empty-state">
            <div className="empty-state-title">Unknown Role</div>
            <div className="empty-state-desc">
              Your account role ({role}) is not recognized by this portal.
              Please contact your administrator.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-shell">
      {/* Fixed Top Navbar */}
      <Navbar />

      {/* Body: sidebar + main content */}
      <div className="app-body">
        <Sidebar currentTab={activeTab} onSelectTab={setActiveTab} />

        <main className="app-main" id="main-content" tabIndex={-1}>
          {renderDashboard()}
        </main>
      </div>
    </div>
  );
};

// ─── Inner App: selects between loading / auth / dashboard ──────────────────
const InnerApp: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return <DashboardRouter />;
};

// ─── Root App: wraps everything in providers ─────────────────────────────────
const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
