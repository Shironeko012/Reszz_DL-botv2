/**
 * Link Converter (Optimized)
 * Normalize URLs before sending to yt-dlp
 */

function normalize(url){

if(!url) return null

let clean = url.trim()

/*
Remove whitespace
*/
clean = clean.replace(/\s+/g,"")

/*
YouTube short link
*/
if(clean.includes("youtu.be/")){

const id = clean.split("youtu.be/")[1].split(/[?&]/)[0]

return `https://www.youtube.com/watch?v=${id}`

}

/*
YouTube shorts
*/
if(clean.includes("/shorts/")){

const id = clean.split("/shorts/")[1].split(/[?&/]/)[0]

return `https://www.youtube.com/watch?v=${id}`

}

/*
Mobile YouTube
*/
if(clean.includes("m.youtube.com")){
clean = clean.replace("m.youtube.com","www.youtube.com")
}

/*
Instagram share link
*/
if(clean.includes("instagram.com/share/")){
clean = clean.replace("/share/","/reel/")
}

/*
Remove common tracking parameters
*/
clean = clean.replace(/(\?|&)utm_[^&]+/g,"")
clean = clean.replace(/(\?|&)si=[^&]+/g,"")

/*
Remove trailing slash
*/
if(clean.endsWith("/")){
clean = clean.slice(0,-1)
}

return clean

}

module.exports = {
normalize
}
