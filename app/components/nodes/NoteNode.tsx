import { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const NoteNode = ({ data }: NodeProps) => {
  const [note, setNote] = useState(data.note || 'Double click to edit');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-yellow-100 p-3 rounded-lg min-w-[200px] min-h-[100px]" onDoubleClick={() => setIsEditing(true)}>
      <Handle type="target" position={Position.Left} />
      {isEditing ? (
        <textarea
          className="w-full h-full min-h-[80px] p-2 rounded border"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => setIsEditing(false)}
          autoFocus
        />
      ) : (
        <p>{note}</p>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default NoteNode; 