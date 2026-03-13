/**
 * Duplicate Detection System
 * Prevent downloading the same content multiple times
 */

const crypto = require("crypto")
const logger = require("../utils/logger")
const redisCache = require("./redisCache")

const memoryCache = new Map()

function hashUrl(url) {

    return crypto
        .createHash("sha256")
        .update(url)
        .digest("hex")

}

async function check(url) {

    const key = hashUrl(url)

    if (memoryCache.has(key)) {

        return memoryCache.get(key)

    }

    const redisValue = await redisCache.get(`dup:${key}`)

    if (redisValue) {

        memoryCache.set(key, redisValue)

        return redisValue

    }

    return null
}

async function store(url, value) {

    const key = hashUrl(url)

    memoryCache.set(key, value)

    try {

        await redisCache.set(`dup:${key}`, value, 86400)

    } catch (error) {

        logger.warn("DUPLICATE_REDIS_STORE_FAILED", error.message)

    }

}

function remove(url) {

    const key = hashUrl(url)

    memoryCache.delete(key)

}

module.exports = {
    check,
    store,
    remove
}
