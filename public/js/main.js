const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('user-list');
const activeUser = document.getElementById('active-user');
const submitBtn = document.getElementById('submit-btn');
const inputMsg = document.getElementById('msg')

// get username and room from URL query
// const { username, rooma } = Qs.parse(location.search, {
//     ignoreQueryPrefix: true
// })

const socket = io(); // esto funciona por el tag en chat.html

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username')
const room = urlParams.get('room');

// join chatroom
socket.emit('joinRoom', { username, room });

// get room and users
socket.on('roomusers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
})

// message from server
socket.on('message', (message) => { // el arg message es el que fue emitido desde server.js
    // console.log(message);
    outputMessage(message);

    // scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
})

// message submit
chatForm.addEventListener('submit', (e) => { // 
    e.preventDefault(); // sin esto el formulario es enviado a un archivo

    // get message
    const msg = e.target.elements.msg.value;

    // emit message to server
    socket.emit('chatMessage', msg);

    // clear form
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();

    submitBtn.disabled = true;
})

inputMsg.addEventListener('input', () => {
    submitBtn.disabled = inputMsg.value.trim() === '';
})

// output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
        <p class="meta" style="color:${message.color};">${message.username} <span>${message.time}</span></p>
        <p class="text">
            ${message.text}
        </p>
    `;
    document.querySelector('.chat-messages').appendChild(div)
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = '';

    const currentUser = users.find(user => user.username === username);
    if (currentUser) {
        activeUser.textContent = currentUser.username;
    }

    users.filter(user => user.username !== username).forEach(user => {
        const userItem = document.createElement('li');
        userItem.classList.add('user-item');
        userItem.textContent = user.username;
        userList.appendChild(userItem);
    });
}
