/**
 * Command Handler
 * Route commands to corresponding modules
 */

const logger = require("../utils/logger")

const commands = {
    dl: require("../commands/download"),
    mp3: require("../commands/mp3")
}

const PREFIX = "."

/*
Prevent duplicate command execution
*/
const activeCommands = new Set()

async function handle(sock, m, text) {

    try {

        if (!text || !text.startsWith(PREFIX)) return false

        const messageId = m?.key?.id

        /*
        Prevent duplicate execution
        */
        if (messageId) {

            if (activeCommands.has(messageId)) {
                return true
            }

            activeCommands.add(messageId)

            // auto cleanup
            setTimeout(() => {
                activeCommands.delete(messageId)
            }, 15000)
        }

        const args = text.slice(PREFIX.length).trim().split(/\s+/)
        const command = args.shift()?.toLowerCase()

        const handler = commands[command]

        if (!handler) {
            if (messageId) activeCommands.delete(messageId)
            return false
        }

        logger.info("COMMAND_EXECUTE", {
            command,
            user: m.key.participant || m.key.remoteJid
        })

        await handler(sock, m, args)

        if (messageId) activeCommands.delete(messageId)

        return true

    } catch (error) {

        logger.error("COMMAND_HANDLER_ERROR", {
            error: error?.message || error
        })

        return true
    }

}

module.exports = {
    handle
}