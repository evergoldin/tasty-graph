'use client';

import { useState, useCallback, useEffect, useRef, ChangeEvent } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  NodeProps,
  OnConnectStart,
  OnConnectEnd,
  Handle,
  Position,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './page.module.css';

// Sample notes data
const sampleNotes = [
  {
    id: 'note-1',
    text: "Above all, don't ask what to believe—ask what to anticipate. Every question of belief should flow from a question of anticipation, and that question of anticipation should be the center of the inquiry. Every guess of belief should begin by flowing to a specific guess of anticipation, and should continue to pay rent in future anticipations. If a belief turns deadbeat, evict it.",
  },
  {
    id: 'note-2',
    text: "Once we accept loneliness, we can get creative: we can start to send out messages in a bottle: we can sing, write poetry, produce books and blogs, activities stemming from the realisation that people around us won't ever fully get us but that others  separated across time and space – might just.– The history of art is the record of people who couldn't find anyone in the vicinity to talk to. We can take up the coded offer of intimacy in the words of a Roman poet who died in 10BC or the lyrics of a singer who described just our blues in a recording from Nashville in 1963.",
  },
  {
    id: 'note-3',
    text: "But metacognition is an inherently dynamic process, evolving continuously as readers' own conceptions evolve. Books are static. Prose can frame or stimulate readers' thoughts, but prose can't behave or respond to those thoughts as they unfold in each reader's head. The reader must plan and steer their own feedback loops.",
  },
  {
    id: 'note-4',
    text: "Similarly, major corporations on the hook for runaway projects may be able to keep things going by borrowing more and more money. Governments can also pile up debt. Or raise taxes. But most ordinary folks and small businesses cannot draw on a big stockpile of wealth, run up debt, or raise taxes. If they start a project that hurtles toward the fat tail of the distribution, they will simply be wiped out, giving them even more reason than a corporate executive or government official to take the danger seriously",
  },
];

// Add these new types at the top with other type definitions
type SuggestedNote = {
  id: string;
  text: string;
  preview: string;
  similarity: number;
};

// Add this type near the top with other type definitions
type ImportedNote = {
  id: string;
  title: string;
  content: string;
  author?: string;
  location?: string;
  date?: string;
};

// First, update the NodeData type to better handle titles
type NodeData = {
  text?: string;
  image?: string;
  title?: string;
  id?: string;
  isTitle?: boolean; // Add this field
  credit?: {
    name: string;
    username: string;
    link: string;
  };
  importedNotes?: ImportedNote[];
  originalId?: string; // Add this field
};

// First, add this type near the top with other type definitions
type SearchQuery = {
  id: string;
  query: string;
};

// Add these types to your existing types
interface NoteWithEmbedding {
  id: string;
  text: string;
  embedding?: number[];
}

