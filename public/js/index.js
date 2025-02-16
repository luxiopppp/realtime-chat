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

mainForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
        roomcode: roomForm.value,
        username: usernameForm.value
    };

    sessionStorage.setItem('username', data.username);
    window.location.href = `/room/${data.roomcode}`;
})

createRoomBtn.addEventListener('click', async () => {
    if (usernameForm.value) {
        const data = {
            username: usernameForm.value
        };
    
        try {
            const res = await fetch('/create-room-async', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            });
    
            const resData = await res.json();
            
            if (resData.success) {
                // socket.emit('console', resData.roomcode)
                sessionStorage.setItem('username', resData.username);
                window.location.href = `/room/${resData.roomcode}`;
            } else {
                console.error('Error joining room:', resData.error);
            }
    
        } catch (error) {
            console.error('Error creating room:', error);
        }
    } else {
        usernameForm.classList.add('required')

        setTimeout(() => {
            usernameForm.classList.remove('required')
        }, 500)
    }
})
