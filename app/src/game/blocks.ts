import { BlockId, Grid } from '../types';

export interface BlockDef {
  id: BlockId;
  label: string;
  color: string;
}

export const BLOCK_TYPES: BlockDef[] = [
  { id: 'grass', label: 'Grass', color: '#5FAE4A' },
  { id: 'dirt', label: 'Dirt', color: '#8B5A2B' },
  { id: 'stone', label: 'Stone', color: '#9AA0A6' },
  { id: 'wood', label: 'Wood', color: '#A9662F' },
  { id: 'water', label: 'Water', color: '#3E9BE0' },
  { id: 'brick', label: 'Brick', color: '#B5332E' },
  { id: 'sand', label: 'Sand', color: '#E8D08A' },
];

export const BLOCK_COLORS: Record<BlockId, string> = BLOCK_TYPES.reduce(
  (acc, b) => {
    acc[b.id] = b.color;
    return acc;
  },
  {} as Record<BlockId, string>
);

export const GRID_ROWS = 16;
export const GRID_COLS = 10;

export function createEmptyGrid(rows = GRID_ROWS, cols = GRID_COLS): Grid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
}
