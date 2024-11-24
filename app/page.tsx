import styles from "./page.module.css";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";

export default function Home() {
  return (
    <div className={styles.container}>
      <Sidebar />
      <Canvas />
    </div>
  );
}
