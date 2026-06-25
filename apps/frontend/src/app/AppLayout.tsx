import { NavLink, Outlet, useLocation } from "react-router-dom";
import { IconBox, IconCard, IconDashboard, IconSettings, IconTag } from "../shared/components/icons";

const sections = [
  {
    title: "Gestión",
    links: [
      { to: "/", label: "Dashboard", end: true, icon: IconDashboard },
      { to: "/cucardas", label: "Cucardas", icon: IconTag },
      { to: "/products", label: "Productos", icon: IconBox },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { to: "/subscription", label: "Plan y facturación", icon: IconCard },
      { to: "/settings", label: "Configuración", icon: IconSettings },
    ],
  },
];

function currentCrumb(pathname: string): string {
  if (pathname.startsWith("/cucardas")) return "Cucardas";
  if (pathname.startsWith("/products")) return "Productos";
  if (pathname.startsWith("/subscription")) return "Plan y facturación";
  if (pathname.startsWith("/settings")) return "Configuración";
  if (pathname.startsWith("/editor")) return "Editor de imagen";
  return "Dashboard";
}

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__brand-logo">◆</span>
          Cucardas
        </div>
        {sections.map((section) => (
          <div key={section.title}>
            <div className="sidebar__section">{section.title}</div>
            {section.links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={"end" in link ? link.end : undefined}
                  className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                >
                  <Icon />
                  {link.label}
                </NavLink>
              );
            })}
          </div>
        ))}
        <div className="sidebar__spacer" />
        <a
          className="nav-item"
          href="mailto:soporte@tudominio.com"
          style={{ fontSize: 13 }}
        >
          Ayuda y soporte
        </a>
        <div className="sidebar__footer">App de Cucardas · Tiendanube</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar__crumbs">
            <span>Cucardas</span>
            <span>/</span>
            <strong>{currentCrumb(location.pathname)}</strong>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
