/**
 * Auto Link Detection
 */

const validator = require("../utils/validator")
const logger = require("../utils/logger")
const linkConverter = require("../lib/linkConverter")

const supportedPlatforms = [
"tiktok.com",
"instagram.com",
"facebook.com",
"youtube.com",
"youtu.be",
"twitter.com",
"x.com",
"pinterest.com",
"reddit.com"
]

function detectPlatform(url){

return supportedPlatforms.find(d => url.includes(d))

}

module.exports = async function autoDetect(sock,m,text){

try{

const chat = m.key.remoteJid

if(!text) return

if(text.length > 300) return

if(!validator.isURL(text)) return

const url = linkConverter.normalize(text)

const platform = detectPlatform(url)

if(!platform) return

const message = `🔎 *Link terdeteksi*

Platform : ${platform}

Pilih tindakan:

📥 Download video
.dl ${url}

🎵 Convert ke MP3
.mp3 ${url}`

await sock.sendMessage(chat,{
text:message
},{quoted:m})

}catch(err){

logger.error("AUTO_DETECT_ERROR",err)

}

}