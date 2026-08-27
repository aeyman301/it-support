export type BlockId = 'grass' | 'dirt' | 'stone' | 'wood' | 'water' | 'brick' | 'sand';

export type Grid = (BlockId | null)[][];

export interface RemotePlayer {
  id: string;
  name: string;
  color: string;
  row: number;
  col: number;
}

export interface World {
  id: string;
  name: string;
  rows: number;
  cols: number;
  grid: Grid;
  createdAt: number;
  updatedAt: number;
}

export interface WorldSummary {
  id: string;
  name: string;
  updatedAt: number;
}
