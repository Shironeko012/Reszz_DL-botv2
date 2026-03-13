const fs = require("fs")
const path = require("path")
const logger = require("./logger")

const TEMP_DIR = path.resolve("./storage/temp")
const CACHE_DIR = path.resolve("./storage/cache")

function ensureDir(dir){

try{

if(!fs.existsSync(dir)){
fs.mkdirSync(dir,{recursive:true})
}

}catch(err){

logger.error("DIR_CREATE_ERROR",{
dir,
error:err.message
})

}

}

ensureDir(TEMP_DIR)
ensureDir(CACHE_DIR)

function getTempPath(name){
return path.join(TEMP_DIR,name)
}

function getCachePath(name){
return path.join(CACHE_DIR,name)
}

function fileExists(file){

try{
return fs.existsSync(file)
}catch{
return false
}

}

function deleteFile(file){

try{

if(fs.existsSync(file)){
fs.unlinkSync(file)
}

}catch(err){

logger.warn("FILE_DELETE_FAILED",{
file,
error:err.message
})

}

}

function cleanupTemp(maxAgeMs=3600000){

try{

const files = fs.readdirSync(TEMP_DIR)

const now = Date.now()

for(const file of files){

const filePath = path.join(TEMP_DIR,file)

const stats = fs.statSync(filePath)

if(now - stats.mtimeMs > maxAgeMs){

deleteFile(filePath)

}

}

}catch(err){

logger.warn("TEMP_CLEANUP_FAILED",err)

}

}

module.exports={
getTempPath,
getCachePath,
fileExists,
deleteFile,
cleanupTemp
}