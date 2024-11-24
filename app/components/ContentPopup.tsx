import { SimilarContent } from '../utils/embeddings';
import styles from './ContentPopup.module.css';

interface ContentPopupProps {
  x: number;
  y: number;
  contents: SimilarContent[] | null;
  isLoading: boolean;
  onSelect: (content: SimilarContent) => void;
}

export default function ContentPopup({ x, y, contents, isLoading, onSelect }: ContentPopupProps) {
  return (
    <div 
      className={styles.popup}
      style={{
        left: x,
        top: y
      }}
    >
      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Finding similar content...</p>
        </div>
      ) : (
        contents?.map((content) => (
          <div 
            key={content.id}
            className={styles.popupItem}
            onClick={() => onSelect(content)}
          >
            <div className={styles.fileName}>
              {content.fileName}
            </div>
            <div className={styles.similarityScore}>
              Similarity: {(content.similarity * 100).toFixed(1)}%
            </div>
          </div>
        ))
      )}
    </div>
  );
} 