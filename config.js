/**
 * Global Configuration
 */

module.exports = {

    botName: "Reszz-Bot Download",

    owner: "6285601931030",

    prefix: ".",

    sessionName: "session",

    download: {

        maxFileSize: 100 * 1024 * 1024, // 100MB

        tempFolder: "./storage/temp"

    },

    antiBan: {

        minDelay: 800,

        maxDelay: 2500

    },

    cache: {

        ttl: 86400 // seconds

    }

}
