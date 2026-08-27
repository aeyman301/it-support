import { io, Socket } from 'socket.io-client';
import { BlockId, RemotePlayer, World } from '../types';

export interface CoopHandlers {
  onWorldState: (world: World) => void;
  onPlayers: (players: RemotePlayer[]) => void;
  onBlockEdit: (row: number, col: number, blockId: BlockId | null) => void;
  onConnectError?: (message: string) => void;
}

export class CoopClient {
  private socket: Socket;
  readonly roomCode: string;

  constructor(serverUrl: string, roomCode: string, playerName: string, world: World, handlers: CoopHandlers) {
    this.roomCode = roomCode;
    this.socket = io(serverUrl, { transports: ['websocket'], timeout: 8000 });

    this.socket.on('connect', () => {
      this.socket.emit('join', { roomCode, playerName, world });
    });
    this.socket.on('connect_error', (err) => {
      handlers.onConnectError?.(err.message ?? 'Could not connect to server');
    });
    this.socket.on('worldState', handlers.onWorldState);
    this.socket.on('players', handlers.onPlayers);
    this.socket.on(
      'blockEdit',
      ({ row, col, blockId }: { row: number; col: number; blockId: BlockId | null }) => {
        handlers.onBlockEdit(row, col, blockId);
      }
    );
  }

  get selfId(): string | undefined {
    return this.socket.id;
  }

  sendBlockEdit(row: number, col: number, blockId: BlockId | null): void {
    this.socket.emit('blockEdit', { roomCode: this.roomCode, row, col, blockId });
  }

  sendMove(row: number, col: number): void {
    this.socket.emit('playerMove', { roomCode: this.roomCode, row, col });
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
