const logger = require("../utils/logger")
const fileManager = require("../utils/fileManager")

const CACHE_TTL = 24*60*60*1000

const cache = new Map()

function get(url){

const item = cache.get(url)

if(!item) return null

const now = Date.now()

if(now-item.time > CACHE_TTL){

cache.delete(url)

return null

}

if(!fileManager.fileExists(item.file)){

cache.delete(url)

return null

}

return item.file

}

function set(url,file){

cache.set(url,{
file,
time:Date.now()
})

}

function cleanup(){

const now = Date.now()

for(const [url,data] of cache.entries()){

if(now-data.time > CACHE_TTL){

cache.delete(url)

}

}

}

setInterval(cleanup,600000)

module.exports={
get,
set
}