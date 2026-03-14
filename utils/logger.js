/**
 * Global Logger
 * Production ready logging system
 */

const fs = require("fs")
const path = require("path")

const LOG_DIR = path.join(__dirname, "..", "storage", "logs")

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
}

const LOG_FILE = path.join(LOG_DIR, "bot.log")

function write(level, message, data = null) {

    const time = new Date().toISOString()

    const log = data
        ? `[${time}] [${level}] ${message} ${JSON.stringify(data)}`
        : `[${time}] [${level}] ${message}`

    console.log(log)

    fs.appendFile(LOG_FILE, log + "\n", () => {})

}

module.exports = {

    info(message, data) {
        write("INFO", message, data)
    },

    warn(message, data) {
        write("WARN", message, data)
    },

    error(message, data) {
        write("ERROR", message, data)
    }

}
