const rooms = new Set()

function createRoom(code) {
    const roomcode = code ? code : Math.random().toString(36).substring(2,6).toUpperCase();
    rooms.add(roomcode);
    return roomcode
}

function removeRoom(code) {
    return rooms.delete(code);
}

function roomExists(code) {
    return rooms.has(code);
}

function roomsOnUse() {
    return Array.from(rooms);
}

module.exports = {
    createRoom,
    removeRoom,
    roomExists,
    roomsOnUse
}
