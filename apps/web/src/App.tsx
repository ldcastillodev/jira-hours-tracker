import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { DeveloperReport } from './pages/DeveloperReport';
import { Manage } from './pages/Manage';
import { AppShell } from './components/layout/AppShell';
import { ColdStartBanner } from './components/ui/ColdStartBanner';
import { ToastContainer } from './components/ui/Toast';
import { ThemeProvider } from './hooks/useTheme';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ColdStartBanner />
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/developers" element={<DeveloperReport />} />
            <Route path="/manage" element={<Manage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
        <ToastContainer />
      </BrowserRouter>
    </ThemeProvider>
  );
}
