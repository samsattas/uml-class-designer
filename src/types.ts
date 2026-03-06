export type RelationType = 'association' | 'inheritance' | 'aggregation' | 'composition';

export interface Attribute {
  id: string;
  name: string;
  type: string;
  isList: boolean;
}

export interface Method {
  id: string;
  name: string;
  returnType: string;
}

export interface ClassData {
  id: number;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  attributes: Attribute[];
  methods: Method[];
}

export interface Connection {
  from: number;
  to: number;
  type: RelationType;
  attributeName: string;
  isList: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
