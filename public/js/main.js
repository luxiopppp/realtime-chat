const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.querySelectorAll('#room-name');
const userList = document.querySelectorAll('#user-list');
const activeUser = document.querySelectorAll('#active-user');
const submitBtn = document.getElementById('submit-btn');
const leaveBtn = document.querySelectorAll('#leave-btn');
const inputMsg = document.getElementById('msg');
const usernameModal = document.getElementById('username-modal');
const typingContainerP = document.querySelector('.typing');

const socket = io(); // esto funciona por el tag en chat.html

// const urlParams = new URLSearchParams(window.location.search);
const username = sessionStorage.getItem('username')
const room = window.location.pathname.split('/').pop();

const originalTitle = document.title;
let notifications = 0;

let typingTimeout;
let typingUsers = [];

// join chatroom
window.addEventListener('load', () => {
    if (username) {
        // copyInvite.classList.remove('disable-this')
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

socket.on('isTyping', (userid, username, color) => {
    const typingElement = document.getElementById(`typing-${userid}`);
    if (!typingElement) {
        const span = document.createElement('span');
        span.classList.add(`typing-${userid}`);
        span.id = `typing-${userid}`;
        span.style.color = color;
        span.textContent = username;
        if (!typingContainerP.firstChild) {
            typingContainerP.append(span, " typing...");
        } else {
            updateTypingText(span)
        }
    }
})

socket.on('notTyping', (userid) => {
    const typingElement = document.getElementById(`typing-${userid}`);
    if (typingElement) {
        typingElement.remove();

        updateTypingText()
    }

})

function updateTypingText(span = null) {
    const spans = typingContainerP.querySelectorAll("span[class^='typing-']");
    console.log(spans.length)
    typingContainerP.textContent = "";

    if (spans.length > 0) {
        spans.forEach((s, i) => {
            typingContainerP.appendChild(s);
            if (span || i < spans.length - 1) {
                typingContainerP.append(", ");
            }
        })
        if (span) {
            typingContainerP.append(span, " typing...");
        }
        else {
            typingContainerP.append(" typing...")
        }
    }
}

// message submit
chatForm.addEventListener('submit', (e) => { // 
    e.preventDefault(); // if the event is not explicitly handled, do not use the default action
    
    socket.emit('stopTyping', username);

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
    socket.emit('typing', inputMsg.value.trim() !== '', username);

    clearTimeout(typingTimeout);
    
    if (inputMsg.value.trim() === '') {
        socket.emit('stopTyping', username);
    }
    else {
        typingTimeout = setTimeout(() => {
            socket.emit('stopTyping', username);
        }, 10000);
    }
})

leaveBtn.forEach(l => l.addEventListener('click', () => {
    leaveRoom();
}))


// output message to DOM
function outputMessage(message) {
    const formatDate = (time) => {
        return new Date(time).toLocaleString(undefined, {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
        <p class="meta" style="color:${message.color};">${message.username} <span>${formatDate(message.time)}</span></p>
        <p class="text">
            ${message.text}
        </p>
    `;
    document.querySelector('.chat-messages').appendChild(div)
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.forEach(r => r.innerHTML = `<i class="fas fa-hashtag"></i> ${room}`);
}

// Add users to DOM
function outputUsers(users) {
    userList.forEach(u => u.innerHTML = '');

    const currentUser = users.find(user => user.username === username);
    if (currentUser) {
        activeUser.forEach(a => a.innerHTML = `${currentUser.username} <span>(You)</span>`);
        activeUser.forEach(a => a.title = currentUser.username);
    }

    userList.forEach(u => {
        users.filter(user => user.username !== username).forEach(user => {
            const userItem = document.createElement('li');
            userItem.classList.add('user-item');
            userItem.textContent = user.username;
            userItem.title = user.username;
            u.appendChild(userItem);
        });
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
