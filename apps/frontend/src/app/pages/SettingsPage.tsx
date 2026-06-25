import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  changePassword,
  createTeamMember,
  deleteTeamMember,
  listTeam,
  type StoreUserRole,
} from "../../shared/api/team";
import { IconPlus, IconTrash, IconUsers } from "../../shared/components/icons";

const ROLE_LABELS: Record<StoreUserRole, string> = {
  ADMIN: "Administrador",
  EDITOR: "Editor",
  VIEWER: "Solo lectura",
};

function apiError(e: unknown, fallback: string): string {
  if (typeof e === "object" && e && "response" in e) {
    const resp = (e as { response?: { data?: { error?: string; message?: string } } }).response;
    return resp?.data?.error ?? resp?.data?.message ?? fallback;
  }
  return fallback;
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const teamQuery = useQuery({ queryKey: ["team"], queryFn: listTeam });

  // --- Form de nueva cuenta ---
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EDITOR" as StoreUserRole });
  const [createError, setCreateError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => createTeamMember(form),
    onSuccess: () => {
      setForm({ name: "", email: "", password: "", role: "EDITOR" });
      setCreateError(null);
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e) => setCreateError(apiError(e, "No se pudo crear la cuenta")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });

  // --- Cambio de contraseña ---
  const isTeamAccount = Boolean(teamQuery.data?.currentTeamUserId);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const passwordMutation = useMutation({
    mutationFn: () => changePassword(pwd.current, pwd.next),
    onSuccess: () => {
      setPwd({ current: "", next: "", confirm: "" });
      setPwdMsg({ type: "ok", text: "Contraseña actualizada correctamente." });
    },
    onError: (e) => setPwdMsg({ type: "error", text: apiError(e, "No se pudo cambiar la contraseña") }),
  });

  const users = teamQuery.data?.users ?? [];
  const currentId = teamQuery.data?.currentTeamUserId;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Configuración</h1>
          <div className="page__title-sub">Gestioná las cuentas que acceden al panel y tu contraseña.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>
        {/* ===== Cuentas del equipo ===== */}
        <div className="card card--pad">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <IconUsers style={{ width: 18, height: 18, color: "var(--brand)" }} /> Cuentas del equipo
          </h3>
          <p className="help" style={{ marginTop: 0 }}>
            Creá cuentas con email y contraseña para que tu equipo administre las cucardas. Ingresan desde{" "}
            <strong>/login</strong>.
          </p>

          {/* Form nueva cuenta */}
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="field">
              <label className="label">Nombre</label>
              <input className="input" value={form.name} placeholder="Opcional" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.email} placeholder="persona@email.com" onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Contraseña * (mín. 8)</label>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Rol</label>
              <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StoreUserRole })}>
                {(Object.keys(ROLE_LABELS) as StoreUserRole[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>
          {createError && <p style={{ color: "var(--danger)", fontSize: 13, margin: "8px 0 0" }}>{createError}</p>}
          <button
            className="btn btn--primary btn--sm"
            style={{ marginTop: 12 }}
            disabled={!form.email || form.password.length < 8 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <IconPlus /> Crear cuenta
          </button>

          {/* Lista */}
          <div className="table-wrap" style={{ marginTop: 18 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th>Rol</th>
                  <th style={{ textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={3}><div className="empty" style={{ padding: 20 }}>Todavía no hay cuentas de equipo.</div></td></tr>
                )}
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.name || u.email}</div>
                      {u.name && <div className="muted" style={{ fontSize: 12 }}>{u.email}</div>}
                      {u.id === currentId && <span className="pill pill--brand" style={{ marginTop: 4 }}>Tu sesión</span>}
                    </td>
                    <td><span className="pill pill--muted">{ROLE_LABELS[u.role]}</span></td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn--ghost btn--icon"
                        title="Eliminar"
                        style={{ color: "var(--danger)" }}
                        disabled={u.id === currentId}
                        onClick={() => {
                          if (confirm(`¿Eliminar la cuenta de ${u.email}?`)) deleteMutation.mutate(u.id);
                        }}
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== Cambio de contraseña ===== */}
        <div className="card card--pad">
          <h3 style={{ marginBottom: 4 }}>Cambiar contraseña</h3>
          {!isTeamAccount ? (
            <p className="help" style={{ marginTop: 4 }}>
              Iniciaste sesión con tu cuenta de <strong>Tiendanube</strong>, así que tu contraseña se gestiona desde
              Tiendanube. El cambio de contraseña aplica a las cuentas de equipo (las que ingresan por <strong>/login</strong>).
            </p>
          ) : (
            <>
              <p className="help" style={{ marginTop: 4 }}>Actualizá la contraseña de tu cuenta de equipo.</p>
              <div className="field" style={{ marginTop: 10 }}>
                <label className="label">Contraseña actual</label>
                <input className="input" type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Nueva contraseña (mín. 8)</label>
                <input className="input" type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Repetir nueva contraseña</label>
                <input className="input" type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
              </div>
              {pwdMsg && (
                <p style={{ color: pwdMsg.type === "ok" ? "var(--success)" : "var(--danger)", fontSize: 13, margin: "8px 0 0" }}>
                  {pwdMsg.text}
                </p>
              )}
              <button
                className="btn btn--primary btn--sm"
                style={{ marginTop: 12 }}
                disabled={
                  !pwd.current ||
                  pwd.next.length < 8 ||
                  pwd.next !== pwd.confirm ||
                  passwordMutation.isPending
                }
                onClick={() => {
                  setPwdMsg(null);
                  if (pwd.next !== pwd.confirm) {
                    setPwdMsg({ type: "error", text: "Las contraseñas no coinciden." });
                    return;
                  }
                  passwordMutation.mutate();
                }}
              >
                Actualizar contraseña
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
