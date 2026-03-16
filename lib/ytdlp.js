const exec = require("./exec")
const logger = require("./logger")
const ytdlpExec = require("yt-dlp-exec")

let engine = null

async function detectEngine(){

if(engine) return engine

/*
Try yt-dlp binary
*/

try{
await exec("yt-dlp --version",{timeout:5000})
engine = "ytdlp"
logger.info("YT_DLP_ENGINE","yt-dlp binary detected")
return engine
}catch(e){}

/*
Try python module
*/

try{
await exec("python -m yt_dlp --version",{timeout:5000})
engine = "python"
logger.info("YT_DLP_ENGINE","python yt_dlp detected")
return engine
}catch(e){}

/*
Fallback to node package
*/

engine = "node"
logger.warn("YT_DLP_ENGINE","fallback to yt-dlp-exec")

return engine

}

async function run(args, timeout = 120000){

const detected = await detectEngine()

try{

if(detected === "ytdlp"){

const command = `yt-dlp ${args.join(" ")}`

return await exec(command,{timeout})

}

if(detected === "python"){

const command = `python -m yt_dlp ${args.join(" ")}`

return await exec(command,{timeout})

}

if(detected === "node"){

const url = args[args.length-1].replace(/"/g,"")

return await ytdlpExec(url,{
noWarnings:true
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
