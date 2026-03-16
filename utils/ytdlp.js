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

}catch(e){}

/*
Fallback to node package
*/

engine = "node"

logger.warn("YT_DLP_ENGINE",{engine:"yt-dlp-exec fallback"})

return engine

}

async function run(args,timeout=120000){

const detected = await detectEngine()

try{

if(detected === "ytdlp"){

const command = `yt-dlp ${args.join(" ")}`

return await exec(command,{timeout})

}

if(detected === "node"){

/*
yt-dlp-exec only needs URL
*/

const url = args[args.length-1].replace(/"/g,"")

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
