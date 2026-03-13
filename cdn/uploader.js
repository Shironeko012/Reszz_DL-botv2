const fs = require("fs")
const path = require("path")
const logger = require("../utils/logger")

const MAX_WHATSAPP_SIZE = 50 * 1024 * 1024

function getFileSize(file){

try{
return fs.statSync(file).size
}catch(err){
logger.error("FILE_SIZE_ERROR",err)
return 0
}

}

function needsUpload(file){

const size = getFileSize(file)

return size > MAX_WHATSAPP_SIZE

}

async function upload(file){

try{

if(!fs.existsSync(file)){
throw new Error("File not found")
}

const name = path.basename(file)

const encoded = encodeURIComponent(name)

const url = `https://cdn.example.com/${encoded}`

logger.info("CDN_UPLOAD_SUCCESS",{file:name})

return{
url,
file
}

}catch(err){

logger.error("CDN_UPLOAD_FAILED",err)

return{
url:null,
file
}

}

}

module.exports={
upload,
needsUpload,
getFileSize
}