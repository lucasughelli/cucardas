import { NavLink, Outlet } from "react-router-dom";
import { IconAlert, IconChart, IconUsers } from "../shared/components/icons";
import { useAdminAuthStore } from "../shared/auth/adminAuthStore";

const links = [
  { to: "/admin/clients", label: "Clientes", icon: IconUsers },
  { to: "/admin/errors", label: "Errores", icon: IconAlert },
  { to: "/admin/analytics", label: "Analytics", icon: IconChart },
];

export function AdminLayout() {
  const { email, clearSession } = useAdminAuthStore();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__brand-logo">◆</span>
          Cucardas Admin
        </div>
        <div className="sidebar__section">Panel interno</div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
              <Icon />
              {link.label}
            </NavLink>
          );
        })}
        <div className="sidebar__spacer" />
        <div className="sidebar__footer">{email}</div>
        <button className="btn btn--ghost btn--sm" onClick={clearSession} style={{ marginTop: 8 }}>
          Cerrar sesión
        </button>
      </aside>
      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
