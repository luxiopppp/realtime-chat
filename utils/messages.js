const moment = require('moment');

function formatMessage(username, text, color) {
    return {
        username,
        text,
        time: moment().format('HH:mm'),
        color
    }
}

module.exports = formatMessage;
