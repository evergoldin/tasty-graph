'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
    text: "Once we accept loneliness, we can get creative: we can start to send out messages in a bottle: we can sing, write poetry, produce books and blogs, activities stemming from the realisation that people around us won't ever fully get us but that others – separated across time and space – might just.– The history of art is the record of people who couldn't find anyone in the vicinity to talk to. We can take up the coded offer of intimacy in the words of a Roman poet who died in 10BC or the lyrics of a singer who described just our blues in a recording from Nashville in 1963.",
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

// Custom Note Node component
function NoteNode({ data }: NodeProps<NodeData>) {
  return (
    <div className={styles.noteNode}>
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
        {data.text && <div>{data.text}</div>}
        {data.image && <img src={data.image} alt="Pasted content" className={styles.nodeImage} />}
      </div>
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
};

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showSidebar, setShowSidebar] = useState(true);

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

  return (
    <div className={styles.page}>
      <div className={styles.sidebar} style={{ display: showSidebar ? 'block' : 'none' }}>
        <button 
          className={styles.toggleButton}
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? '←' : '→'}
        </button>
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
