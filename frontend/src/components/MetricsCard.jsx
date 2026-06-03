import styles from "./MetricsCard.module.css";

export default function MetricsCard({ title, value, sub, color, icon }) {
  return (
    <div className={styles.card + " card"} style={color ? { borderColor:`${color}44` } : {}}>
      <div className={styles.top}>
        {icon && <span className={styles.icon} style={{ color }}>{icon}</span>}
        <p className={styles.title}>{title}</p>
      </div>
      <p className={styles.value} style={color ? { color } : {}}>{value ?? "—"}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  );
}
