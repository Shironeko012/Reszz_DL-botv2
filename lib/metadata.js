const exec = require("../utils/exec")
const logger = require("../utils/logger")
const crypto = require("crypto")

const METADATA_TIMEOUT = 60000

async function fetchMetadata(url){

try{

/*
Use python module instead of binary
to avoid ENOENT in Railway
*/

const command = `
python3 -m yt_dlp
--dump-json
--no-playlist
--no-warnings
--no-progress
"${url}"
`.replace(/\s+/g," ").trim()

const output = await exec(command,{ timeout: METADATA_TIMEOUT })

if(!output){
throw new Error("Empty metadata response")
}

/*
Find first JSON object in output
*/
const jsonStart = output.indexOf("{")

if(jsonStart === -1){
throw new Error("Invalid metadata JSON")
}

const jsonString = output.slice(jsonStart)

const data = JSON.parse(jsonString)

return normalize(url,data)

}catch(error){

logger.error("METADATA_ERROR",{
url,
error:error?.message || error
})

throw error

}

}

function normalize(url,data){

const id = data.id || generateId(url)

return {

id,

title: data.title || "Unknown Title",

uploader: data.uploader || data.channel || "Unknown",

duration: data.duration || 0,

thumbnail: data.thumbnail || null,

webpage_url: data.webpage_url || url,

view_count: data.view_count || 0,

like_count: data.like_count || 0,

ext: data.ext || "mp4",

isPlaylist: Array.isArray(data.entries),

platform: detectPlatform(url)

}

}

function detectPlatform(url){

const u = url.toLowerCase()

if(u.includes("tiktok")) return "tiktok"
if(u.includes("instagram")) return "instagram"
if(u.includes("facebook")) return "facebook"
if(u.includes("youtu")) return "youtube"
if(u.includes("pin.it") || u.includes("pinterest")) return "pinterest"

return "unknown"

}

function generateId(url){

return crypto
.createHash("md5")
.update(url)
.digest("hex")
.slice(0,10)

}

module.exports = {
fetchMetadata
}
