import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTelegramTheme } from "@/hooks/useTelegramTheme";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { BottomNav } from "@/components/layout/BottomNav";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { FoldersPage } from "@/pages/FoldersPage";
import { FilesPage } from "@/pages/FilesPage";
import { CreditsPage } from "@/pages/CreditsPage";
import { SettingsPage } from "@/pages/SettingsPage";

function AppShell() {
  const { user, isLoading } = useOnboardingCheck();

  if (isLoading) {
    return <div className="stora-loading">Loading Stora...</div>;
  }

  // Onboarding gate: without a bound channel, nothing else is reachable.
  if (!user || !user.is_onboarded) {
    return <OnboardingPage />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/folders" replace />} />
        <Route path="/folders" element={<FoldersPage />} />
        <Route path="/files/:folderId" element={<FilesPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/folders" replace />} />
      </Routes>
      <BottomNav />
    </>
  );
}

export default function App() {
  useTelegramTheme();

  return (
    <BrowserRouter>
      <AppShell />
      <style>{`
        .stora-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: var(--tg-hint-color);
          font-size: 15px;
        }
      `}</style>
    </BrowserRouter>
  );
}
