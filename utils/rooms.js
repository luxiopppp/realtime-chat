const rooms = new Set()

function createRoom(code) {
    const roomcode = code ? code : Math.random().toString(36).substring(2,6).toUpperCase();
    rooms.add(roomcode);
    return roomcode
}

function roomExists(code) {
    return rooms.has(code);
}

function roomsOnUse() {
    return Array.from(rooms);
}

module.exports = {
    createRoom,
    roomExists,
    roomsOnUse
}
