export type NodeType = 'icon' | 'text' | 'image';

export interface BaseNode {
  id: string;
  type: NodeType;
  x?: number;
  y?: number;
}

export interface IconNode extends BaseNode {
  type: 'icon';
  title: string;
  iconPath: string;
}

export interface TextNode extends BaseNode {
  type: 'text';
  content: string;
  width?: number;
  height?: number;
}

export interface ImageNode extends BaseNode {
  type: 'image';
  imageUrl: string;
  width: number;
  height: number;
}

export interface NodeLink {
  source: string;
  target: string;
}

export type Node = IconNode | TextNode | ImageNode;