const express = require('express');
const { createServer } = require('http');
const { join } = require('path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);

const io = new Server(server, {
  connectionStateRecovery: {}
});

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

let userCount = 0;

io.on('connection', (socket) => {

  console.log(
    socket.recovered ? 'Connection recovered:' : 'New connection:',
    socket.id
  );

  socket.on('set username', (username) => {

    if (!socket.recovered) {
      userCount++;
    }

    socket.username = username;

    socket.broadcast.emit('chat message', {
      type: 'system',
      message: `${username} joined the chat`,
      count: userCount
    });
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', {
      type: 'user',
      username: socket.username || 'Anonymous',
      message: msg
    });
  });

  socket.on('disconnect', () => {
    if (!socket.recovered && socket.username) {
      userCount--;

      socket.broadcast.emit('chat message', {
        type: 'system',
        message: `${socket.username} left the chat`,
        count: userCount
      });
    }
  });
});


server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
