import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Position } from "@lineupai/shared";

const POSITIONS: Position[] = ["GK","CB","LB","RB","CDM","CM","CAM","LW","RW","ST","CF"];

const COUNTRIES = [
  { code: "ZA", name: "South Africa" }, { code: "NG", name: "Nigeria" },
  { code: "EG", name: "Egypt" }, { code: "MA", name: "Morocco" },
  { code: "SN", name: "Senegal" }, { code: "GH", name: "Ghana" },
  { code: "CM", name: "Cameroon" }, { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" }, { code: "FR", name: "France" },
  { code: "DE", name: "Germany" }, { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" }, { code: "GB", name: "England" },
  { code: "US", name: "USA" }, { code: "MX", name: "Mexico" },
];

export default function PlayerSetupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("ZA");
  const [position, setPosition] = useState<Position>("ST");
  const [shirtNumber, setShirtNumber] = useState(10);
  const [clip, setClip] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clip) { setError("Please upload a video clip."); return; }
    setUploading(true);
    setError("");
    try {
      // 1. Upload clip
      const formData = new FormData();
      formData.append("clip", clip);
      const uploadRes = await fetch("/api/upload/clip", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { clipPath } = await uploadRes.json();

      // 2. Start render job
      const template = sessionStorage.getItem("template") || "world-cup-gold";
      const renderRes = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          aspectRatio: "9:16",
          tier: "free",
          players: [{ id: crypto.randomUUID(), name, country, position, shirtNumber, clipPath }],
        }),
      });
      if (!renderRes.ok) throw new Error("Failed to start render");
      const { jobId } = await renderRes.json();
      navigate(`/processing/${jobId}`);
    } catch (err) {
      setError(String(err));
      setUploading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Your player details</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Full name</label>
        <input style={styles.input} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Themba Zwane" />

        <label style={styles.label}>Country</label>
        <select style={styles.input} value={country} onChange={e => setCountry(e.target.value)}>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>

        <label style={styles.label}>Position</label>
        <select style={styles.input} value={position} onChange={e => setPosition(e.target.value as Position)}>
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <label style={styles.label}>Shirt number</label>
        <input style={styles.input} type="number" min={1} max={99} value={shirtNumber}
          onChange={e => setShirtNumber(Number(e.target.value))} required />

        <label style={styles.label}>Your clip (1–5 seconds, vertical preferred)</label>
        <div style={styles.uploadBox} onClick={() => fileRef.current?.click()}>
          {clip ? <span>{clip.name}</span> : <span style={{ color: "var(--grey)" }}>Tap to select video</span>}
          <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }}
            onChange={e => setClip(e.target.files?.[0] || null)} />
        </div>

        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.btn} disabled={uploading}>
          {uploading ? "Uploading…" : "Generate my intro →"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", padding: "2rem", maxWidth: "480px", margin: "0 auto" },
  heading: { fontSize: "1.75rem", fontWeight: 800, marginTop: "2rem", marginBottom: "1.5rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  label: { fontWeight: 600, fontSize: "0.9rem", color: "var(--grey)" },
  input: { background: "#111827", border: "1px solid #374151", borderRadius: "10px", padding: "0.75rem 1rem", color: "var(--white)", fontSize: "1rem", width: "100%" },
  uploadBox: { background: "#111827", border: "2px dashed #374151", borderRadius: "10px", padding: "2rem", textAlign: "center", cursor: "pointer" },
  btn: { marginTop: "1rem", background: "var(--gold)", color: "#000", border: "none", borderRadius: "12px", padding: "1rem", fontSize: "1rem", fontWeight: 700 },
  error: { color: "#EF4444", fontSize: "0.9rem" },
};
