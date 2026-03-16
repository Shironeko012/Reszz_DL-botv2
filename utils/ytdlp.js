const exec = require("./exec")
const logger = require("./logger")
const ytdlpExec = require("yt-dlp-exec")

let engine = null

async function detectEngine(){

if(engine) return engine

try{
await exec("yt-dlp --version",{timeout:5000})
engine = "ytdlp"
logger.info("YT_DLP_ENGINE",{engine:"yt-dlp"})
return engine
}catch(e){}

try{
await exec("python -m yt_dlp --version",{timeout:5000})
engine = "python"
logger.info("YT_DLP_ENGINE",{engine:"python yt_dlp"})
return engine
}catch(e){}

engine = "node"
logger.warn("YT_DLP_ENGINE",{engine:"yt-dlp-exec"})
return engine

}

async function run(args, timeout = 120000){

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
Use python module
*/

if(detected === "python"){

const command = `python -m yt_dlp ${args.join(" ")}`

return await exec(command,{timeout})

}

/*
Node fallback (yt-dlp-exec)
*/

if(detected === "node"){

const url = args[args.length-1].replace(/"/g,"")

const options = {
noWarnings:true,
preferFreeFormats:true
}

return await ytdlpExec(url,options)

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
