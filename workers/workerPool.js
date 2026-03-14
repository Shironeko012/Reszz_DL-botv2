/**
 * Worker Pool
 * Execute workers using global queue
 */

const logger = require("../utils/logger")
const queue = require("../utils/queue")
const downloadWorker = require("./downloadWorker")

/*
Prevent duplicate downloads
*/
const runningJobs = new Map()

async function download(url){

    if(runningJobs.has(url)){
        return runningJobs.get(url)
    }

    const job = queue.push(async()=>{

        const result = await downloadWorker.downloadVideo(url)

        if(!result || !result.file){
            throw new Error("Worker returned invalid result")
        }

        return result
    })

    runningJobs.set(url, job)

    try{
        return await job
    }finally{
        runningJobs.delete(url)
    }

}

/*
MP3 download
*/

async function downloadMP3(url){

    const key = "mp3:"+url

    if(runningJobs.has(key)){
        return runningJobs.get(key)
    }

    const job = queue.push(async()=>{

        const result = await downloadWorker.downloadMP3(url)

        if(!result || !result.file){
            throw new Error("Worker returned invalid result")
        }

        return result
    })

    runningJobs.set(key, job)

    try{
        return await job
    }finally{
        runningJobs.delete(key)
    }

}

module.exports = {
    download,
    downloadMP3
}