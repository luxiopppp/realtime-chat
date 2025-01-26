const errorCode = document.getElementById('error-code');
const errorMsg = document.getElementById('error-msg');
const errorDesc = document.getElementById('error-description');
const countdown = document.getElementById('countdown');

const urlParams = new URLSearchParams(window.location.search);
const errorCodeParam = urlParams.get('status');
const errorMessage = urlParams.get('message');


window.addEventListener('load', () => {
    errorCode.innerHTML = errorCodeParam;
    errorMsg.innerHTML = errorMessage;

    let count = 3;
    const interval = setInterval(() => {
        count--;
        if (count === 0) {
            window.location.href = "/";
            clearInterval(interval);
        }
        countdown.innerHTML = `${count}`;
    }, 1000)
})
