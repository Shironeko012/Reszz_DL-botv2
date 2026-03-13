/**
 * MP3 Downloader Command
 */

const validator = require("../utils/validator")
const logger = require("../utils/logger")
const rateLimiter = require("../systems/rateLimiter")
const cacheSystem = require("../systems/cacheSystem")
const workerPool = require("../workers/workerPool")
const selfDestruct = require("../utils/selfDestruct")
const linkConverter = require("../lib/linkConverter")

/*
Prevent duplicate MP3 conversion
*/
const activeMP3 = new Map()

module.exports = async function mp3Command(sock,m,args){

const chat = m.key.remoteJid
const sender = m.key.participant || m.key.remoteJid

try{

if(!args || !args[0]){

await sock.sendMessage(chat,{
text:"❌ Masukkan link video.\n\nContoh:\n.mp3 https://youtube.com/watch?v=xxxx"
},{quoted:m})

return
}

const rawUrl = args[0]
const url = linkConverter.normalize(rawUrl)

if(!validator.isURL(url)){

await sock.sendMessage(chat,{
text:"❌ Link tidak valid."
},{quoted:m})

return
}

const allowed = rateLimiter.check(sender)

if(!allowed){

await sock.sendMessage(chat,{
text:"⏳ Tunggu beberapa detik sebelum menggunakan command lagi."
},{quoted:m})

return
}

/*
Check cache
*/

const cached = await cacheSystem.get(url+"_mp3")

if(cached){

const sent = await sock.sendMessage(chat,{
audio:{url:cached},
mimetype:"audio/mpeg",
fileName:"audio.mp3"
},{quoted:m}).catch(()=>null)

if(sent) selfDestruct.schedule(sock,chat,sent.key)

return
}

/*
Prevent duplicate conversion
*/

if(activeMP3.has(url)){

logger.info("MP3_ALREADY_RUNNING",{url})

const result = await activeMP3.get(url)

const sent = await sock.sendMessage(chat,{
audio:{url:result.file},
mimetype:"audio/mpeg",
fileName:"audio.mp3"
},{quoted:m}).catch(()=>null)

if(sent) selfDestruct.schedule(sock,chat,sent.key)

return
}

await sock.sendMessage(chat,{
text:"🎵 Mengubah video menjadi MP3..."
},{quoted:m})

/*
Run worker
*/

const job = workerPool.downloadMP3(url)

activeMP3.set(url,job)

let result

try{

result = await job

}finally{

activeMP3.delete(url)

}

if(!result || !result.file){
throw new Error("MP3 result invalid")
}

const sent = await sock.sendMessage(chat,{
audio:{url:result.file},
mimetype:"audio/mpeg",
fileName:"audio.mp3"
},{quoted:m}).catch(()=>null)

try{
await cacheSystem.set(url+"_mp3",result.file)
}catch(e){}

if(sent) selfDestruct.schedule(sock,chat,sent.key)

}catch(err){

logger.error("MP3_ERROR",{
error:err?.message || err
})

await sock.sendMessage(chat,{
text:"❌ Gagal convert ke MP3."
},{quoted:m})

}

}