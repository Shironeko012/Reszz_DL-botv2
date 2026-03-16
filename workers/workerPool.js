/**
 * Worker Pool
 * Execute workers using global queue (Optimized)
 */

const logger = require("../utils/logger")
const queue = require("../utils/queue")
const downloadWorker = require("./downloadWorker")

/*
Prevent duplicate downloads
*/
const runningJobs = new Map()

/*
Worker timeout
*/
const WORKER_TIMEOUT = 180000

function withTimeout(promise, timeout){

return Promise.race([

promise,

new Promise((_,reject)=>
setTimeout(()=>{
reject(new Error("Worker timeout"))
},timeout)
)

])

}

/*
VIDEO DOWNLOAD
*/

async function download(url){

if(runningJobs.has(url)){
return runningJobs.get(url)
}

const job = queue.push(async()=>{

try{

logger.info("WORKER_START",{url})

const result = await withTimeout(
downloadWorker.downloadVideo(url),
WORKER_TIMEOUT
)

if(!result || !result.file){
throw new Error("Worker returned invalid result")
}

return result

}catch(err){

logger.error("WORKER_DOWNLOAD_ERROR",{
url,
error:err?.message || err
})

throw err

}

})

runningJobs.set(url, job)

try{

return await job

}catch(err){

throw err

}finally{

runningJobs.delete(url)

logger.info("WORKER_FINISH",{url})

}

}

/*
MP3 DOWNLOAD
*/

async function downloadMP3(url){

const key = "mp3:"+url

if(runningJobs.has(key)){
return runningJobs.get(key)
}

const job = queue.push(async()=>{

try{

logger.info("WORKER_MP3_START",{url})

const result = await withTimeout(
downloadWorker.downloadMP3(url),
WORKER_TIMEOUT
)

if(!result || !result.file){
throw new Error("Worker returned invalid result")
}

return result

}catch(err){

logger.error("WORKER_MP3_ERROR",{
url,
error:err?.message || err
})

throw err

}

})

runningJobs.set(key, job)

try{

return await job

}catch(err){

throw err

}finally{

runningJobs.delete(key)

logger.info("WORKER_MP3_FINISH",{url})

}

}

module.exports = {
download,
downloadMP3
}
