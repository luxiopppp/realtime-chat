const path = require('path');
const http = require('http')
const express = require('express');
const socketio = require('socket.io')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// static folder
app.use(express.static(path.join(__dirname, 'public')));

// run when client connects
io.on('connection', (socket) => {
    // new client
    socket.emit('message', 'Welcome to Realtime Chat!'); // esto emite un evento con nombre "message" y un arg // esto va para un solo cliente

    socket.broadcast.emit('message', 'A user has joined the chat'); // el broadcast significa que lo va a emitir a todos los clientes MENOS al que "realice" la acción

    // when client disconnect
    socket.on('disconnect', () => {
        io.emit('message', 'A user has left the chat')
    })

    // listen for chat chatMessage
    socket.on('chatMessage', (msg) => {
        io.emit('message', msg);
    })
})

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
