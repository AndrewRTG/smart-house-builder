// Tipuri pentru dispozitive
export interface Device {
  id: string;
  name: string;
  brand: string;
  type: string;
  status: string;
  col?: number;
  row?: number;
}

// Tipuri pentru linii/ziduri
export interface Line {
  id: string;
  type: string;
  start: { col: number; row: number };
  end: { col: number; row: number };
}

// Tipuri pentru Layout (cum vine din backend)
export interface Layout {
  id: number;
  name: string;
  gridData: string; // JSON stringified cu grid info
  devices: Device[];
  walls: Line[];
  createdAt?: string;
  updatedAt?: string;
}

// DTO pentru crearea unui layout nou
export interface LayoutCreateDTO {
  name: string;
  gridData: string;
  devices: Device[];
  walls: Line[];
}

// DTO pentru actualizarea unui layout
export interface LayoutUpdateDTO {
  name?: string;
  gridData?: string;
  devices?: Device[];
  walls?: Line[];
}

// Tipuri pentru grid layout dimensions
export interface GridLayout {
  offsetX: number;
  offsetY: number;
  dotSpacing: number;
}
