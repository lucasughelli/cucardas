import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { teamLogin } from "../../shared/api/team";
import { useAuthStore } from "../../shared/auth/authStore";

export function TeamLoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await teamLogin(email, password);
      setSession({ token: result.token, tnStoreId: result.tnStoreId });
      navigate("/");
    } catch (err) {
      const resp = (err as { response?: { data?: { error?: string; message?: string } } }).response;
      setError(resp?.data?.error ?? resp?.data?.message ?? "Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form className="card card--pad" style={{ width: 400, maxWidth: "100%" }} onSubmit={submit}>
        <div
          style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 18px",
            background: "linear-gradient(135deg, var(--brand), #8b5cf6)",
            display: "grid", placeItems: "center", color: "#fff", fontSize: 26,
          }}
        >
          ◆
        </div>
        <h1 style={{ textAlign: "center" }}>Cucardas</h1>
        <p style={{ color: "var(--text-2)", textAlign: "center", marginTop: 6 }}>
          Ingresá con tu cuenta de equipo.
        </p>

        <div className="field" style={{ marginTop: 16 }}>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        </div>
        <div className="field">
          <label className="label">Contraseña</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: "4px 0 0" }}>{error}</p>}

        <button className="btn btn--primary" style={{ width: "100%", marginTop: 16 }} disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <p className="help" style={{ textAlign: "center", marginTop: 14 }}>
          ¿Sos el dueño de la tienda? Ingresá desde tu panel de Tiendanube.
        </p>
      </form>
    </div>
  );
}
