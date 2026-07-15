import { useCallback, useEffect, useState } from "react";
import { CreditsBadge } from "@/components/ui/CreditsBadge";
import { SearchBar } from "@/components/ui/SearchBar";
import { FolderList } from "@/components/folders/FolderList";
import { NewFolderModal } from "@/components/folders/NewFolderModal";
import { Breadcrumbs } from "@/components/folders/Breadcrumbs";
import { useFolderStore } from "@/store/folderStore";
import { useUserStore } from "@/store/userStore";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchFolders, createFolder } from "@/api/folders.api";
import { claimAdReward } from "@/api/credits.api";
import { initializeOfferWallSDK, openOfferWall } from "@/utils/gigaOfferWall";
import type { Folder } from "@/types/folder.types";
import { useNavigate } from "react-router-dom";

export function FoldersPage() {
  const navigate = useNavigate();
  const credits = useUserStore((s) => s.user?.credits ?? 0);
  const updateCredits = useUserStore((s) => s.updateCredits);
  const { currentFolderId, breadcrumbs, folders, setFolders, enterFolder, goToBreadcrumb, goToRoot } =
    useFolderStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerWallState, setOfferWallState] = useState<"idle" | "loading" | "ready">("idle");
  const [offerWallError, setOfferWallError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchFolders(currentFolderId)
      .then((data) => {
        if (!cancelled) setFolders(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentFolderId]);

  const visibleFolders = debouncedSearch
    ? folders.filter((f) => f.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : folders;

  const handleOpenFolder = (folder: Folder) => {
    // Tapping a folder drills into ITS subfolders, in place — Files live
    // on their own dedicated page, reached via the "View files" entry point.
    enterFolder(folder);
  };

  const handleCreateFolder = async (name: string) => {
    const created = await createFolder({ name, parent_id: currentFolderId });
    setFolders([...folders, created]);
  };

  const activeFolder = breadcrumbs.length ? breadcrumbs[breadcrumbs.length - 1] : null;

  const handleOfferWallReward = useCallback(
    async (_sdk: unknown, data: { amount?: number | string }) => {
      try {
        const rewardAmount = Number(data.amount ?? 100);
        const res = await claimAdReward(rewardAmount);
        updateCredits(res.credits);
      } catch (error) {
        console.error("Failed to credit offer wall reward", error);
      }
    },
    [updateCredits]
  );

  useEffect(() => {
    let cancelled = false;

    const initOfferWall = async () => {
      try {
        setOfferWallState("loading");
        await initializeOfferWallSDK({ onRewardClaim: handleOfferWallReward });
        if (!cancelled) {
          setOfferWallState("ready");
          setOfferWallError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setOfferWallState("idle");
          setOfferWallError(error instanceof Error ? error.message : "The offer wall is unavailable right now.");
        }
      }
    };

    void initOfferWall();

    return () => {
      cancelled = true;
    };
  }, [handleOfferWallReward]);

  const handleOpenOfferWall = async () => {
    setOfferWallError(null);
    try {
      setOfferWallState("loading");
      await initializeOfferWallSDK({ onRewardClaim: handleOfferWallReward });
      openOfferWall();
      setOfferWallState("ready");
    } catch (error) {
      setOfferWallState("idle");
      setOfferWallError(error instanceof Error ? error.message : "The offer wall is unavailable right now.");
    }
  };

  return (
    <div className="stora-page">
      <div className="stora-home-header">
        <button className="stora-home-hero" onClick={handleOpenOfferWall} disabled={offerWallState === "loading"}>
          <div className="stora-home-hero-copy">
            <span className="stora-home-hero-pill">Free credits</span>
            <h1 className="stora-home-hero-title">Claim 100 Free Credits</h1>
            <p className="stora-home-hero-subtitle">Open the GigaPub offer wall and complete offers to top up your balance.</p>
          </div>
          <span className="stora-home-hero-action">{offerWallState === "loading" ? "Loading…" : "Open offers"}</span>
        </button>
        <CreditsBadge credits={credits} />
      </div>

      {offerWallError && <p className="stora-offerwall-error">{offerWallError}</p>}

      <Breadcrumbs crumbs={breadcrumbs} onNavigate={goToBreadcrumb} onGoRoot={goToRoot} />

      {activeFolder && (
        <button className="stora-view-files-btn" onClick={() => navigate(`/files/${activeFolder.id}`)}>
          <span>📄 View files in "{activeFolder.name}"</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="var(--tg-link-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <div className="stora-section-header">
        <h2 className="stora-section-title">{activeFolder ? "Subfolders" : "My Folders"}</h2>
        <button className="stora-new-folder-btn" onClick={() => setModalOpen(true)}>
          + New folder
        </button>
      </div>

      <div className="stora-folders-search">
        <SearchBar value={search} onChange={setSearch} placeholder="Search for folders" />
      </div>

      {!isLoading && (
        <FolderList folders={visibleFolders} onOpenFolder={handleOpenFolder} isRoot={!currentFolderId} />
      )}

      <NewFolderModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreateFolder} />

      <style>{`
        .stora-home-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--stora-space-3);
          margin-bottom: var(--stora-space-4);
        }
        .stora-home-hero {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--stora-space-3);
          background: linear-gradient(135deg, var(--tg-button-color) 0%, color-mix(in srgb, var(--tg-button-color) 70%, white 30%) 100%);
          color: var(--tg-button-text-color);
          border: none;
          border-radius: var(--stora-radius-lg);
          padding: 14px 16px;
          box-shadow: var(--stora-shadow-card);
          cursor: pointer;
          text-align: left;
        }
        .stora-home-hero:disabled {
          opacity: 0.75;
          cursor: wait;
        }
        .stora-home-hero-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stora-home-hero-pill {
          display: inline-flex;
          align-self: flex-start;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: var(--stora-radius-pill);
          background: rgba(255,255,255,0.22);
        }
        .stora-home-hero-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }
        .stora-home-hero-subtitle {
          margin: 0;
          font-size: 12px;
          opacity: 0.92;
          line-height: 1.4;
        }
        .stora-home-hero-action {
          flex-shrink: 0;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: var(--stora-radius-pill);
          background: rgba(255,255,255,0.2);
        }
        .stora-offerwall-error {
          margin: 0 0 var(--stora-space-3);
          font-size: 13px;
          color: var(--tg-destructive-color);
        }
        .stora-new-folder-btn {
          background: none;
          border: none;
          color: var(--tg-link-color);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .stora-folders-search {
          margin-bottom: var(--stora-space-4);
        }
        .stora-view-files-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: var(--tg-card-bg);
          border: none;
          border-radius: var(--stora-radius-md);
          padding: 14px;
          box-shadow: var(--stora-shadow-card);
          color: var(--tg-link-color);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: var(--stora-space-4);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
