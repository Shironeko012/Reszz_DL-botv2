/**
 * WhatsApp Downloader Bot
 * Optimized Entry (Railway Stable)
 */

const fs = require("fs")
const path = require("path")
const http = require("http")

/*
=========================
CRYPTO FIX FOR BAILEYS
=========================
*/

const crypto = require("crypto")
if (!global.crypto) global.crypto = crypto.webcrypto

/*
=========================
BAILEYS (ESM FIX)
=========================
*/

let makeWASocket
let useMultiFileAuthState
let fetchLatestBaileysVersion
let DisconnectReason

const pino = require("pino")
const qrcode = require("qrcode-terminal")

/*
=========================
SYSTEM IMPORT
=========================
*/

const messageHandler = require("./handlers/messageHandler")
const antiCrash = require("./systems/antiCrash")
const redisCache = require("./systems/redisCache")

const logger = require("./utils/logger")
const errorHandler = require("./utils/errorHandler")
const fileManager = require("./utils/fileManager")

/*
=========================
GLOBAL STATE
=========================
*/

let sock = null
let reconnecting = false
let schedulerStarted = false

/*
=========================
ENSURE DIRECTORIES
=========================
*/

function ensureDirectories(){

const dirs = [
"./session",
"./storage/temp",
"./storage/cache",
"./storage/logs"
]

for(const dir of dirs){

try{
fs.mkdirSync(dir,{ recursive:true })
}catch(e){
console.error("DIR_CREATE_ERROR",dir,e)
}

}

}

/*
=========================
HEALTH SERVER (RAILWAY)
=========================
*/

function startHealthServer(){

const PORT = process.env.PORT || 3000

http.createServer((req,res)=>{
res.writeHead(200,{"Content-Type":"text/plain"})
res.end("Bot is running")
}).listen(PORT,()=>{
console.log("🌐 Health server running on port",PORT)
})

}

/*
=========================
SYSTEM SCHEDULERS
=========================
*/

function startSchedulers(){

if(schedulerStarted) return
schedulerStarted = true

setInterval(()=>{

try{
fileManager.cleanupTemp(60 * 60 * 1000)
}catch(e){
logger.error("TEMP_CLEANUP_ERROR",e)
}

},30 * 60 * 1000)

setInterval(()=>{

try{

const memory = process.memoryUsage()

logger.info("MEMORY_USAGE",{
rss: Math.round(memory.rss / 1024 / 1024) + "MB",
heap: Math.round(memory.heapUsed / 1024 / 1024) + "MB"
})

}catch(e){
logger.error("MEMORY_MONITOR_ERROR",e)
}

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
console.log("⚠️ Reconnect already in progress")
return
}

reconnecting = true

console.log("🚀 BOT STARTING...")

/*
=========================
LOAD BAILEYS (ESM FIX)
=========================
*/

if (!makeWASocket) {

const baileys = await import("@whiskeysockets/baileys")

makeWASocket = baileys.default
useMultiFileAuthState = baileys.useMultiFileAuthState
fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion
DisconnectReason = baileys.DisconnectReason

console.log("✅ Baileys loaded (ESM)")

}

/*
REGISTER SYSTEMS
*/

errorHandler.register()
antiCrash.register()

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

sock.ev.on("creds.update", saveCreds)

/*
CONNECTION UPDATE
*/

sock.ev.on("connection.update", async(update)=>{

const { connection, lastDisconnect, qr } = update

if (qr) {

console.log("\nScan QR WhatsApp:\n")
qrcode.generate(qr, { small: true })

const qrUrl =
"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(qr)

console.log("\nQR LINK:")
console.log(qrUrl)

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

if(reason === DisconnectReason.loggedOut){
console.log("⚠️ Session logged out. Delete session folder.")
return
}

console.log("♻️ Reconnecting in 6 seconds...")

setTimeout(()=>{
startBot()
},6000)

}

})

/*
MESSAGE ROUTER
*/

sock.ev.on("messages.upsert", async({ messages, type })=>{

try{

if(type !== "notify") return

const m = messages?.[0]
if(!m || !m.message) return
if(m.key?.remoteJid === "status@broadcast") return
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

startSchedulers()

}catch(err){

logger.error("BOT_START_ERROR",err)

console.log("♻️ Restarting bot in 6 seconds...")
setTimeout(startBot,6000)

}

}

/*
=========================
SHUTDOWN
=========================
*/

function shutdown(signal){

console.log(`\n🛑 ${signal} received. Shutting down bot...`)

try{
if(sock) sock.end()
}catch(e){
console.error("SOCKET_CLOSE_ERROR",e)
}

process.exit()

}

process.on("SIGINT",()=>shutdown("SIGINT"))
process.on("SIGTERM",()=>shutdown("SIGTERM"))

/*
=========================
BOOTSTRAP
=========================
*/

ensureDirectories()
startHealthServer()
startBot()
