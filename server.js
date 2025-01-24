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

// static folder
app.use(express.static(path.join(__dirname, 'public')));

// redirecciones
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'));
})

app.get('/create-room/:username', (req, res) => {
    const roomcode = req.query.room;
    const username = req.params.username;
    
    const response = !roomExists(roomcode)
        ? createRoom(roomcode) && { success: true, roomcode, username }
        : { success: false, error: 'Room already exists'};

    res.json(response)
})

app.get('/join-room/:roomcode', (req, res) => {
    const roomcode = req.params.roomcode;
    const response = roomExists(roomcode)
        ? { success: true, roomcode }
        : { success: false, error: 'Invalid room code or the room does not exist' };

    res.json(response);
})

app.get("/room", (req, res) => {
    res.sendFile(path.join(__dirname, './public/chat.html'));
})

// run when client connects
io.on('connection', (socket) => {
    socket.on('console', (msg) => {
        console.log(msg);
    })

    // join chatroom
    socket.on('joinRoom', ({ username, room }) => {
        // console.log("a");
        
        const user = userJoin(socket.id, username, room, generateColor(username))

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

    // when client disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user && getRoomUsers(user.room).length > 0) {
            console.log("a")
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`, botColor));
            
            // reload users
            io.to(user.room).emit('roomusers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        } else if (user) {
            removeRoom(user.room);
        }
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
