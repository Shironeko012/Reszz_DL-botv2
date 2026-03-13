/**
 * Formatter Utility
 * Format metadata for bot messages
 */

function formatDuration(seconds){

if(!seconds || isNaN(seconds)) return "0:00"

const minutes = Math.floor(seconds / 60)
const secs = seconds % 60

return `${minutes}:${secs.toString().padStart(2,"0")}`

}

function formatViews(views){

if(!views) return "0"

if(views >= 1000000) return (views/1000000).toFixed(1)+"M"
if(views >= 1000) return (views/1000).toFixed(1)+"K"

return views.toString()

}

function detectPlatform(url=""){

const u = url.toLowerCase()

if(u.includes("youtube") || u.includes("youtu.be")) return "YouTube"
if(u.includes("tiktok")) return "TikTok"
if(u.includes("instagram")) return "Instagram"
if(u.includes("facebook") || u.includes("fb.watch")) return "Facebook"
if(u.includes("twitter") || u.includes("x.com")) return "Twitter/X"

return "Media"
}

function video(metadata={}){

const title = metadata.title || "Unknown Title"
const uploader = metadata.uploader || "Unknown"
const duration = formatDuration(metadata.duration)
const views = formatViews(metadata.view_count)
const platform = detectPlatform(metadata.webpage_url)

return `🎬 *${title}*

🌐 Platform : ${platform}
👤 Uploader : ${uploader}
👁 Views : ${views}
⏱ Duration : ${duration}

⬇️ Downloaded by Bot`

}

function audio(metadata={}){

const title = metadata.title || "Unknown Title"
const uploader = metadata.uploader || "Unknown"
const duration = formatDuration(metadata.duration)

return `🎵 *${title}*

👤 Artist : ${uploader}
⏱ Duration : ${duration}

🎧 Converted to MP3`

}

module.exports={
video,
audio,
formatDuration
}