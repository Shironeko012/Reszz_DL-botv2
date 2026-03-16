/**
 * Command Handler (Optimized)
 * Route commands to corresponding modules
 */

const logger = require("../utils/logger")

const commands = {
dl: require("../commands/download"),
mp3: require("../commands/mp3")
}

const PREFIX = "."

/*
Prevent duplicate command execution
*/
const activeCommands = new Map()

const COMMAND_TTL = 15000
const MAX_ACTIVE = 1000

function cleanupCommands(){

const now = Date.now()

for(const [id,time] of activeCommands){

if(now - time > COMMAND_TTL){
activeCommands.delete(id)
}

}

if(activeCommands.size > MAX_ACTIVE){

const keys = activeCommands.keys()

for(let i=0;i<200;i++){

const k = keys.next().value
if(!k) break

activeCommands.delete(k)

}

}

}

async function handle(sock,m,text){

try{

if(!text) return false

/*
quick prefix check
*/
if(text[0] !== PREFIX) return false

/*
limit command length
*/
if(text.length > 500) return false

const messageId = m?.key?.id

/*
Prevent duplicate execution
*/

if(messageId){

if(activeCommands.has(messageId)){
return true
}

activeCommands.set(messageId,Date.now())

}

cleanupCommands()

/*
Parse command
*/

const body = text.slice(1).trim()

if(!body) return false

const spaceIndex = body.indexOf(" ")

let command
let args

if(spaceIndex === -1){

command = body.toLowerCase()
args = []

}else{

command = body.slice(0,spaceIndex).toLowerCase()
args = body.slice(spaceIndex+1).trim().split(/\s+/)

}

const handler = commands[command]

if(!handler){

if(messageId) activeCommands.delete(messageId)

return false

}

logger.info("COMMAND_EXECUTE",{
command,
user:m.key.participant || m.key.remoteJid
})

await handler(sock,m,args)

if(messageId){
activeCommands.delete(messageId)
}

return true

}catch(error){

logger.error("COMMAND_HANDLER_ERROR",{
error:error?.message || error
})

return true

}

}

module.exports = {
handle
}
