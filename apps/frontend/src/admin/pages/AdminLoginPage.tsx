import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApiClient } from "../../shared/api/adminClient";
import { useAdminAuthStore } from "../../shared/auth/adminAuthStore";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAdminAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await adminApiClient.post("/auth/login", { email, password });
      setSession({ token: data.token, email: data.user.email, role: data.user.role });
      navigate("/admin/clients");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <form onSubmit={handleSubmit} className="card card--pad" style={{ width: 340 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            margin: "0 auto 14px",
            background: "linear-gradient(135deg, var(--brand), #8b5cf6)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontSize: 22,
          }}
        >
          ◆
        </div>
        <h2 style={{ textAlign: "center", marginBottom: 18 }}>Panel de administración</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </form>
    </div>
  );
}
