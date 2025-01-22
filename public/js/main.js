const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');

const socket = io(); // esto funciona por el tag en chat.html

// message from server
socket.on('message', (message) => { // el arg message es el que fue emitido desde server.js
    console.log(message);
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
})

// output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
        <p class="meta">${message.username} <span>${message.time}</span></p>
        <p class="text">
            ${message.text}
        </p>
    `;
    document.querySelector('.chat-messages').appendChild(div)
}
