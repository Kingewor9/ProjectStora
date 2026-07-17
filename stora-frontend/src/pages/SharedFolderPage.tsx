import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Folder as FolderIcon, FileText, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchSharePreview, claimShare } from "@/api/shares.api";
import { fetchFolderDetail } from "@/api/folders.api";
import { fetchBalance } from "@/api/credits.api";
import { useUserStore } from "@/store/userStore";
import { useFolderStore } from "@/store/folderStore";
import type { SharePreview, SharePreviewFolder } from "@/types/share.types";

function PreviewTree({ node, depth = 0 }: { node: SharePreviewFolder; depth?: number }) {
  return (
    <div className="stora-preview-node" style={{ paddingLeft: depth * 16 }}>
      <div className="stora-preview-folder-row">
        <FolderIcon size={15} strokeWidth={2} />
        <span>{node.name}</span>
      </div>
      {node.files.map((file, i) => (
        <div className="stora-preview-file-row" key={`${file.name}-${i}`} style={{ paddingLeft: 22 }}>
          <FileText size={13} strokeWidth={2} />
          <span>{file.name}</span>
        </div>
      ))}
      {node.subfolders.map((sub) => (
        <PreviewTree node={sub} depth={depth + 1} key={sub.name + depth} />
      ))}
    </div>
  );
}

export function SharedFolderPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const updateCredits = useUserStore((s) => s.updateCredits);
  const { goToRoot, enterFolder } = useFolderStore();

  const [preview, setPreview] = useState<SharePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const loadPreview = () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    fetchSharePreview(token)
      .then(setPreview)
      .catch((err) => {
        console.error("Failed to load share preview:", err);
        const detail = err?.response?.data?.detail;
        setError(detail ?? "This share link couldn't be loaded.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(loadPreview, [token]);

  const handleClaim = async () => {
    if (!token) return;
    setIsClaiming(true);
    setError(null);
    try {
      const result = await claimShare(token);

      if (result.status === "in_progress") {
        setError(
          `Copied ${result.copied_count} of ${result.total_files} files so far — ` +
          `something interrupted the rest. Tap Claim again to pick up where it left off.`
        );
        loadPreview();
        return;
      }

      // Completed — balance changed (unless unlimited), refresh it before navigating.
      const balance = await fetchBalance();
      updateCredits(balance.credits);

      if (result.root_folder_id) {
        goToRoot();
        const folder = await fetchFolderDetail(result.root_folder_id);
        enterFolder(folder);
      }
      navigate("/folders");
    } catch (err: any) {
      console.error("Failed to claim share:", err);
      const detail = err?.response?.data?.detail;
      setError(detail ?? "Couldn't claim this folder. Try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return <div className="stora-page stora-shared-loading">Loading shared folder...</div>;
  }

  if (error && !preview) {
    return (
      <div className="stora-page">
        <p className="stora-shared-error">{error}</p>
        <Button fullWidth onClick={() => navigate("/folders")}>
          Go to my Folders
        </Button>
      </div>
    );
  }

  if (!preview) return null;

  const alreadyCompleted = preview.claim_status === "completed";
  const canClaim = !alreadyCompleted && (preview.requester_is_unlimited || preview.can_afford) && !preview.revoked;

  return (
    <div className="stora-page">
      <h1 className="stora-page-title">Shared folder</h1>
      <p className="stora-shared-subtitle">Shared by {preview.owner_name}</p>

      {preview.revoked ? (
        <p className="stora-shared-revoked">This share link has been revoked by its owner.</p>
      ) : (
        <>
          <div className="stora-shared-summary-card">
            <div className="stora-shared-summary-row">
              <span>{preview.total_files} files · {preview.total_folders} folders</span>
            </div>
            <div className="stora-shared-cost-row">
              {preview.requester_is_unlimited ? (
                <span className="stora-shared-unlimited">
                  <InfinityIcon size={14} strokeWidth={2.4} /> Covered by your Unlimited plan
                </span>
              ) : (
                <span className={preview.can_afford ? "" : "stora-shared-insufficient"}>
                  Cost to claim: <strong>{preview.cost_credits} credits</strong>
                  {" "}(you have {preview.requester_credits})
                </span>
              )}
            </div>
          </div>

          <div className="stora-shared-tree">
            <PreviewTree node={preview.root} />
          </div>

          {error && <p className="stora-shared-error">{error}</p>}

          {alreadyCompleted ? (
            <Button fullWidth onClick={handleClaim}>
              Open in my Folders
            </Button>
          ) : (
            <Button fullWidth onClick={handleClaim} disabled={!canClaim || isClaiming}>
              {isClaiming
                ? "Claiming..."
                : preview.claim_status === "in_progress"
                ? "Resume claim"
                : !canClaim
                ? "Not enough credits"
                : `Claim (${preview.cost_credits} credits)`}
            </Button>
          )}

          {!preview.requester_is_unlimited && !preview.can_afford && !alreadyCompleted && (
            <button className="stora-shared-topup-link" onClick={() => navigate("/credits")}>
              Top up credits
            </button>
          )}
        </>
      )}

      <style>{`
        .stora-shared-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60vh;
          color: var(--tg-hint-color);
          font-size: 15px;
        }
        .stora-shared-subtitle {
          font-size: 14px;
          color: var(--tg-hint-color);
          margin: -8px 0 var(--stora-space-4);
        }
        .stora-shared-revoked {
          font-size: 14px;
          color: var(--tg-destructive-color);
        }
        .stora-shared-summary-card {
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-lg);
          padding: var(--stora-space-4);
          box-shadow: var(--stora-shadow-card);
          margin-bottom: var(--stora-space-4);
        }
        .stora-shared-summary-row {
          font-size: 14px;
          font-weight: 600;
          color: var(--tg-text-color);
          margin-bottom: 6px;
        }
        .stora-shared-cost-row {
          font-size: 13px;
          color: var(--tg-hint-color);
        }
        .stora-shared-unlimited {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--tg-accent-color);
          font-weight: 600;
        }
        .stora-shared-insufficient {
          color: var(--tg-destructive-color);
        }
        .stora-shared-tree {
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-lg);
          padding: var(--stora-space-4);
          box-shadow: var(--stora-shadow-card);
          margin-bottom: var(--stora-space-4);
          max-height: 320px;
          overflow-y: auto;
        }
        .stora-preview-folder-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--tg-text-color);
          padding: 4px 0;
        }
        .stora-preview-file-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--tg-hint-color);
          padding: 3px 0;
        }
        .stora-shared-error {
          font-size: 13px;
          color: var(--tg-destructive-color);
          margin: 0 0 var(--stora-space-3);
          line-height: 1.4;
        }
        .stora-shared-topup-link {
          display: block;
          width: 100%;
          background: none;
          border: none;
          color: var(--tg-link-color);
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          padding: var(--stora-space-3) 0 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
