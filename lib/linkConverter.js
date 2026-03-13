/**
 * Link Converter
 * Normalize URLs before sending to yt-dlp
 */

function normalize(url){

if(!url) return null

let clean = url.trim()

/*
remove tracking params
*/

if(clean.includes("?")){
clean = clean.split("?")[0]
}

/*
youtu.be → youtube watch
*/

if(clean.includes("youtu.be")){

const id = clean.split("/").pop()

return `https://www.youtube.com/watch?v=${id}`

}

/*
youtube shorts → watch
*/

if(clean.includes("/shorts/")){

const id = clean.split("/shorts/")[1].split("/")[0]

return `https://www.youtube.com/watch?v=${id}`

}

/*
instagram share → reel
*/

if(clean.includes("/share/")){
clean = clean.replace("/share/","/reel/")
}

/*
remove trailing slash
*/

if(clean.endsWith("/")){
clean = clean.slice(0,-1)
}

return clean

}

module.exports={
normalize
}