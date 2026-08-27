import AsyncStorage from '@react-native-async-storage/async-storage';
import { World, WorldSummary } from '../types';
import { createEmptyGrid, GRID_ROWS, GRID_COLS } from '../game/blocks';

const INDEX_KEY = 'sandbox:worldIndex';
const worldKey = (id: string) => `sandbox:world:${id}`;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listWorlds(): Promise<WorldSummary[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  const index: WorldSummary[] = raw ? JSON.parse(raw) : [];
  return index.sort((a, b) => b.updatedAt - a.updatedAt);
}

async function saveIndex(index: WorldSummary[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

async function upsertIndexEntry(entry: WorldSummary): Promise<void> {
  const index = await listWorlds();
  const i = index.findIndex((w) => w.id === entry.id);
  if (i >= 0) index[i] = entry;
  else index.unshift(entry);
  await saveIndex(index);
}

export async function createWorld(name: string): Promise<World> {
  const world: World = {
    id: newId(),
    name,
    rows: GRID_ROWS,
    cols: GRID_COLS,
    grid: createEmptyGrid(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(worldKey(world.id), JSON.stringify(world));
  await upsertIndexEntry({ id: world.id, name: world.name, updatedAt: world.updatedAt });
  return world;
}

export async function loadWorld(id: string): Promise<World | null> {
  const raw = await AsyncStorage.getItem(worldKey(id));
  return raw ? JSON.parse(raw) : null;
}

export async function saveWorld(world: World): Promise<World> {
  const updated: World = { ...world, updatedAt: Date.now() };
  await AsyncStorage.setItem(worldKey(updated.id), JSON.stringify(updated));
  await upsertIndexEntry({ id: updated.id, name: updated.name, updatedAt: updated.updatedAt });
  return updated;
}

export async function deleteWorld(id: string): Promise<void> {
  await AsyncStorage.removeItem(worldKey(id));
  const index = await listWorlds();
  await saveIndex(index.filter((w) => w.id !== id));
}

export function exportWorld(world: World): string {
  return JSON.stringify(world);
}

export async function importWorld(json: string): Promise<World> {
  const parsed = JSON.parse(json) as World;
  if (!parsed || !Array.isArray(parsed.grid)) {
    throw new Error('That does not look like a valid world file.');
  }
  const world: World = {
    ...parsed,
    id: newId(),
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(worldKey(world.id), JSON.stringify(world));
  await upsertIndexEntry({ id: world.id, name: world.name, updatedAt: world.updatedAt });
  return world;
}
