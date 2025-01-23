const path = require('path');
const http = require('http')
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const { generateColor } = require('./utils/colors');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'BOT'
const botColor = generateColor(botName);

// run when client connects
io.on('connection', (socket) => {
    // join chatroom
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room, generateColor(username))
        // console.log(user);

        socket.join(user.room);

        // new client
        socket.emit('message', formatMessage(botName,'Welcome to Realtime Chat!', botColor)); // esto emite un evento con nombre "message" y un arg // esto va para un solo cliente

        socket.broadcast
            .to(user.room) // el to lo uso para emitir el mensaje a esa sala en específico
            .emit('message', formatMessage(botName,`${ user.username } has joined the chat`, botColor)); // el broadcast significa que lo va a emitir a todos los clientes MENOS al que "realice" la acción
        
        // send users and room info
        io.to(user.room).emit('roomusers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    });

    // listen for chat chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg, user.color));
    });

    // when client disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`, botColor));
            
            // reload users
            io.to(user.room).emit('roomusers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
