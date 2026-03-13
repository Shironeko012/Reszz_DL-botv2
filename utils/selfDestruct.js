const logger = require("./logger")

const DEFAULT_DELAY = 24 * 60 * 60 * 1000

function schedule(sock, chatId, messageKey, delay = DEFAULT_DELAY){

if(!sock || !chatId || !messageKey) return

const key = messageKey

setTimeout(async()=>{

try{

await sock.sendMessage(chatId,{
delete:key
})

}catch(err){

if(err?.message?.includes("not found")) return
if(err?.message?.includes("already")) return

logger.warn("SELF_DESTRUCT_FAILED",{
chatId,
error: err?.message || err
})

}

}, delay)

}

module.exports = {
schedule
}