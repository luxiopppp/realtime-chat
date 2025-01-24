const mainForm = document.getElementById('main-form');
const roomForm = document.getElementById('room');
const usernameForm = document.getElementById('username');
const submitBtn = document.getElementById('submit-btn');
const createRoomBtn = document.getElementById('create-room-btn');

const socket = io();

roomForm.addEventListener('input', () => {
    roomForm.value = roomForm.value.toUpperCase();
    submitBtn.disabled = roomForm.value.length !== 4;
})

mainForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomcode = roomForm.value;
    try {
        const res = await fetch(`/join-room/${roomcode}`)
        const data = await res.json();
        data['username'] = usernameForm.value;

        if (data.success) {
            window.location.href = `/room?username=${data.username}&room=${data.roomcode}`;
        } else {
            console.error('Error joining room:', data.error);
        }

    } catch (err) {
        console.error('Error joining room:', err);
    }
    
})

createRoomBtn.addEventListener('click', async () => {
    try {
        const res = await fetch(`/create-room/${usernameForm.value}`);
        const data = await res.json();
        // socket.emit('console', data)
        if (data.success) {
            window.location.href = `/room?username=${data.username}&room=${data.roomcode}`
        }
    } catch (err) {
        console.error('Error creating room:', err);
    }
})

