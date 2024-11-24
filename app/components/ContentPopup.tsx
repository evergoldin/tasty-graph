import { SimilarContent } from '../utils/embeddings';
import styles from './ContentPopup.module.css';

interface ContentPopupProps {
  x: number;
  y: number;
  contents: SimilarContent[];
  onSelect: (content: SimilarContent) => void;
}

export default function ContentPopup({ x, y, contents, onSelect }: ContentPopupProps) {
  return (
    <div 
      className={styles.popup}
      style={{
        left: x,
        top: y
      }}
    >
      {contents.map((content) => (
        <div 
          key={content.id}
          className={styles.popupItem}
          onClick={() => onSelect(content)}
        >
          <div className={styles.popupContent}>
            {content.content}
          </div>
          <div className={styles.similarityScore}>
            Similarity: {(content.similarity * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
} 