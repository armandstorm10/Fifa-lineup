import { useNavigate } from "react-router-dom";
import { Template } from "@lineupai/shared";

const TEMPLATES: { id: Template; label: string; accent: string; desc: string }[] = [
  { id: "world-cup-gold", label: "World Cup Gold", accent: "#FFD700", desc: "Classic gold & white broadcast style" },
  { id: "champions-league-navy", label: "Champions League", accent: "#1E3A8A", desc: "Deep navy with star accents" },
  { id: "stadium-night", label: "Stadium Night", accent: "#00B140", desc: "Dark atmosphere with neon green" },
];

export default function TemplatePickerPage() {
  const navigate = useNavigate();

  function pick(template: Template) {
    sessionStorage.setItem("template", template);
    navigate("/setup");
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Choose your style</h2>
      <p style={styles.sub}>Pick the broadcast template that matches your vibe.</p>
      <div style={styles.grid}>
        {TEMPLATES.map((t) => (
          <button key={t.id} style={{ ...styles.card, borderColor: t.accent }} onClick={() => pick(t.id)}>
            <div style={{ ...styles.preview, background: t.accent + "33" }}>
              <span style={{ ...styles.previewIcon, color: t.accent }}>▶</span>
            </div>
            <div style={styles.label}>{t.label}</div>
            <div style={styles.desc}>{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", padding: "2rem", maxWidth: "500px", margin: "0 auto" },
  heading: { fontSize: "2rem", fontWeight: 800, marginTop: "2rem", marginBottom: "0.5rem" },
  sub: { color: "var(--grey)", marginBottom: "2rem" },
  grid: { display: "flex", flexDirection: "column", gap: "1rem" },
  card: {
    background: "#111827",
    border: "2px solid",
    borderRadius: "16px",
    padding: "1.25rem",
    textAlign: "left",
    color: "var(--white)",
    transition: "transform 0.15s",
  },
  preview: { borderRadius: "8px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" },
  previewIcon: { fontSize: "2rem" },
  label: { fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.25rem" },
  desc: { color: "var(--grey)", fontSize: "0.9rem" },
};
