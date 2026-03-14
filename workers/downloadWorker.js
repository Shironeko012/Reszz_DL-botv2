/**
 * Download Worker
 * Execute download tasks using downloader engine
 */

const logger = require("../utils/logger")
const downloader = require("../lib/downloader")
const retryEngine = require("../lib/retryEngine")

const MAX_TIMEOUT = 180000

async function execute(task){

return Promise.race([

task(),

new Promise((_,reject)=>
setTimeout(()=>reject(new Error("Worker timeout")),MAX_TIMEOUT)
)

])

}

async function downloadVideo(url){

try{

logger.info("WORKER_VIDEO_START",{url})

const result = await retryEngine.retry(async()=>{

return await execute(()=>downloader.downloadVideo(url))

})

if(!result || !result.file){

throw new Error("Invalid download result")

}

logger.info("WORKER_VIDEO_SUCCESS",{file:result.file})

return result

}catch(error){

logger.error("WORKER_VIDEO_DOWNLOAD_FAILED",{
url,
error:error.message
})

throw error

}

}

async function downloadMP3(url){

try{

logger.info("WORKER_AUDIO_START",{url})

const result = await retryEngine.retry(async()=>{

return await execute(()=>downloader.downloadAudio(url))

})

if(!result || !result.file){

throw new Error("Invalid audio result")

}

logger.info("WORKER_AUDIO_SUCCESS",{file:result.file})

return result

}catch(error){

logger.error("WORKER_MP3_DOWNLOAD_FAILED",{
url,
error:error.message
})

throw error

}

}

module.exports = {
downloadVideo,
downloadMP3
}