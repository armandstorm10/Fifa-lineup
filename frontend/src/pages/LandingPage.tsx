import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={styles.container}>
      <div style={styles.badge}>⚽ FIFA World Cup 2026</div>
      <h1 style={styles.title}>
        Your <span style={{ color: "var(--gold)" }}>Broadcast Intro.</span>
        <br />Your Moment.
      </h1>
      <p style={styles.sub}>
        Turn a 5-second clip into a stadium-worthy starting lineup intro.
        <br />Built for Instagram Reels, TikTok & WhatsApp.
      </p>
      <button style={styles.cta} onClick={() => navigate("/templates")}>
        Create your intro →
      </button>
      <p style={styles.free}>Free to try · No account needed</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    textAlign: "center",
    background: "radial-gradient(ellipse at 50% 0%, #1a2a4a 0%, #0A0E1A 70%)",
  },
  badge: {
    background: "rgba(255,215,0,0.15)",
    border: "1px solid var(--gold)",
    color: "var(--gold)",
    borderRadius: "999px",
    padding: "0.4rem 1.2rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "2rem",
    letterSpacing: "0.05em",
  },
  title: {
    fontSize: "clamp(2rem, 8vw, 3.5rem)",
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: "1.5rem",
  },
  sub: {
    color: "var(--grey)",
    fontSize: "1.1rem",
    lineHeight: 1.6,
    maxWidth: "480px",
    marginBottom: "2.5rem",
  },
  cta: {
    background: "var(--gold)",
    color: "#000",
    border: "none",
    borderRadius: "12px",
    padding: "1rem 2.5rem",
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    marginBottom: "1rem",
  },
  free: {
    color: "var(--grey)",
    fontSize: "0.85rem",
  },
};
