const exec = require("../utils/exec")
const logger = require("../utils/logger")
const crypto = require("crypto")

async function fetchMetadata(url){

try{

const command = `yt-dlp --dump-json "${url}"`

const output = await exec(command)

if(!output){
throw new Error("Empty metadata response")
}

const jsonLine = output
.split("\n")
.find(line => line.trim().startsWith("{"))

if(!jsonLine){
throw new Error("Invalid metadata JSON")
}

const data = JSON.parse(jsonLine)

return normalize(url,data)

}catch(error){

logger.error("METADATA_ERROR",{
url,
error:error.message
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

isPlaylist: !!data.entries,

platform: detectPlatform(url)

}

}

function detectPlatform(url){

if(url.includes("tiktok")) return "tiktok"
if(url.includes("instagram")) return "instagram"
if(url.includes("youtu")) return "youtube"

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