import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './components/pages/Dashboard/Dashboard';
import { DeveloperReport } from './components/pages/DeveloperReport/DeveloperReport';
import { Manage } from './components/pages/Manage/Manage';
import { CustomReports } from './components/pages/CustomReports/CustomReports';
import { AppShell } from './components/templates/AppShell/AppShell';
import { ColdStartBanner } from './components/molecules/ColdStartBanner/ColdStartBanner';
import { ToastContainer } from './components/molecules/Toast/Toast';
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
            <Route path="/reports/custom" element={<CustomReports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
        <ToastContainer />
      </BrowserRouter>
    </ThemeProvider>
  );
}
