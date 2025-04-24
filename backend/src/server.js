const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// 基礎路由
app.get('/', (req, res) => {
  res.send('Avalon Backend Server');
});

// 遊戲房間邏輯
const rooms = new Map();
// 根據玩家數量對應不同的角色配置（可根據 Avalon 規則自行調整）
const ROLES = {
  5: ['Merlin', 'Percival', 'Loyal', 'Mordred', 'Morgana'],
  6: ['Merlin', 'Percival', 'Loyal', 'Loyal', 'Mordred', 'Morgana'],
  7: ['Merlin', 'Percival', 'Loyal', 'Loyal', 'Loyal', 'Mordred', 'Morgana'],
  8: ['Merlin', 'Percival', 'Loyal', 'Loyal', 'Loyal', 'Mordred', 'Morgana', 'Oberon']
};

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // 主持人創建房間
  socket.on('create-room', (hostName) => {
    const roomId = generateRoomId();
    const newRoom = {
      id: roomId,
      host: {
        id: socket.id,
        name: hostName
      },
      players: [], // 玩家列表（不包含主持人）
      missions: []
    };
    rooms.set(roomId, newRoom);
    socket.join(roomId);
    socket.emit('room-created', newRoom);
  });

  // 玩家加入房間
  socket.on('join-room', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error', 'Room not found');

    const newPlayer = {
      id: socket.id,
      name: playerName,
      role: null,      // 尚未分配角色
      confirmed: false // 尚未確認角色
    };

    room.players.push(newPlayer);
    socket.join(roomId);
    io.to(roomId).emit('player-updated', room.players);
  });

  // 主持人開始遊戲
  socket.on('start-game', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error', 'Room not found');

    // 只有房主才能開始遊戲
    if (socket.id !== room.host.id) {
      return socket.emit('error', 'Only the host can start the game.');
    }

    const numPlayers = room.players.length;
    const rolesConfig = ROLES[numPlayers];
    if (!rolesConfig) {
      return socket.emit('error', `No roles configuration available for ${numPlayers} players.`);
    }

    // 混洗角色陣列，依序分配給玩家，並初始化 confirmed 狀態為 false
    const shuffledRoles = shuffleRoles([...rolesConfig]);
    room.players = room.players.map(player => ({
      ...player,
      role: shuffledRoles.pop(),
      confirmed: false
    }));

    // 通知各玩家他們被分配到的角色
    room.players.forEach(player => {
      io.to(player.id).emit('role-assigned', player.role);
    });

    // 通知房間內所有人遊戲開始，畫面切換到等待確認狀態
    io.to(room.id).emit('game-started', room.players);
  });

  // 玩家確認角色後的事件處理
  socket.on('confirm-role', (roomId) => {
    console.log('收到 confirm-role 事件，roomId:', roomId);
    const room = rooms.get(roomId);
    if (!room) {
      console.log(`confirm-role: 找不到房間 ${roomId}`);
      return;
    }
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.confirmed = true;
      console.log(`玩家 ${player.name}(${player.id}) 已確認`);
      io.to(room.id).emit('player-updated', room.players);
      if (room.players.every(p => p.confirmed)) {
        console.log('所有玩家已確認，發送 all-confirmed 事件');
        io.to(room.id).emit('all-confirmed');
      }
    }
  });
  
  
  

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // 可根據需求移除離線玩家
  });
});

function generateRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function shuffleRoles(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

httpServer.listen(3001, () => {
  console.log('Backend running on http://localhost:3001');
});
