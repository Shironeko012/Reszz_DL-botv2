/**
 * Downloader Engine (Optimized for Railway)
 */

const fs = require("fs")
const path = require("path")

const exec = require("../utils/exec")
const logger = require("../utils/logger")

const retryEngine = require("./retryEngine")
const formatSelector = require("./formatSelector")
const metadata = require("./metadata")

const TEMP_DIR = path.resolve("./storage/temp")

let tempReady = false

function ensureTempDir(){

if(tempReady) return

if(!fs.existsSync(TEMP_DIR)){
fs.mkdirSync(TEMP_DIR,{recursive:true})
}

tempReady = true

}

function buildOutputTemplate(){
return `${TEMP_DIR}/%(id)s.%(ext)s`
}

function ensureFile(file){

if(!file) throw new Error("File path empty")

if(!fs.existsSync(file)){
throw new Error("Downloaded file not found")
}

const size = fs.statSync(file).size

if(size === 0){
fs.unlinkSync(file)
throw new Error("Downloaded file corrupted")
}

}

function findDownloadedFile(id){

const files = fs.readdirSync(TEMP_DIR)

for(const f of files){

if(
f.startsWith(id) &&
(
f.endsWith(".mp4") ||
f.endsWith(".webm") ||
f.endsWith(".mkv") ||
f.endsWith(".mp3")
)
){
return path.join(TEMP_DIR,f)
}

}

return null

}

function sanitizeURL(url){
return String(url).trim()
}

async function runYTDLP(url,format,timeout){

const output = buildOutputTemplate()

const command = `
yt-dlp
-f "${format}"
-o "${output}"
--merge-output-format mp4
--no-playlist
--no-warnings
--no-part
--no-mtime
--newline
--retries 5
--fragment-retries 5
--extractor-retries 3
--file-access-retries 3
--concurrent-fragments 4
--external-downloader aria2c
--external-downloader-args "-x 8 -s 8 -k 1M"
--force-overwrites
--no-check-certificates
"${url}"
`.replace(/\s+/g," ").trim()

await exec(command,{timeout})

}

async function downloadVideo(url){

try{

ensureTempDir()

url = sanitizeURL(url)

const info = await metadata.fetchMetadata(url)

const format = formatSelector.selectVideoFormat()

logger.info("DOWNLOAD_VIDEO_START",{url})

await retryEngine.retry(async()=>{

await runYTDLP(url,format,240000)

})

let file = path.join(TEMP_DIR,`${info.id}.mp4`)

if(!fs.existsSync(file)){

logger.warn("FILE_ID_NOT_FOUND",info.id)

file = findDownloadedFile(info.id)

}

ensureFile(file)

const size = fs.statSync(file).size

if(size > 60 * 1024 * 1024){
throw new Error("File too large")
}

logger.info("DOWNLOAD_VIDEO_SUCCESS",{file})

return {
file,
metadata:info
}

}catch(error){

logger.error("VIDEO_DOWNLOAD_ERROR",{
error:error?.message || error
})

throw error

}

}

async function downloadAudio(url){

try{

ensureTempDir()

url = sanitizeURL(url)

const info = await metadata.fetchMetadata(url)

const format = formatSelector.selectAudioFormat()

logger.info("DOWNLOAD_AUDIO_START",{url})

await retryEngine.retry(async()=>{

await runYTDLP(url,format,180000)

})

let file = path.join(TEMP_DIR,`${info.id}.mp3`)

if(!fs.existsSync(file)){

logger.warn("AUDIO_FILE_ID_NOT_FOUND",info.id)

file = findDownloadedFile(info.id)

}

ensureFile(file)

logger.info("DOWNLOAD_AUDIO_SUCCESS",{file})

return {
file,
metadata:info
}

}catch(error){

logger.error("AUDIO_DOWNLOAD_ERROR",{
error:error?.message || error
})

throw error

}

}

module.exports = {
downloadVideo,
downloadAudio
}
