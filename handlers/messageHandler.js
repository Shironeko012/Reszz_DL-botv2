/**
 * Message Handler
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

function extractText(message){

return (
message?.conversation ||
message?.extendedTextMessage?.text ||
message?.imageMessage?.caption ||
message?.videoMessage?.caption ||
message?.documentMessage?.caption ||
message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
""
)

}

function cleanupCache(){

const now = Date.now()

for(const [id,time] of processedMessages){

if(now - time > MESSAGE_CACHE_TTL){
processedMessages.delete(id)
}

}

if(processedMessages.size > MAX_CACHE){

const keys = [...processedMessages.keys()].slice(0,200)

keys.forEach(k=>processedMessages.delete(k))

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

cleanupCache()

const text = extractText(message)

if(!text) return

console.log("📩 MESSAGE:", text)

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

module.exports={
handle
}