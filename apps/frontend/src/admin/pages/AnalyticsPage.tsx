import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAnalyticsOverview } from "../../shared/api/admin";

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-analytics"], queryFn: getAnalyticsOverview });

  return (
    <div className="page">
      <h1 style={{ marginTop: 0 }}>Analytics</h1>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#5b6770" }}>Tiendas activas</p>
          <p style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 700 }}>{isLoading ? "—" : data?.activeStores}</p>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#5b6770" }}>Tiendas suspendidas</p>
          <p style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 700 }}>{isLoading ? "—" : data?.suspendedStores}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Diseños creados (últimos 30 días)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data?.designsByDay.map((d) => ({ ...d, day: formatDay(d.day) })) ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" fill="#0a3d2e" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Errores por día (últimos 30 días)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data?.errorsByDay.map((d) => ({ ...d, day: formatDay(d.day) })) ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" fill="#b3261e" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
