const path = require('path');
const http = require('http')
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'BOT'

// run when client connects
io.on('connection', (socket) => {
    // join chatroom
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room)

        socket.join(user.room);

        // new client
        socket.emit('message', formatMessage(botName,'Welcome to Realtime Chat!')); // esto emite un evento con nombre "message" y un arg // esto va para un solo cliente

        socket.broadcast
            .to(user.room) // el to lo uso para emitir el mensaje a esa sala en específico
            .emit('message', formatMessage(botName,`${ user.username } has joined the chat`)); // el broadcast significa que lo va a emitir a todos los clientes MENOS al que "realice" la acción
    });

    // listen for chat chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // when client disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));
        }
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
