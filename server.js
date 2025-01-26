const path = require('path');
const http = require('http')
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const { generateColor } = require('./utils/colors');
const { createRoom, roomExists, roomsOnUse, removeRoom } = require('./utils/rooms');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = 'BOT'
const botColor = generateColor(botName);

// uses
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// redirecciones
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'));
})

app.post('/create-room', (req, res) => {
    const username = req.body.username
    const roomcode = createRoom();
    
    const response = { success: true, roomcode, username }

    res.json(response)
})

app.get("/room/:roomcode", (req, res, next) => {
    if (!roomExists(req.params.roomcode)) {
        const error = new Error('Invalid room code');
        error.status = 404;
        return next(error);
    }

    res.sendFile(path.join(__dirname, './public/chat.html'));
})

app.get("/error", (req, res) => {
    res.sendFile(path.join(__dirname, './public/error.html'));
})

app.get("*", (req, res, next) => {
    const error = new Error();
    return next(error)
})

app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const errorMessage = err.message || 'Internal server error';
    // console.log(err)

    res.redirect(`/error?status=${statusCode}&message=${encodeURIComponent(errorMessage)}`)
})

// run when client connects
io.on('connection', (socket) => {
    // debug
    socket.on('console', (msg) => {
        console.log(msg);
    })

    // join chatroom
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room, generateColor(username))
        // console.log(room, user);

        socket.join(user.room);

        // new client
        socket.emit('message', formatMessage(botName,'Welcome to Realtime Chat!', botColor)); // esto emite un evento con nombre "message" y un arg // esto va para un solo cliente 

        socket.broadcast
            .to(user.room) // el to lo uso para emitir el mensaje a esa sala en específico
            .emit('message', formatMessage(botName,`${ user.username } has joined the chat`, botColor)); // el broadcast significa qu e lo va a emitir a todos los clientes MENOS al que "realice" la acción
        
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

    // when disconnect (page session ends)
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        
        // manage the room - delete if no other users
        if (user) {
            if (getRoomUsers(user.room).length > 0) {
                // inform the chat
                io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`, botColor));
                
                // reload users
                io.to(user.room).emit('roomusers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                })
            } else {
                const timeout = setTimeout(() => {
                    if (!io.sockets.adapter.rooms.has(user.room)) {
                        removeRoom(user.room);
                        console.log(`Room ${user.room} successfully removed`)
                    }
                }, 500);
            }
        }

        socket.emit('forceLeave');
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
