import React from 'react';
import Image from 'next/image';

const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, data?: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, data }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4">Elements</h2>
        
        {/* Note Block */}
        <div
          className="bg-yellow-100 p-3 rounded-lg cursor-move hover:shadow-md transition-shadow"
          draggable
          onDragStart={(e) => onDragStart(e, 'noteNode', { note: 'Double click to edit' })}
        >
          Note Block
        </div>

        {/* Image Block */}
        <div
          className="bg-blue-100 p-3 rounded-lg cursor-move hover:shadow-md transition-shadow"
          draggable
          onDragStart={(e) => onDragStart(e, 'imageNode', { 
            src: '/vercel.svg',
            alt: 'Sample Image'
          })}
        >
          Image Block
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 