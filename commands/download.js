/**
 * Video Downloader Command
 */

const validator = require("../utils/validator")
const logger = require("../utils/logger")
const rateLimiter = require("../systems/rateLimiter")
const cacheSystem = require("../systems/cacheSystem")
const workerPool = require("../workers/workerPool")
const formatter = require("../lib/formatter")
const selfDestruct = require("../utils/selfDestruct")
const linkConverter = require("../lib/linkConverter")

/*
Prevent duplicate downloads
*/
const activeDownloads = new Map()

module.exports = async function downloadCommand(sock,m,args){

const chat = m.key.remoteJid
const sender = m.key.participant || m.key.remoteJid

try{

if(!args || !args[0]){

await sock.sendMessage(chat,{
text:"❌ Masukkan link video.\n\nContoh:\n.dl https://tiktok.com/xxxxx"
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
text:"⏳ Tunggu beberapa detik sebelum download lagi."
},{quoted:m})

return
}

/*
Check cache
*/

const cached = await cacheSystem.get(url)

if(cached){

const sent = await sock.sendMessage(chat,{
video:{url:cached},
mimetype:"video/mp4",
caption:"⚡ Video diambil dari cache"
},{quoted:m}).catch(()=>null)

if(sent) selfDestruct.schedule(sock,chat,sent.key)

return
}

/*
Prevent duplicate download
*/

if(activeDownloads.has(url)){

logger.info("DOWNLOAD_ALREADY_RUNNING",{url})

const result = await activeDownloads.get(url)

const caption = formatter.video(result.metadata)

const sent = await sock.sendMessage(chat,{
video:{url:result.file},
mimetype:"video/mp4",
caption
},{quoted:m}).catch(()=>null)

if(sent) selfDestruct.schedule(sock,chat,sent.key)

return
}

await sock.sendMessage(chat,{
text:"📥 Mengunduh video..."
},{quoted:m})

/*
Run worker
*/

const job = workerPool.download(url)

activeDownloads.set(url,job)

let result

try{

result = await job

}finally{

activeDownloads.delete(url)

}

if(!result || !result.file){
throw new Error("Download result invalid")
}

const caption = formatter.video(result.metadata)

const sent = await sock.sendMessage(chat,{
video:{url:result.file},
mimetype:"video/mp4",
caption
},{quoted:m}).catch(()=>null)

try{
await cacheSystem.set(url,result.file)
}catch(e){}

if(sent) selfDestruct.schedule(sock,chat,sent.key)

}catch(err){

logger.error("DOWNLOAD_ERROR",{
error:err?.message || err
})

await sock.sendMessage(chat,{
text:"❌ Terjadi kesalahan saat download."
},{quoted:m})

}

}