// Custom Note Node component
function NoteNode({ data, id }: NodeProps<NodeData>) {
  const [showPlus, setShowPlus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedNotes, setSuggestedNotes] = useState<SuggestedNote[]>([]);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [showQueries, setShowQueries] = useState(false);
  
  // Get setNodes from context
  const { setNodes, setEdges, getNode } = useReactFlow();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowPlus(true);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Check if we're moving towards the plus button
    const buttonElement = e.currentTarget.querySelector(`.${styles.plusButton}`);
    if (buttonElement) {
      const buttonRect = buttonElement.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // If moving towards the button, don't hide immediately
      if (mouseX > buttonRect.left - 20 && mouseX < buttonRect.right + 20 &&
          mouseY > buttonRect.top - 20 && mouseY < buttonRect.bottom + 20) {
        return;
      }
    }

    // Add a small delay before hiding
    timeoutRef.current = setTimeout(() => {
      setShowPlus(false);
    }, 300);
  };

  const generateSearchQueries = async () => {
    if (!data.text) return;
    setIsLoading(true);
    
    try {
      // Get multiple search queries from OpenAI
      const response = await fetch('/api/generate-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: data.text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate search queries');
      }

      const { searchQueries, error: queryError } = await response.json();
      
      if (queryError) {
        throw new Error(queryError);
      }

      // Format the queries
      const formattedQueries = searchQueries.map((query: string, index: number) => ({
        id: `query-${index}`,
        query
      }));
      
      setSearchQueries(formattedQueries);
      setShowQueries(true);
    } catch (error) {
      console.error('Error generating search queries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImageFromQuery = async (query: string) => {
    setIsLoading(true);
    try {
      const imageResponse = await fetch('/api/search-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image');
      }

      const { imageUrl, credit, error: imageError } = await imageResponse.json();
      
      if (imageError) {
        throw new Error(imageError);
      }
      
      // Create a new node with the image
      setNodes((nodes) => {
        const parentNode = nodes.find((n) => n.id === id);
        if (!parentNode) return nodes;
        
        const newNode = {
          id: `node-${Date.now()}`,
          type: 'noteNode',
          position: {
            x: parentNode.position.x + 300,
            y: parentNode.position.y,
          },
          data: { 
            image: imageUrl,
            title: 'Generated Image',
            credit
          },
        };
        
        return [...nodes, newNode];
      });
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsLoading(false);
      setShowQueries(false);
    }
  };

  // Add this function to handle node click
  const handleNodeClick = useCallback(async () => {
    if (!data.text) return;
    
    setIsLoading(true);
    try {
      // Get all notes excluding the current one using originalId
      const allNotes = [
        ...sampleNotes.filter(note => note.id !== data.originalId),
        ...(data.importedNotes || []).map(note => ({
          id: note.id,
          text: note.content
        })).filter(note => note.id !== data.originalId)
      ];

      const response = await fetch('/api/vector-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: data.text,
          notes: allNotes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch similar notes');
      }

      const { similarNotes } = await response.json();
      setSuggestedNotes(similarNotes);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error finding similar notes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [data.text, data.importedNotes, data.originalId]);

  // Add function to handle suggestion selection
  const handleSuggestionSelect = useCallback((selectedNote: SuggestedNote) => {
    const parentNode = getNode(id);
    if (!parentNode) return;

    // Create new node with position up and to the left
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'noteNode',
      position: {
        x: parentNode.position.x - 300,
        y: parentNode.position.y - 100,
      },
      data: { 
        text: selectedNote.text,
        importedNotes: data.importedNotes
      },
    };

    // Create connection
    const newEdge = {
      id: `edge-${Date.now()}`,
      source: id,
      target: newNode.id,
    };

    setNodes((nodes) => [...nodes, newNode]);
    setEdges((edges) => [...edges, newEdge]);
    setShowSuggestions(false);
  }, [id, getNode, setNodes, setEdges, data.importedNotes]);

  return (
    <div 
      className={`${styles.noteNode} ${data.isTitle ? styles.titleNode : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleNodeClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`${styles.handle} ${styles.handleTop}`}
        style={{ width: '15px', height: '15px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={`${styles.handle} ${styles.handleBottom}`}
        style={{ width: '15px', height: '15px' }}
      />
      <div className={styles.noteContent}>
        {data.isTitle ? (
          <div className={styles.standaloneTitleText}>{data.title}</div>
        ) : (
          <>
            {data.text && <div>{data.text}</div>}
            {data.image && (
              <div className={styles.imageContainer}>
                <img src={data.image} alt="Generated content" className={styles.nodeImage} />
                {data.credit && (
                  <a 
                    href={data.credit.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.imageCredit}
                  >
                    Photo by {data.credit.name}
                  </a>
                )}
              </div>
            )}
            {showPlus && data.text && (
              <button 
                className={styles.plusButton}
                onClick={(e) => {
                  e.stopPropagation();
                  generateSearchQueries();
                }}
                disabled={isLoading}
              >
                {isLoading ? '...' : '+'}
              </button>
            )}
          </>
        )}
      </div>
      
      {showQueries && (
        <div className={styles.queriesPanel}>
          <div className={styles.queriesHeader}>
            Select an Image Query
            <button 
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowQueries(false);
              }}
            >
              ×
            </button>
          </div>
          <div className={styles.queriesList}>
            {searchQueries.map((query) => (
              <button
                key={query.id}
                className={styles.queryButton}
                onClick={(e) => {
                  e.stopPropagation();
                  generateImageFromQuery(query.query);
                }}
              >
                {query.query}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {showSuggestions && (
        <div className={styles.suggestionsPanel}>
          <div className={styles.suggestionsHeader}>
            Related Notes
            <button 
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowSuggestions(false);
              }}
            >
              ×
            </button>
          </div>
          <div className={styles.suggestionsList}>
            {suggestedNotes.map((note) => (
              <div
                key={note.id}
                className={styles.suggestionItem}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSuggestionSelect(note);
                }}
              >
                <div className={styles.suggestionPreview}>{note.preview}</div>
                <div className={styles.similarityScore}>
                  Similarity: {(note.similarity * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  noteNode: NoteNode,
};

// Update the parseKindleClippings function
function parseKindleClippings(text: string): ImportedNote[] {
  const notes: ImportedNote[] = [];
  const clippings = text.split('==========');
  const MAX_PAGES = 5;
  let pageCount = 0;

  for (const clipping of clippings) {
    if (pageCount >= MAX_PAGES) break;
    
    const lines = clipping.trim().split('\n');
    if (lines.length >= 2) {
      const titleLine = lines[0].trim();
      const metaLine = lines[1].trim();
      const content = lines.slice(3).join('\n').trim();

      if (content) {
        // Extract title and author from the first line
        const titleMatch = titleLine.match(/(.*?)(?:\s*-\s*(.*)|$)/);
        const title = titleMatch?.[1]?.trim() || 'Untitled';
        const author = titleMatch?.[2]?.trim();

        // Extract location and date from metadata line
        const locationMatch = metaLine.match(/Location\s+(\d+-\d+)/);
        const dateMatch = metaLine.match(/Added on\s+(.+)$/);

        notes.push({
          id: `kindle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          content,
          author,
          location: locationMatch?.[1],
          date: dateMatch?.[1]
        });
        
        pageCount++;
      }
    }
  }

  return notes;
}

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedNotes, setImportedNotes] = useState<ImportedNote[]>([]);
  const [notes, setNotes] = useState<NoteWithEmbedding[]>([]);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingsGenerated, setEmbeddingsGenerated] = useState(false);

  // Handle right-click to create new node
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const newNode: Node<NodeData> = {
        id: `node-${nodes.length + 1}`,
        type: 'noteNode',
        position: {
          x: event.clientX,
          y: event.clientY,
        },
        data: { 
          text: 'New note...',
          importedNotes
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, setNodes, importedNotes]
  );

  // Handle dropping notes onto the canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect();
      const noteData = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      if (reactFlowBounds) {
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };

        // Create title node if there's a title
        if (noteData.title) {
          const titleNode: Node<NodeData> = {
            id: `node-title-${nodes.length + 1}`,
            type: 'noteNode',
            position: {
              x: position.x,
              y: position.y - 80,
            },
            data: { 
              title: noteData.title,
              isTitle: true,
              importedNotes,
              originalId: noteData.id // Store the original ID
            },
          };

          // Create content node
          const contentNode: Node<NodeData> = {
            id: `node-${nodes.length + 1}`,
            type: 'noteNode',
            position,
            data: { 
              text: noteData.text,
              importedNotes,
              originalId: noteData.id // Store the original ID
            },
          };

          // Create edge connecting title to content
          const newEdge: Edge = {
            id: `edge-${edges.length + 1}`,
            source: titleNode.id,
            target: contentNode.id,
          };

          setNodes((nds) => [...nds, titleNode, contentNode]);
          setEdges((eds) => [...eds, newEdge]);
        } else {
          // If no title, just create the content node
          const contentNode: Node<NodeData> = {
            id: `node-${nodes.length + 1}`,
            type: 'noteNode',
            position,
            data: { 
              text: noteData.text,
              importedNotes,
              originalId: noteData.id // Store the original ID
            },
          };
          setNodes((nds) => [...nds, contentNode]);
        }
      }
    },
    [nodes, edges, setNodes, setEdges, importedNotes]
  );

  // Fix the edge creation type error
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const newEdge: Edge = {
          id: `edge-${edges.length + 1}`,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
        };
        setEdges((eds) => [...eds, newEdge]);
      }
    },
    [edges, setEdges]
  );

  // Add paste handler
  const onPaste = useCallback(
    (event: ClipboardEvent) => {
      event.preventDefault();
      const items = event.clipboardData?.items;

      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const file = item.getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (e) => {
            const imageDataUrl = e.target?.result as string;
            
            // Create a new node with the image
            const newNode: Node<NodeData> = {
              id: `node-${nodes.length + 1}`,
              type: 'noteNode',
              position: {
                x: window.innerWidth / 2 - 150,
                y: window.innerHeight / 2 - 100,
              },
              data: { image: imageDataUrl },
            };
            
            setNodes((nds) => [...nds, newNode]);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [nodes, setNodes]
  );

  // Add effect to handle paste events
  useEffect(() => {
    document.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('paste', onPaste);
    };
  }, [onPaste]);

  const handleFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileReadPromises = Array.from(files).map((file) => {
      return new Promise<{ notes: ImportedNote[], message?: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          
          // If file is My Clippings.txt, parse as Kindle clippings
          if (file.name.toLowerCase() === 'my clippings.txt') {
            const parsedNotes = parseKindleClippings(content);
            resolve({
              notes: parsedNotes,
              message: 'Note: Only the first 5 pages of clippings were imported.'
            });
          } else {
            // Handle regular markdown files as before
            resolve({
              notes: [{
                id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: file.name,
                content: content
              }]
            });
          }
        };
        reader.readAsText(file);
      });
    });

    // Wait for all files to be read and flatten the array of arrays
    Promise.all(fileReadPromises).then((results) => {
      const allNotes = results.flatMap(result => result.notes);
      setImportedNotes(prev => [...prev, ...allNotes]);
      
      // Show message if any of the results had a message
      const messages = results.map(r => r.message).filter(Boolean);
      if (messages.length > 0) {
        alert(messages[0]); // Show the first message (in this case, about Kindle clippings limit)
      }
    });
  }, []);

  const handleLabelClick = () => {
    fileInputRef.current?.click();
  };

  // Update the sidebar notes display
  const renderNoteItem = (note: ImportedNote) => (
    <div 
      key={note.id}
      className={styles.noteItem}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/reactflow', JSON.stringify({
          text: note.content,
          title: note.title,
          author: note.author,
          location: note.location,
          date: note.date
        }));
      }}
    >
      <div className={styles.noteItemTitle}>
        {note.title}
        {note.author && <span className={styles.noteItemAuthor}> - {note.author}</span>}
      </div>
      <div className={styles.noteItemPreview}>
        {note.content.substring(0, 50)}...
      </div>
      {note.location && <div className={styles.noteItemMeta}>Location: {note.location}</div>}
    </div>
  );

  // Add this function to generate embeddings
  const generateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    try {
      const response = await fetch('/api/generate-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();
      if (data.success) {
        setNotes(data.notes);
        setEmbeddingsGenerated(true);
      } else {
        console.error('Failed to generate embeddings:', data.error);
      }
    } catch (error) {
      console.error('Error generating embeddings:', error);
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  // Modify your existing search function to use stored embeddings
  const searchNotes = async (query: string) => {
    try {
      const response = await fetch('/api/vector-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: query,
          notes,
          useStoredEmbeddings: embeddingsGenerated,
        }),
      });
      // ... rest of your existing search function
    } catch (error) {
      console.error('Error searching notes:', error);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.sidebar} style={{ display: showSidebar ? 'block' : 'none' }}>
        <button 
          onClick={generateEmbeddings}
          disabled={isGeneratingEmbeddings || embeddingsGenerated}
          className={styles.generateButton}
        >
          {isGeneratingEmbeddings 
            ? 'Generating Embeddings...' 
            : embeddingsGenerated 
              ? 'Embeddings Generated' 
              : 'Generate Embeddings'}
        </button>
        
        <div className={styles.fileUpload}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            multiple
            onChange={handleFileUpload}
            className={styles.fileInput}
          />
          <label 
            className={styles.fileLabel}
            onClick={handleLabelClick}
          >
            Import Markdown Files
          </label>

          <input
            type="file"
            accept=".txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = (e) => {
                const content = e.target?.result as string;
                const kindleNotes = parseKindleClippings(content);
                setImportedNotes(prev => [...prev, ...kindleNotes]);
              };
              reader.readAsText(file);
            }}
            className={styles.fileInput}
            id="kindle-input"
          />
          <label 
            className={styles.fileLabel}
            htmlFor="kindle-input"
          >
            Import Kindle Clippings
          </label>
        </div>
        <div className={styles.notesList}>
          {/* Show imported notes first */}
          {importedNotes.map(renderNoteItem)}
          {/* Then show sample notes */}
          <div className={styles.sectionDivider}>Sample Notes</div>
          {sampleNotes.map((note) => (
            <div 
              key={note.id}
              className={styles.noteItem}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', JSON.stringify(note));
              }}
            >
              {note.text.substring(0, 50)}...
            </div>
          ))}
        </div>
      </div>
      <div className={styles.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onPaneContextMenu={onPaneContextMenu}
          nodeTypes={nodeTypes}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
