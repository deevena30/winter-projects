import { Link } from "react-router-dom";
import styles from "./styles/Header.module.css";

export default function Header() {
  return (
    <header className={styles.navbar}>
      <h2 className={styles.logo}>Winter Projects</h2>

      <nav className={styles.links}>
        <Link to="/">Home</Link>
        <Link to="/courses">Projects</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/signin" className={styles.signin}>Sign In</Link>
      </nav>
    </header>
  );
}
