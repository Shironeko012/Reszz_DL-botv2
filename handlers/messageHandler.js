/**
 * Message Handler (Optimized)
 * Process incoming messages and route actions
 */

const commandHandler = require("./commandHandler")
const autoDetect = require("../commands/autoDetect")
const logger = require("../utils/logger")

/*
Prevent duplicate message processing
*/
const processedMessages = new Map()

const MESSAGE_CACHE_TTL = 30000
const MAX_CACHE = 1000

let lastCleanup = 0

function extractText(message){

return (
message?.conversation ||
message?.extendedTextMessage?.text ||
message?.imageMessage?.caption ||
message?.videoMessage?.caption ||
message?.documentMessage?.caption ||
message?.buttonsResponseMessage?.selectedButtonId ||
message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
""
)

}

function cleanupCache(){

const now = Date.now()

/*
cleanup only every 10 seconds
*/
if(now - lastCleanup < 10000) return

lastCleanup = now

for(const [id,time] of processedMessages){

if(now - time > MESSAGE_CACHE_TTL){
processedMessages.delete(id)
}

}

/*
hard limit protection
*/
if(processedMessages.size > MAX_CACHE){

const keys = processedMessages.keys()

for(let i=0;i<200;i++){

const k = keys.next().value

if(!k) break

processedMessages.delete(k)

}

}

}

async function handle(sock,m){

try{

const message = m.message
if(!message) return

/*
ignore bot messages
*/
if(m.key?.fromMe) return

const messageId = m.key?.id

/*
Prevent duplicate execution
*/

if(messageId){

if(processedMessages.has(messageId)){
return
}

processedMessages.set(messageId,Date.now())

}

/*
cleanup cache periodically
*/

cleanupCache()

const text = extractText(message)

if(!text) return

/*
Try command first
*/

const isCommand =
await commandHandler.handle(sock,m,text)

if(isCommand) return

/*
If not command → run auto detect
*/

await autoDetect(sock,m,text)

}catch(error){

logger.error("MESSAGE_HANDLER_ERROR",{
error:error?.message || error
})

}

}

module.exports = {
handle
}
