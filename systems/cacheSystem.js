const logger = require("../utils/logger")
const fileManager = require("../utils/fileManager")

const CACHE_TTL = 24 * 60 * 60 * 1000
const MAX_CACHE = 500

const cache = new Map()

function get(url){

const item = cache.get(url)

if(!item) return null

const now = Date.now()

if(now - item.time > CACHE_TTL){

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

if(!fileManager.fileExists(file)){
return
}

/*
Limit cache size
*/

if(cache.size >= MAX_CACHE){

const firstKey = cache.keys().next().value

if(firstKey){
cache.delete(firstKey)
}

}

cache.set(url,{
file,
time:Date.now()
})

}

function cleanup(){

const now = Date.now()

for(const [url,data] of cache){

if(now - data.time > CACHE_TTL){
cache.delete(url)
}

}

/*
Hard limit protection
*/

if(cache.size > MAX_CACHE){

const keys = cache.keys()

for(let i=0;i<100;i++){

const k = keys.next().value
if(!k) break

cache.delete(k)

}

}

logger.info("CACHE_CLEANUP",{
size:cache.size
})

}

/*
Cleanup every 10 minutes
*/

setInterval(cleanup,600000)

module.exports = {
get,
set
}
