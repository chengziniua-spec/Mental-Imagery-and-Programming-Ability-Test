import { useEffect, useState } from "react";
import "./admin.css";
import { ParticipantList } from "./ParticipantList";
import { ParticipantDetail } from "./ParticipantDetail";
import { StatsPanel } from "./StatsPanel";
import { adminLogin, getAuthToken, onUnauthorized } from "./adminApi";

type Tab = "participants" | "stats";

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminLogin(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-app">
      <div className="admin-shell">
        <div className="admin-header">
          <h1>Study data admin</h1>
        </div>
        <div className="admin-panel" style={{ maxWidth: 340 }}>
          <h4 className="admin-section-title">Admin login</h4>
          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting || !password} style={{ marginTop: 12 }}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminApp() {
  const [authed, setAuthed] = useState(() => Boolean(getAuthToken()));
  const [tab, setTab] = useState<Tab>("participants");
  const [includeTest, setIncludeTest] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => onUnauthorized(() => setAuthed(false)), []);

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="admin-app">
      <div className="admin-shell">
        <div className="admin-header">
          <h1>Study data admin</h1>
        </div>

        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab${tab === "participants" ? " admin-tab-active" : ""}`}
            onClick={() => {
              setTab("participants");
              setSelectedId(null);
            }}
          >
            Participants
          </button>
          <button
            type="button"
            className={`admin-tab${tab === "stats" ? " admin-tab-active" : ""}`}
            onClick={() => setTab("stats")}
          >
            Stats
          </button>
        </div>

        {tab === "participants" &&
          (selectedId ? (
            <ParticipantDetail participantId={selectedId} onBack={() => setSelectedId(null)} />
          ) : (
            <ParticipantList
              includeTest={includeTest}
              onIncludeTestChange={setIncludeTest}
              onSelect={setSelectedId}
            />
          ))}

        {tab === "stats" && <StatsPanel includeTest={includeTest} />}
      </div>
    </div>
  );
}
