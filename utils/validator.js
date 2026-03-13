/**
 * Validator Utility
 * Validate user input and URLs
 */

const URL_REGEX = /^(https?:\/\/[^\s]+)$/i

const SUPPORTED_PLATFORMS = [
    "youtube.com",
    "youtu.be",
    "tiktok.com",
    "vt.tiktok.com",
    "instagram.com",
    "facebook.com",
    "fb.watch",
    "twitter.com",
    "x.com",
    "reddit.com"
]

function isURL(text) {

    if (!text) return false

    return URL_REGEX.test(text.trim())
}

function detectPlatform(url) {

    if (!url) return null

    const lower = url.toLowerCase()

    return SUPPORTED_PLATFORMS.find(platform => lower.includes(platform)) || null
}

function isSupported(url) {

    return detectPlatform(url) !== null
}

function sanitize(text) {

    if (!text) return ""

    return text
        .trim()
        .replace(/[\n\r]/g, "")
}

module.exports = {
    isURL,
    detectPlatform,
    isSupported,
    sanitize
}
