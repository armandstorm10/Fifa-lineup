import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { JobStatus } from "@lineupai/shared";

const STATUS_LABELS: Record<JobStatus, string> = {
  queued: "Queued…",
  "processing-clip": "Processing your clip…",
  "removing-background": "Removing background…",
  compositing: "Compositing scene…",
  rendering: "Rendering your video…",
  complete: "Done!",
  failed: "Something went wrong",
};

export default function ProcessingPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<JobStatus>("queued");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobId) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const job = await res.json();
        setStatus(job.status);
        if (job.status === "complete") {
          clearInterval(poll);
          navigate(`/result/${jobId}`);
        }
        if (job.status === "failed") {
          clearInterval(poll);
          setError(job.error || "Render failed");
        }
      } catch {
        // swallow network hiccups
      }
    }, 1500);
    return () => clearInterval(poll);
  }, [jobId, navigate]);

  const stages: JobStatus[] = ["queued", "processing-clip", "removing-background", "compositing", "rendering", "complete"];
  const currentIdx = stages.indexOf(status);

  return (
    <div style={styles.container}>
      <div style={styles.spinner}>⚽</div>
      <h2 style={styles.heading}>Generating your intro…</h2>
      <p style={styles.current}>{STATUS_LABELS[status]}</p>

      <div style={styles.steps}>
        {stages.filter(s => s !== "failed").map((s, i) => (
          <div key={s} style={{ ...styles.step, color: i < currentIdx ? "var(--gold)" : i === currentIdx ? "var(--white)" : "var(--grey)" }}>
            <span style={styles.dot}>{i < currentIdx ? "✓" : i === currentIdx ? "●" : "○"}</span>
            {STATUS_LABELS[s]}
          </div>
        ))}
      </div>

      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" },
  spinner: { fontSize: "4rem", marginBottom: "1.5rem", animation: "spin 2s linear infinite" },
  heading: { fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" },
  current: { color: "var(--gold)", fontWeight: 600, marginBottom: "2rem" },
  steps: { display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left" },
  step: { fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" },
  dot: { fontSize: "1.1rem", width: "1.5rem", textAlign: "center" },
  error: { color: "#EF4444", marginTop: "1rem" },
};
