/**
 * Global Error Handler
 * Prevent application crash and log critical errors
 */

const logger = require("./logger")

function register() {

    process.on("uncaughtException", (error) => {

        logger.error("UNCAUGHT_EXCEPTION", {
            message: error?.message,
            stack: error?.stack
        })

    })

    process.on("unhandledRejection", (reason) => {

        logger.error("UNHANDLED_REJECTION", {
            reason
        })

    })

    process.on("warning", (warning) => {

        logger.warn("NODE_WARNING", {
            name: warning?.name,
            message: warning?.message,
            stack: warning?.stack
        })

    })

}

module.exports = {
    register
}
