const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;

const PLAYER_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA', '#FB8C00', '#00ACC1'];

// roomCode -> { grid, rows, cols, players: Map<socketId, { name, row, col, color }> }
const rooms = new Map();

function playersList(room) {
  return Array.from(room.players.entries()).map(([id, p]) => ({ id, ...p }));
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Sandbox Builder co-op server is running.\n');
});

const io = new Server(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join', ({ roomCode, playerName, world }) => {
    if (!roomCode || typeof roomCode !== 'string') return;
    currentRoom = roomCode;
    socket.join(roomCode);

    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        grid: world && Array.isArray(world.grid) ? world.grid : [],
        rows: world?.rows ?? 0,
        cols: world?.cols ?? 0,
        players: new Map(),
      });
    }

    const room = rooms.get(roomCode);
    const color = PLAYER_COLORS[room.players.size % PLAYER_COLORS.length];
    room.players.set(socket.id, { name: playerName || 'Player', row: 0, col: 0, color });

    socket.emit('worldState', {
      id: roomCode,
      name: roomCode,
      rows: room.rows,
      cols: room.cols,
      grid: room.grid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    io.to(roomCode).emit('players', playersList(room));
  });

  socket.on('blockEdit', ({ roomCode, row, col, blockId }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.grid[row]) return;
    room.grid[row][col] = blockId;
    socket.to(roomCode).emit('blockEdit', { row, col, blockId });
  });

  socket.on('playerMove', ({ roomCode, row, col }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    player.row = row;
    player.col = col;
    io.to(roomCode).emit('players', playersList(room));
  });

  socket.on('disconnect', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.players.delete(socket.id);
    if (room.players.size === 0) {
      rooms.delete(currentRoom);
    } else {
      io.to(currentRoom).emit('players', playersList(room));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Sandbox Builder co-op server listening on port ${PORT}`);
});
