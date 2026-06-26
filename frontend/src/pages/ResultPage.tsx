import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RenderJob } from "@lineupai/shared";

export default function ResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<RenderJob | null>(null);

  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/jobs/${jobId}`).then(r => r.json()).then(setJob);
  }, [jobId]);

  if (!job) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;

  const shareText = encodeURIComponent("My football intro, made with LineupAI ⚽🔥");

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Your intro is ready! 🎬</h2>

      {job.outputUrl && (
        <video
          src={job.outputUrl}
          controls
          playsInline
          loop
          style={styles.video}
        />
      )}

      {job.watermark && (
        <div style={styles.upgradeBanner}>
          <p style={styles.upgradeText}>Remove the watermark + get 1080p</p>
          <button style={styles.upgradeBtn} onClick={() => alert("Payment flow coming soon — stub")}>
            Upgrade for R49/month
          </button>
        </div>
      )}

      <div style={styles.actions}>
        {job.outputUrl && (
          <a href={job.outputUrl} download={`lineupai-${jobId}.mp4`} style={styles.dlBtn}>
            Download MP4
          </a>
        )}
        <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer" style={styles.shareBtn}>
          Share on WhatsApp
        </a>
      </div>

      <button style={styles.again} onClick={() => navigate("/")}>Create another →</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", padding: "2rem", maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" },
  heading: { fontSize: "1.75rem", fontWeight: 800, textAlign: "center", marginTop: "2rem" },
  video: { width: "100%", maxWidth: "320px", borderRadius: "16px", background: "#111" },
  upgradeBanner: { background: "rgba(255,215,0,0.1)", border: "1px solid var(--gold)", borderRadius: "12px", padding: "1.25rem", textAlign: "center", width: "100%" },
  upgradeText: { marginBottom: "0.75rem", fontWeight: 600 },
  upgradeBtn: { background: "var(--gold)", color: "#000", border: "none", borderRadius: "8px", padding: "0.75rem 1.5rem", fontWeight: 700 },
  actions: { display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" },
  dlBtn: { display: "block", background: "var(--green)", color: "#fff", borderRadius: "10px", padding: "0.875rem", textAlign: "center", textDecoration: "none", fontWeight: 700 },
  shareBtn: { display: "block", background: "#25D366", color: "#fff", borderRadius: "10px", padding: "0.875rem", textAlign: "center", textDecoration: "none", fontWeight: 700 },
  again: { background: "transparent", border: "1px solid #374151", color: "var(--white)", borderRadius: "10px", padding: "0.75rem 2rem", fontWeight: 600 },
};
