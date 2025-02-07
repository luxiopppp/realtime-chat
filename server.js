const path = require('path');
const http = require('http')
const express = require('express');
const socketio = require('socket.io');
require('dotenv').config()

// utils
const formatMessage = require('./utils/messages');
const { generateColor } = require('./utils/colors');
const {  clearRoomsOnServerStart, createRoomAsync, roomExistsAsync, findRoomByCode, findRoomByUser, getUsersCount, removeRoomAsync, userJoin, userLeave } = require('./utils/rooms');

// db
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { serverApi: { version: '1', strict: true, deprecationErrors: true } })
const db = mongoose.connection;
db.on('error', err =>  console.error(err));
db.once('connected', () =>  console.log('connected to mongodb!'));
db.on('disconnected', () =>  console.log('disconnected to mongodb!'));
clearRoomsOnServerStart();

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

app.post('/create-room-async', async (req, res) => {
    const username = req.body.username;
    const roomcode = await createRoomAsync();
    
    const response = { success: true, roomcode, username }
    
    res.json(response)
})

app.get("/room/:roomcode", async (req, res, next) => {
    const roomExists = await roomExistsAsync(req.params.roomcode);
    if (!roomExists) {
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
    socket.on('joinRoom', async ({ username, room }) => {
        const updatedRoom = await userJoin(socket.id, room, username, generateColor(username))
        // console.log(updatedRoom);

        socket.join(updatedRoom.roomcode);

        // new client
        socket.emit('message', formatMessage(botName,"Welcome! 🎉 Invite others by sharing the room code or copying the link by clicking on it. Enjoy the chat! 💬", botColor)); // esto emite un evento con nombre "message" y un arg // esto va para un solo cliente 

        socket.broadcast // el broadcast significa qu e lo va a emitir a todos los clientes MENOS al que "realice" la acción (NO HACE FALTA SI ESTA EL .to())
            .to(updatedRoom.roomcode) // el to lo uso para emitir el mensaje a esa sala en específico
            .emit('message', formatMessage(botName,`${ username } has joined the chat`, botColor)); 
        
        // send users and room info
        io.to(updatedRoom.roomcode).emit('roomusers', {
            room: updatedRoom.roomcode,
            users: updatedRoom.users
        })
    });

    // listen for chat chatMessage
    socket.on('chatMessage', async (msg, username) => {
        const roomData = await findRoomByUser(username);
        if (roomData) {
            const color = roomData.users.filter((user) => user.username === username)[0].color;
            
            io.to(roomData.roomcode).emit('message', formatMessage(username, msg, color));
        }
    });

    socket.on('typing', async (typing, username) => {
        if (!typing) {
            return;
        }
        const roomData = await findRoomByUser(username);
        if (roomData) {
            const userid = roomData.users.filter((user) => user.username === username)[0]._id;
            const color = roomData.users.filter((user) => user.username === username)[0].color;
            socket.broadcast.to(roomData.roomcode).emit('isTyping', userid, username, color);
        }
    })

    socket.on('stopTyping', async (username) => {
        const roomData = await findRoomByUser(username);
        if (roomData) {
            const userid = roomData.users.filter((user) => user.username === username)[0]._id;
            socket.broadcast.to(roomData.roomcode).emit('notTyping', userid);
        }
    })

    // when disconnect (page session ends)
    socket.on('disconnect', async () => {
        const outdatedRoom = await userLeave(socket.id); // update users but return outdated
        
        try {
            if (outdatedRoom) {
                const username = outdatedRoom.users.filter((user) => user._id === socket.id)[0].username;
                const count = await getUsersCount(outdatedRoom.roomcode);
                if (count > 0) {
                    socket.broadcast.to(outdatedRoom.roomcode).emit('notTyping', socket.id);

                    // inform the chat
                    io.to(outdatedRoom.roomcode).emit('message', formatMessage(botName,`${username} has left the chat`, botColor));
                    
                    // reload users
                    io.to(outdatedRoom.roomcode).emit('roomusers', {
                        room: outdatedRoom.roomcode,
                        users: outdatedRoom.users.filter((user) => user._id !== socket.id)
                    })
                } else {
                    const timeout = setTimeout(() => {
                        if (!io.sockets.adapter.rooms.has(outdatedRoom.roomcode)) {
                            removeRoomAsync(outdatedRoom.roomcode);
                            console.log(`Room ${outdatedRoom.roomcode} successfully removed`)
                        }
                    }, 500);
                }
            }
    
            socket.emit('forceLeave');
        } catch (error) {
            console.error(error)
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
