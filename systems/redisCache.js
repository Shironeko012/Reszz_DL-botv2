/**
 * Redis Cache System
 * Optional distributed cache layer
 */

const logger = require("../utils/logger")

let client = null

async function connect() {

    try {

        const { createClient } = require("redis")

        client = createClient({
            url: process.env.REDIS_URL || "redis://127.0.0.1:6379"
        })

        client.on("error", (err) => {

            logger.error("REDIS_ERROR", err)

        })

        await client.connect()

        logger.info("REDIS_CONNECTED")

    } catch (error) {

        logger.warn("REDIS_NOT_AVAILABLE", error.message)

        client = null

    }

}

async function get(key) {

    if (!client) return null

    try {

        return await client.get(key)

    } catch (error) {

        logger.warn("REDIS_GET_FAILED", error.message)

        return null

    }

}

async function set(key, value, ttl = 3600) {

    if (!client) return

    try {

        await client.set(key, value, {
            EX: ttl
        })

    } catch (error) {

        logger.warn("REDIS_SET_FAILED", error.message)

    }

}

async function del(key) {

    if (!client) return

    try {

        await client.del(key)

    } catch (error) {

        logger.warn("REDIS_DELETE_FAILED", error.message)

    }

}

module.exports = {
    connect,
    get,
    set,
    del
}
