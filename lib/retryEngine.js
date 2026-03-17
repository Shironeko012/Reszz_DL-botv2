const logger = require("../utils/logger")

const DEFAULT_RETRIES = 4
const DEFAULT_DELAY = 2000
const MAX_DELAY = 30000

function sleep(ms){
return new Promise(r=>setTimeout(r,ms))
}

function isFatalError(error){

const msg = (error?.message || "").toLowerCase()

return (
msg.includes("enoent") ||
msg.includes("invalid") ||
msg.includes("not found") ||
msg.includes("unsupported") ||
msg.includes("file too large") ||
msg.includes("403") ||
msg.includes("404")
)

}

function isRetryableError(error){

const msg = (error?.message || "").toLowerCase()

return (
msg.includes("timeout") ||
msg.includes("network") ||
msg.includes("econnreset") ||
msg.includes("etimedout") ||
msg.includes("socket") ||
msg.includes("temporarily") ||
msg.includes("unavailable")
)

}

async function retry(task,options={}){

const retries = options.retries ?? DEFAULT_RETRIES
const baseDelay = options.delay ?? DEFAULT_DELAY
const maxDelay = options.maxDelay ?? MAX_DELAY

let lastError

for(let attempt=1; attempt<=retries; attempt++){

try{

const result = await task()

if(attempt > 1){
logger.info("RETRY_SUCCESS",{attempt})
}

return result

}catch(err){

lastError = err

const fatal = isFatalError(err)
const retryable = isRetryableError(err)

logger.error("RETRY_ATTEMPT_FAILED",{
attempt,
retries,
fatal,
retryable,
error:err?.message || err
})

/*
Stop if fatal
*/
if(fatal){
throw err
}

/*
Stop if not retryable
*/
if(!retryable && attempt === 1){
throw err
}

if(attempt < retries){

/*
Exponential backoff + jitter
*/
let delay = baseDelay * Math.pow(2,attempt-1)

/*
Clamp max delay
*/
if(delay > maxDelay){
delay = maxDelay
}

/*
Add jitter (±20%)
*/
const jitter = delay * 0.2 * Math.random()
delay += jitter

logger.info("RETRY_WAIT",{attempt,delay:Math.floor(delay)})

await sleep(delay)

}

}

}

throw lastError

}

module.exports = {
retry
}
