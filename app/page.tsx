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
};

// Custom Note Node component
function NoteNode({ data, id }: NodeProps<NodeData>) {
  const [showPlus, setShowPlus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedNotes, setSuggestedNotes] = useState<SuggestedNote[]>([]);
  
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

  const generateImageNode = async () => {
    if (!data.text) return;
    setIsLoading(true);
    
    try {
      // First, get the search query from OpenAI
      const response = await fetch('/api/generate-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: data.text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate search query');
      }

      const { searchQuery, error: queryError } = await response.json();
      
      if (queryError) {
        throw new Error(queryError);
      }
      
      // Then, search for an image using the query
      const imageResponse = await fetch('/api/search-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
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
      console.error('Error generating image node:', error);
      // You might want to add some UI feedback here
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle node click
  const handleNodeClick = useCallback(() => {
    // Get 3 random notes from sampleNotes (replace this with your database query)
    const availableNotes = sampleNotes.filter(note => note.id !== id);
    const randomNotes = [...availableNotes]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(note => ({
        id: note.id,
        text: note.text,
        preview: note.text.substring(0, 100) + '...'
      }));

    setSuggestedNotes(randomNotes);
    setShowSuggestions(true);
  }, [id]);

  // Add function to handle suggestion selection
  const handleSuggestionSelect = useCallback((selectedNote: SuggestedNote) => {
    const parentNode = getNode(id);
    if (!parentNode) return;

    // Create new node
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'noteNode',
      position: {
        x: parentNode.position.x + 300,
        y: parentNode.position.y,
      },
      data: { text: selectedNote.text },
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
  }, [id, getNode, setNodes, setEdges]);

  return (
    <div 
      className={styles.noteNode}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleNodeClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
      />
      <div className={styles.noteContent}>
        {data.title && <div className={styles.noteTitle}>{data.title}</div>}
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
              generateImageNode();
            }}
            disabled={isLoading}
          >
            {isLoading ? '...' : '+'}
          </button>
        )}
      </div>
      
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
                {note.preview}
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

// Add a new type for node data
type NodeData = {
  text?: string;
  image?: string;
  title?: string;
  id?: string;
  credit?: {
    name: string;
    username: string;
    link: string;
  };
};

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        data: { text: 'New note...' },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, setNodes]
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

        const newNode: Node<NodeData> = {
          id: `node-${nodes.length + 1}`,
          type: 'noteNode',
          position,
          data: { text: noteData.text },
        };

        setNodes((nds) => [...nds, newNode]);
      }
    },
    [nodes, setNodes]
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

    // Calculate a grid layout
    const GRID_SPACING = 300;
    const NODES_PER_ROW = 3;

    // Create an array to store all promises
    const fileReadPromises = Array.from(files).map((file) => {
      return new Promise<Node<NodeData>>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          resolve({
            id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'noteNode',
            data: { 
              text: content,
              title: file.name 
            },
            // We'll set the position after we have all nodes
            position: { x: 0, y: 0 },
          });
        };
        reader.readAsText(file);
      });
    });

    // Wait for all files to be read
    Promise.all(fileReadPromises).then((newNodes) => {
      // Position all nodes in a grid
      const positionedNodes = newNodes.map((node, index) => {
        const row = Math.floor(index / NODES_PER_ROW);
        const col = index % NODES_PER_ROW;
        
        return {
          ...node,
          position: {
            x: 100 + (col * GRID_SPACING),
            y: 100 + (row * GRID_SPACING),
          }
        };
      });

      setNodes((nds) => [...nds, ...positionedNodes]);
    });
  }, []);

  const handleLabelClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.page}>
      <div className={styles.sidebar} style={{ display: showSidebar ? 'block' : 'none' }}>
        <button 
          className={styles.toggleButton}
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? '←' : '→'}
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
        </div>
        <div className={styles.notesList}>
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
