/**
 * Downloader Engine
 * Advanced yt-dlp downloader
 */

const fs = require("fs")
const path = require("path")

const exec = require("../utils/exec")
const logger = require("../utils/logger")

const retryEngine = require("./retryEngine")
const formatSelector = require("./formatSelector")
const metadata = require("./metadata")

const TEMP_DIR = path.resolve("./storage/temp")

function ensureTempDir(){

if(!fs.existsSync(TEMP_DIR)){
fs.mkdirSync(TEMP_DIR,{recursive:true})
}

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

/*
priority:
1 id match
2 mp4
3 webm
4 mkv
*/

let match = files.find(f => f.startsWith(id))

if(!match){

match = files.find(f =>
f.includes(id)
)

}

if(!match){

match = files.find(f =>
f.endsWith(".mp4") ||
f.endsWith(".webm") ||
f.endsWith(".mkv")
)

}

if(!match) return null

return path.join(TEMP_DIR,match)

}

function detectPlaylist(url){

return url.includes("playlist") || url.includes("list=")

}

function detectPlatform(url){

const u = url.toLowerCase()

if(u.includes("tiktok")) return "tiktok"
if(u.includes("instagram")) return "instagram"
if(u.includes("facebook")) return "facebook"
if(u.includes("youtube") || u.includes("youtu.be")) return "youtube"

return "generic"

}

async function downloadVideo(url){

try{

ensureTempDir()

const info = await metadata.fetchMetadata(url)

const isPlaylist = detectPlaylist(url)

const platform = detectPlatform(url)

const format = isPlaylist
? formatSelector.selectPlaylistFormat()
: formatSelector.selectVideoFormat()

const output = buildOutputTemplate()

let downloaderArgs = `
--external-downloader aria2c
--external-downloader-args "-x 32 -s 32 -k 1M"
`

if(platform === "tiktok" || platform === "instagram"){

downloaderArgs += `
--concurrent-fragments 8
-N 8
`

}

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
--retries 10
--fragment-retries 10
--extractor-retries 5
--file-access-retries 5
--concurrent-fragments 8
--external-downloader aria2c
--external-downloader-args "-x 16 -s 16 -k 1M"
--force-overwrites
--no-check-certificates
"${url}"
`.replace(/\s+/g," ").trim()

logger.info("DOWNLOAD_VIDEO_START", url)

await retryEngine.retry(async()=>{

await exec(command,{timeout:240000})

})

let file = path.join(TEMP_DIR,`${info.id}.mp4`)

if(!fs.existsSync(file)){

logger.warn("FILE_ID_NOT_FOUND", info.id)

file = findDownloadedFile(info.id)

}

ensureFile(file)

const size = fs.statSync(file).size

if(size > 60 * 1024 * 1024){
throw new Error("File too large")
}

logger.info("DOWNLOAD_VIDEO_SUCCESS", file)

return {
file,
metadata:info
}

}catch(error){

logger.error("VIDEO_DOWNLOAD_ERROR", error)

throw error

}

}

async function downloadAudio(url){

try{

ensureTempDir()

const info = await metadata.fetchMetadata(url)

const format = formatSelector.selectAudioFormat()

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
--retries 10
--fragment-retries 10
--extractor-retries 5
--file-access-retries 5
--concurrent-fragments 8
--external-downloader aria2c
--external-downloader-args "-x 16 -s 16 -k 1M"
--force-overwrites
--no-check-certificates
"${url}"
`.replace(/\s+/g," ").trim()

logger.info("DOWNLOAD_AUDIO_START", url)

await retryEngine.retry(async()=>{

await exec(command,{timeout:180000})

})

let file = path.join(TEMP_DIR,`${info.id}.mp3`)

if(!fs.existsSync(file)){

logger.warn("AUDIO_FILE_ID_NOT_FOUND", info.id)

file = findDownloadedFile(info.id)

}

ensureFile(file)

logger.info("DOWNLOAD_AUDIO_SUCCESS", file)

return {
file,
metadata:info
}

}catch(error){

logger.error("AUDIO_DOWNLOAD_ERROR", error)

throw error

}

}

module.exports = {
downloadVideo,
downloadAudio
}