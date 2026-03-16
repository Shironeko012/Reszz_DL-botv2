/**
 * Video Downloader Command (Optimized)
 */

const fs = require("fs")

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

/*
Download timeout (ms)
*/
const DOWNLOAD_TIMEOUT = 120000

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

let url = linkConverter.normalize(rawUrl)

if(!url) url = rawUrl

url = url.trim()

if(!validator.isURL(url)){

await sock.sendMessage(chat,{
text:"❌ Link tidak valid."
},{quoted:m})

return
}

/*
Rate limit
*/

const allowed = rateLimiter.check(sender)

if(!allowed){

await sock.sendMessage(chat,{
text:"⏳ Tunggu beberapa detik sebelum download lagi."
},{quoted:m})

return
}

/*
Cache check
*/

try{

const cached = await cacheSystem.get(url)

if(cached && fs.existsSync(cached)){

const sent = await sock.sendMessage(chat,{
video:{url:cached},
mimetype:"video/mp4",
caption:"⚡ Video diambil dari cache"
},{quoted:m}).catch(()=>null)

if(sent) selfDestruct.schedule(sock,chat,sent.key)

return
}

}catch(e){

logger.warn("CACHE_READ_FAILED",e)

}

/*
Duplicate download guard
*/

if(activeDownloads.has(url)){

logger.info("DOWNLOAD_ALREADY_RUNNING",{url})

try{

const result = await activeDownloads.get(url)

if(!result?.file) throw new Error("Invalid result")

const caption = formatter.video(result.metadata)

const sent = await sock.sendMessage(chat,{
video:{url:result.file},
mimetype:"video/mp4",
caption
},{quoted:m}).catch(()=>null)

if(sent) selfDestruct.schedule(sock,chat,sent.key)

}catch(e){

logger.error("DUPLICATE_DOWNLOAD_ERROR",e)

}

return
}

/*
Notify user
*/

await sock.sendMessage(chat,{
text:"📥 Mengunduh video..."
},{quoted:m})

/*
Run worker
*/

let job

try{

job = workerPool.download(url)

}catch(err){

logger.error("WORKERPOOL_CREATE_ERROR",err)

await sock.sendMessage(chat,{
text:"❌ Sistem download sedang bermasalah."
},{quoted:m})

return
}

activeDownloads.set(url,job)

let result

try{

result = await Promise.race([

job,

new Promise((_,reject)=>
setTimeout(()=>{
reject(new Error("Download timeout"))
},DOWNLOAD_TIMEOUT)
)

])

}finally{

activeDownloads.delete(url)

}

/*
Validate result
*/

if(!result || !result.file){

throw new Error("Download result invalid")

}

if(!fs.existsSync(result.file)){

throw new Error("Downloaded file missing")

}

/*
Send result
*/

const caption = formatter.video(result.metadata)

const sent = await sock.sendMessage(chat,{
video:{url:result.file},
mimetype:"video/mp4",
caption
},{quoted:m}).catch(()=>null)

/*
Cache save
*/

try{

await cacheSystem.set(url,result.file)

}catch(e){

logger.warn("CACHE_WRITE_FAILED",e)

}

if(sent){

selfDestruct.schedule(sock,chat,sent.key)

}

}catch(err){

logger.error("DOWNLOAD_ERROR",{
error:err?.message || err
})

await sock.sendMessage(chat,{
text:"❌ Terjadi kesalahan saat download."
},{quoted:m}).catch(()=>null)

}

}
