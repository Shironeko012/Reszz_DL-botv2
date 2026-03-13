/**
 * Uploader
 * Upload large files to CDN or return local file
 */

const fs = require("fs")
const path = require("path")
const logger = require("../utils/logger")

const MAX_WHATSAPP_SIZE = 50 * 1024 * 1024 // 50MB

function getFileSize(filePath) {

    try {

        const stats = fs.statSync(filePath)

        return stats.size

    } catch (error) {

        logger.error("FILE_SIZE_ERROR", error)

        return 0

    }

}

function needsUpload(filePath) {

    const size = getFileSize(filePath)

    return size > MAX_WHATSAPP_SIZE

}

/**
 * Placeholder uploader
 * Currently returns local file
 * Can be replaced with CDN uploader
 */

async function upload(filePath) {

    try {

        const exists = fs.existsSync(filePath)

        if (!exists) {
            throw new Error("File not found")
        }

        /**
         * TODO: integrate CDN upload
         */

        return {
            type: "local",
            url: filePath
        }

    } catch (error) {

        logger.error("UPLOAD_ERROR", error)

        throw error

    }

}

module.exports = {
    upload,
    needsUpload,
    getFileSize
}
