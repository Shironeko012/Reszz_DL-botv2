const logger = require("../utils/logger")

let crashCount = 0
const MAX_CRASH = 10

function register(){

process.on("uncaughtException",(err)=>{

crashCount++

logger.error("UNCAUGHT_EXCEPTION",{
error:err.message,
stack:err.stack,
count:crashCount
})

if(crashCount>MAX_CRASH){

logger.error("CRASH_LIMIT_REACHED")

process.exit(1)

}

})

process.on("unhandledRejection",(reason)=>{

logger.error("UNHANDLED_REJECTION",reason)

})

}

module.exports={
register
}