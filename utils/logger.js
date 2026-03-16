/**
 * Global Logger (Optimized)
 */

const fs = require("fs")
const path = require("path")

const LOG_DIR = path.join(__dirname, "..", "storage", "logs")

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
}

const LOG_FILE = path.join(LOG_DIR, "bot.log")

const MAX_LOG_SIZE = 5 * 1024 * 1024

function safeStringify(data) {
    try {
        return JSON.stringify(data)
    } catch {
        return "[Unserializable]"
    }
}

function rotateIfNeeded() {

    try {

        if (!fs.existsSync(LOG_FILE)) return

        const stat = fs.statSync(LOG_FILE)

        if (stat.size > MAX_LOG_SIZE) {

            fs.writeFileSync(LOG_FILE, "")

        }

    } catch {}

}

function write(level, message, data = null) {

    const time = new Date().toISOString()

    const log = data
        ? `[${time}] [${level}] ${message} ${safeStringify(data)}`
        : `[${time}] [${level}] ${message}`

    console.log(log)

    rotateIfNeeded()

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
