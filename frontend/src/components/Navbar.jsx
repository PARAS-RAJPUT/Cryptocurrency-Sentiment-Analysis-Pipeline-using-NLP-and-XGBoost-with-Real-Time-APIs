import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

const LINKS = [
  { to: "/",          label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/predict",   label: "Predict"   },
];

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/" className={styles.logo}>
        <span className={styles.icon}>₿</span>
        Crypto<span>Sentiment</span>
      </NavLink>
      <ul className={styles.links}>
        {LINKS.map(({ to, label }) => (
          <li key={to}>
            <NavLink to={to} end={to === "/"} className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`}>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
