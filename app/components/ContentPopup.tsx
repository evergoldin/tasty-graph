import { ContentBlock } from '../types/content';
import styles from './ContentPopup.module.css';

interface ContentPopupProps {
  x: number;
  y: number;
  contents: ContentBlock[];
  onSelect: (content: ContentBlock) => void;
}

export default function ContentPopup({ x, y, contents, onSelect }: ContentPopupProps) {
  return (
    <div 
      className={styles.popup}
      style={{
        left: x,
        top: y,
      }}
    >
      {contents.map((content) => (
        <div 
          key={content.id}
          className={styles.popupItem}
          onClick={() => onSelect(content)}
        >
          <h4>{content.fileName}</h4>
          <p>{content.content.substring(0, 100)}...</p>
        </div>
      ))}
    </div>
  );
} 