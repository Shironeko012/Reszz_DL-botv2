/**
 * Download Worker
 * Execute download tasks using downloader engine (Optimized)
 */

const fs = require("fs")

const logger = require("../utils/logger")
const downloader = require("../lib/downloader")
const retryEngine = require("../lib/retryEngine")

const MAX_TIMEOUT = 180000

/*
Safe task executor with timeout
*/

async function execute(task){

if(typeof task !== "function"){
throw new Error("Worker task is not a function")
}

return Promise.race([

task(),

new Promise((_,reject)=>
setTimeout(()=>{
reject(new Error("Worker timeout"))
},MAX_TIMEOUT)
)

])

}

/*
VIDEO DOWNLOAD
*/

async function downloadVideo(url){

try{

logger.info("WORKER_VIDEO_START",{url})

const result = await retryEngine.retry(async()=>{

return await execute(()=>downloader.downloadVideo(url))

})

if(!result || !result.file){

throw new Error("Invalid download result")

}

if(typeof result.file !== "string"){

throw new Error("Result file path invalid")

}

if(!fs.existsSync(result.file)){

throw new Error("Downloaded video file missing")

}

logger.info("WORKER_VIDEO_SUCCESS",{file:result.file})

return result

}catch(error){

logger.error("WORKER_VIDEO_DOWNLOAD_FAILED",{
url,
error:error?.message || error
})

throw error

}

}

/*
MP3 DOWNLOAD
*/

async function downloadMP3(url){

try{

logger.info("WORKER_AUDIO_START",{url})

const result = await retryEngine.retry(async()=>{

return await execute(()=>downloader.downloadAudio(url))

})

if(!result || !result.file){

throw new Error("Invalid audio result")

}

if(typeof result.file !== "string"){

throw new Error("Result audio path invalid")

}

if(!fs.existsSync(result.file)){

throw new Error("Downloaded audio file missing")

}

logger.info("WORKER_AUDIO_SUCCESS",{file:result.file})

return result

}catch(error){

logger.error("WORKER_MP3_DOWNLOAD_FAILED",{
url,
error:error?.message || error
})

throw error

}

}

module.exports = {
downloadVideo,
downloadMP3
}
