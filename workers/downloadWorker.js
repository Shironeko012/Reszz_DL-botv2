/**
 * Download Worker (Production Optimized)
 */

const fs = require("fs")

const logger = require("../utils/logger")
const downloader = require("../lib/downloader")
const retryEngine = require("../lib/retryEngine")

const MAX_TIMEOUT = 180000

/*
Safe executor with timeout + cancellation
*/
async function execute(task, timeout = MAX_TIMEOUT){

if(typeof task !== "function"){
throw new Error("Worker task is not a function")
}

let finished = false

return new Promise((resolve,reject)=>{

const timer = setTimeout(()=>{

if(finished) return

logger.error("WORKER_TIMEOUT")

finished = true

reject(new Error("Worker timeout"))

},timeout)

task()
.then(res=>{

if(finished) return

finished = true

clearTimeout(timer)

resolve(res)

})
.catch(err=>{

if(finished) return

finished = true

clearTimeout(timer)

reject(err)

})

})

}

/*
VALIDATE RESULT
*/
function validateResult(result,type){

if(!result || !result.file){
throw new Error(`Invalid ${type} result`)
}

if(typeof result.file !== "string"){
throw new Error(`${type} file path invalid`)
}

if(!fs.existsSync(result.file)){
throw new Error(`${type} file missing`)
}

}

/*
UNIFIED DOWNLOAD HANDLER
*/
async function runDownload(type, url, handler){

try{

logger.info("WORKER_START",{type,url})

const result = await retryEngine.retry(
() => execute(()=>handler(url)),
{
retries:4
}
)

validateResult(result,type)

logger.info("WORKER_SUCCESS",{
type,
file:result.file
})

return result

}catch(error){

logger.error("WORKER_FAILED",{
type,
url,
error:error?.message || error
})

throw error

}

}

/*
VIDEO
*/
async function downloadVideo(url){
return runDownload("video",url,downloader.downloadVideo)
}

/*
MP3
*/
async function downloadMP3(url){
return runDownload("audio",url,downloader.downloadAudio)
}

module.exports = {
downloadVideo,
downloadMP3
}
