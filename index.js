/**
 * WhatsApp Downloader Bot
 * Stable Production Entry (Upgraded)
 */

// FIX crypto for Baileys
const crypto = require("crypto")
if (!global.crypto) global.crypto = crypto.webcrypto

const {
default: makeWASocket,
useMultiFileAuthState,
fetchLatestBaileysVersion,
DisconnectReason
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const qrcode = require("qrcode-terminal")

/*
SYSTEM IMPORT
*/

const messageHandler = require("./handlers/messageHandler")
const antiCrash = require("./systems/antiCrash")
const redisCache = require("./systems/redisCache")

const logger = require("./utils/logger")
const errorHandler = require("./utils/errorHandler")
const fileManager = require("./utils/fileManager")

let sock = null
let reconnecting = false

/*
=========================
SYSTEM SCHEDULERS
=========================
*/

function startSchedulers(){

/*
TEMP FILE CLEANER
remove old files every 30 minutes
*/

setInterval(()=>{

try{

fileManager.cleanupTemp(60 * 60 * 1000)

}catch(e){

logger.error("TEMP_CLEANUP_ERROR",e)

}

},30 * 60 * 1000)

/*
MEMORY PROTECTION
*/

setInterval(()=>{

const memory = process.memoryUsage()

logger.info("MEMORY_USAGE",{

rss: Math.round(memory.rss / 1024 / 1024) + "MB",
heap: Math.round(memory.heapUsed / 1024 / 1024) + "MB"

})

},10 * 60 * 1000)

}

/*
=========================
START BOT
=========================
*/

async function startBot(){

try{

if(reconnecting){

console.log("⚠️ Reconnect already in progress...")
return

}

reconnecting = true

console.log("🚀 BOT STARTING...")

/*
REGISTER SYSTEMS
*/

errorHandler.register()
antiCrash.register()

// optional redis
// await redisCache.connect()

/*
AUTH STATE
*/

const { state, saveCreds } =
await useMultiFileAuthState("./session")

const { version } =
await fetchLatestBaileysVersion()

/*
CREATE SOCKET
*/

sock = makeWASocket({

version,
auth: state,

logger: pino({ level: "silent" }),

browser: ["ReszzDownloader","Chrome","1.0"],

syncFullHistory: false,
markOnlineOnConnect: true

})

console.log("📡 SOCKET CREATED")

reconnecting = false

/*
SAVE SESSION
*/

sock.ev.on("creds.update", saveCreds)

/*
CONNECTION UPDATE
*/

sock.ev.on("connection.update", async(update)=>{

const { connection, lastDisconnect, qr } = update

if(qr){

console.log("\n📱 Scan QR Below:\n")

qrcode.generate(qr,{ small:false })

}

if(connection === "connecting"){

console.log("🔄 Connecting to WhatsApp...")

}

if(connection === "open"){

console.log("✅ BOT CONNECTED")

}

if(connection === "close"){

const reason =
lastDisconnect?.error?.output?.statusCode

console.log("❌ Connection closed:", reason)

/*
LOGOUT
*/

if(reason === DisconnectReason.loggedOut){

console.log("⚠️ Session logged out. Delete session folder.")
return

}

/*
RECONNECT
*/

console.log("♻️ Reconnecting in 6 seconds...")

setTimeout(()=>{

startBot()

},6000)

}

})

/*
=========================
MESSAGE ROUTER
=========================
*/

sock.ev.on("messages.upsert", async({ messages, type })=>{

try{

if(type !== "notify") return

const m = messages?.[0]

if(!m) return
if(!m.message) return

if(m.key?.remoteJid === "status@broadcast") return

/*
ignore bot message
*/

if(m.key?.fromMe) return

await messageHandler.handle(sock,m)

}catch(err){

if(
err?.message?.includes("Bad MAC") ||
err?.message?.includes("decrypt")
){
return
}

logger.error("MESSAGE_HANDLER_ERROR",err)

}

})

/*
START SCHEDULERS
*/

startSchedulers()

}catch(err){

logger.error("BOT_START_ERROR",err)

console.log("♻️ Restarting bot in 6 seconds...")

setTimeout(startBot,6000)

}

}

/*
=========================
GRACEFUL SHUTDOWN
=========================
*/

process.on("SIGINT",()=>{

console.log("\n🛑 Shutting down bot...")

process.exit()

})

process.on("SIGTERM",()=>{

console.log("\n🛑 Terminating bot...")

process.exit()

})

/*
=========================
RUN BOT
=========================
*/

startBot()
