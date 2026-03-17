const exec = require("./exec")
const logger = require("./logger")
const ytdlpExec = require("yt-dlp-exec")

let engine = null

async function detectEngine(){

if(engine) return engine

try{

await exec("yt-dlp --version",{timeout:5000})

engine = "ytdlp"

logger.info("YT_DLP_ENGINE",{engine:"yt-dlp binary"})

return engine

}catch(e){

// silent fail
}

/*
Fallback to node package
*/

engine = "node"

logger.warn("YT_DLP_ENGINE",{engine:"yt-dlp-exec fallback"})

return engine

}

async function run(args,timeout=120000){

if(!Array.isArray(args) || args.length === 0){
throw new Error("Invalid ytdlp args")
}

const detected = await detectEngine()

try{

/*
Use system yt-dlp
*/

if(detected === "ytdlp"){

const command = `yt-dlp ${args.join(" ")}`

return await exec(command,{timeout})

}

/*
Node fallback (yt-dlp-exec)
*/

if(detected === "node"){

const lastArg = args[args.length-1]

if(!lastArg){
throw new Error("URL not found in args")
}

const url = String(lastArg).replace(/"/g,"")

return await ytdlpExec(url,{
noWarnings:true,
preferFreeFormats:true
})

}

}catch(error){

logger.error("YT_DLP_RUN_ERROR",{
engine:detected,
error:error?.message || error
})

throw error

}

}

module.exports = {
run
}
