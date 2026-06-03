import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const C = { positive:"var(--pos)", negative:"var(--neg)", neutral:"var(--neu)" };

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 14px", fontSize:13 }}>
      <strong style={{ color:C[name]||"var(--text)" }}>{name}</strong>: {value}
    </div>
  );
};

export function SentimentDonut({ data, height=240 }) {
  const cd = Object.entries(data||{}).map(([name,value])=>({ name, value })).filter(d=>d.value>0);
  if (!cd.length) return <p style={{ color:"var(--muted)", textAlign:"center", padding:40, fontSize:13 }}>No data</p>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={cd} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
          {cd.map(e => <Cell key={e.name} fill={C[e.name]} />)}
        </Pie>
        <Tooltip content={<Tip />} />
        <Legend formatter={v=>v.charAt(0).toUpperCase()+v.slice(1)} iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12, color:"var(--muted)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SentimentBar({ data, height=220 }) {
  if (!data?.length) return <p style={{ color:"var(--muted)", textAlign:"center", padding:40, fontSize:13 }}>No data</p>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top:4, right:8, left:-20, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fontSize:11, fill:"var(--muted)" }} />
        <YAxis tick={{ fontSize:11, fill:"var(--muted)" }} />
        <Tooltip content={<Tip />} />
        <Bar dataKey="value" radius={[4,4,0,0]}>
          {data.map(e => <Cell key={e.name} fill={C[e.name]||"var(--accent)"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
