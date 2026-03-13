const logger = require("../utils/logger")

const DEFAULT_RETRIES = 4
const DEFAULT_DELAY = 2000

function sleep(ms){
return new Promise(r=>setTimeout(r,ms))
}

async function retry(task,options={}){

const retries = options.retries || DEFAULT_RETRIES
const delay = options.delay || DEFAULT_DELAY

let lastError

for(let attempt=1; attempt<=retries; attempt++){

try{

return await task()

}catch(err){

lastError = err

logger.error("RETRY_ATTEMPT_FAILED",{
attempt,
retries,
error:err.message
})

if(attempt < retries){

await sleep(delay * attempt)

}

}

}

throw lastError

}

module.exports = {
retry
}