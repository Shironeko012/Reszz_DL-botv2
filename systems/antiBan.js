const logger = require("../utils/logger")

const MIN_DELAY = 800
const MAX_DELAY = 2500

function randomDelay(){

const base = Math.random()*(MAX_DELAY-MIN_DELAY)+MIN_DELAY
const jitter = Math.random()*200

return Math.floor(base+jitter)

}

async function typing(sock,chat){

try{

await sock.sendPresenceUpdate("composing",chat)

}catch(err){

logger.warn("TYPING_FAILED",err.message)

}

}

async function delay(){

return new Promise(r=>setTimeout(r,randomDelay()))

}

async function safeSend(sock,chat,message,options={}){

try{

await typing(sock,chat)

await delay()

return await sock.sendMessage(chat,message,options)

}catch(err){

logger.error("SAFE_SEND_ERROR",err)

throw err

}

}

module.exports={
delay,
typing,
safeSend
}