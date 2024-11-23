import Image from 'next/image';
import { Handle, Position, NodeProps } from 'reactflow';

const ImageNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-white p-2 rounded-lg shadow-md">
      <Handle type="target" position={Position.Left} />
      <div className="w-[200px] h-[200px] relative">
        <Image
          src={data.src}
          alt={data.alt}
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default ImageNode; 