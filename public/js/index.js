const roomForm = document.getElementById('room');
const usernameForm = document.getElementById('username');
const submitBtn = document.getElementById('submit-btn');
const createRoomBtn = document.getElementById('create-room-btn');

const socket = io();

roomForm.addEventListener('input', () => {
    submitBtn.disabled = roomForm.value.trim() === '';
})

