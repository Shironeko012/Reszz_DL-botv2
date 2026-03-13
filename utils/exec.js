const { exec } = require("child_process")
const logger = require("./logger")

const MAX_BUFFER = 1024 * 1024 * 50

function run(command,options={}){

return new Promise((resolve,reject)=>{

const child = exec(command,{
maxBuffer:MAX_BUFFER,
timeout:options.timeout || 0
},(error,stdout,stderr)=>{

if(error){

logger.error("EXEC_ERROR",{
command,
error:error.message
})

return reject(error)

}

resolve(stdout)

})

child.on("error",err=>{

logger.error("EXEC_PROCESS_ERROR",{
command,
error:err.message
})

reject(err)

})

})

}

module.exports = run