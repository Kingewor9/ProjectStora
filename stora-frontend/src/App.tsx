import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTelegramTheme } from "@/hooks/useTelegramTheme";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { BottomNav } from "@/components/layout/BottomNav";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { FoldersPage } from "@/pages/FoldersPage";
import { FilesPage } from "@/pages/FilesPage";
import { CreditsPage } from "@/pages/CreditsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { UnlimitedPlanPage } from "@/pages/UnlimitedPlanPage";
import { SharedFolderPage } from "@/pages/SharedFolderPage";
import { BroadcastPage } from "@/pages/BroadcastPage";

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
        <Route path="/unlimited" element={<UnlimitedPlanPage />} />
        <Route path="/shared/:token" element={<SharedFolderPage />} />
        <Route path="/broadcast" element={<BroadcastPage />} />
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
    <HashRouter>
      <AppShell />
      <style>{`
        .stora-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: var(--tg-accent-color);
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          animation: pulse-glow 2s infinite ease-in-out;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; text-shadow: 0 0 8px rgba(77, 248, 255, 0.2); }
          50% { opacity: 1; text-shadow: 0 0 16px rgba(77, 248, 255, 0.8); }
        }
      `}</style>
    </HashRouter>
  );
}
