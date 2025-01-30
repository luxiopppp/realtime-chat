function formatMessage(username, text, color) {
    return {
        username,
        text,
        time: new Date().toISOString(),
        color
    }
}

module.exports = formatMessage;
