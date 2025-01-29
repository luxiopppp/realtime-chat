const Room = require('../models/Room');

async function createRoomAsync() {
    const newRoom = new Room({
        roomcode: Math.random().toString(36).substring(2,6).toUpperCase(),
        users: []
    })

    await newRoom.save();
    return newRoom.roomcode;
}

async function roomExistsAsync(roomcode) {
    return await Room.exists({ roomcode: roomcode });
}

async function removeRoomAsync(roomcode) {
    return await Room.findOneAndDelete({ roomcode: roomcode });
}

async function findRoomByCode(roomcode) {
    return await Room.findOne({ roomcode: roomcode });
}

async function findRoomByUser(username) {
    return await Room.findOne({ "users.username": username});
}

async function getUsersCount(roomcode) { // mejorable
    const result = await Room.aggregate([
        { $match: { roomcode } },
        { $project: { usersCount: { $size: "$users" } } }
    ]);

    if (result.length > 0) {
        return result[0].usersCount;
    } else {
        throw new Error('Room not found');
    }
}

async function userJoin(id, roomcode, username, color) { // returns the whole updated room
    return await Room.findOneAndUpdate(
        { roomcode },
        { $push: { users: { _id: id, username, color: color } } },
        { new: true }
    );
}

async function userLeave(id) {
    return await Room.findOneAndUpdate(
        { "users._id": id },
        { $pull: { users: { _id: id } } },
        { new: false }
    )
}

module.exports = {
    createRoomAsync,
    roomExistsAsync,
    removeRoomAsync,
    findRoomByCode,
    findRoomByUser,
    getUsersCount,
    userJoin,
    userLeave,
}
