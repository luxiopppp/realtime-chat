const rooms = new Set()

function createRoom() {
    const roomCode = Math.random().toString(36).substring(2,6).toUpperCase();
    rooms.add(roomCode);
    return roomCode
}

function roomExists(code) {
    return rooms.has(code);
}

module.exports = {
    createRoom,
    roomExists
}
