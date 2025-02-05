const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('user-list');
const activeUser = document.getElementById('active-user');
const submitBtn = document.getElementById('submit-btn');
const leaveBtn = document.getElementById('leave-btn')
const inputMsg = document.getElementById('msg');
const usernameModal = document.getElementById('username-modal');
const copyInvite = document.getElementById('copy-btn');

const socket = io(); // esto funciona por el tag en chat.html

// const urlParams = new URLSearchParams(window.location.search);
const username = sessionStorage.getItem('username')
const room = window.location.pathname.split('/').pop();

const originalTitle = document.title;
let notifications = 0;

// join chatroom
window.addEventListener('load', () => {
    if (username) {
        copyInvite.classList.remove('disable-this')
        sessionStorage.setItem('room', room);
        socket.emit('joinRoom', { username, room })
    } else {
        usernameModal.classList.remove('disable-this');
        document.getElementById('username-form').addEventListener('submit', () => {
            const requiredUsername = document.getElementById('username-input').value;
            sessionStorage.setItem('username', requiredUsername)
        })
    }
})

window.addEventListener('focus', () => {
    titleNotification();
})

socket.on('forceLeave', () => {
    leaveRoom();
})

// get room and users
socket.on('roomusers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
})

// message from server
socket.on('message', (message) => { // el arg message es el que fue emitido desde server.js
    titleNotification();
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
    socket.emit('chatMessage', msg, username);

    // clear form
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();

    submitBtn.disabled = true;
})

inputMsg.addEventListener('input', () => {
    submitBtn.disabled = inputMsg.value.trim() === '';
})

leaveBtn.addEventListener('click', () => {
    leaveRoom();
})

copyInvite.addEventListener('click', () => {
    const link = `${window.location.href}`;

    navigator.clipboard.writeText(link)
        .then(() => {
            copyInvite.classList.add("clicked");
            setTimeout(() => {
                copyInvite.classList.remove("clicked");
            }, 500)
        })
        .catch((err) => console.error(err))
})

// output message to DOM
function outputMessage(message) {
    const formatDate = (time) => {
        return new Date(time).toLocaleString(undefined, {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            hour: '2-digit',
            minute: '2-digit'
        })
    };

function makeLinksClickable(text){
    let urlRegex  = /^(https?:\/\/[^\s]+)$/;
    if(urlRegex.test(text)){
        return <a href="${text}" target="_blank">${text}</a>
    }
}
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
        <p class="meta" style="color:${message.color};">${message.username} <span>${formatDate(message.time)}</span></p>
        <p class="text">
            ${makeLinksClickable(message.text)}
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
        activeUser.title = currentUser.username
    }

    users.filter(user => user.username !== username).forEach(user => {
        const userItem = document.createElement('li');
        userItem.classList.add('user-item');
        userItem.textContent = user.username;
        userItem.title = user.username;
        userList.appendChild(userItem);
    });
}

function leaveRoom() {
    window.location.href = '/';
    sessionStorage.setItem('room', null);
}

function titleNotification() {
    if (!document.hasFocus()){
        notifications++;
        document.title = `(${notifications}) ${originalTitle}`;
    } else {
        notifications = 0;
        document.title = originalTitle;
    }
}
