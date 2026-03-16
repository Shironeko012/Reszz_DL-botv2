const { spawn } = require("child_process")
const logger = require("./logger")

const MAX_RUNTIME = 5 * 60 * 1000 // 5 menit default

function run(command, options = {}) {

return new Promise((resolve, reject) => {

const timeout = options.timeout || MAX_RUNTIME

/*
Split command safely
*/
const parts = command.split(" ")
const cmd = parts.shift()

const child = spawn(cmd, parts, {
shell: false,
stdio: ["ignore","pipe","pipe"]
})

let stdout = ""
let stderr = ""

const timer = setTimeout(() => {

logger.error("EXEC_TIMEOUT", { command })

try{
child.kill("SIGKILL")
}catch(e){}

reject(new Error("Process timeout"))

}, timeout)

child.stdout.on("data", data => {
stdout += data.toString()
})

child.stderr.on("data", data => {
stderr += data.toString()
})

child.on("error", err => {

clearTimeout(timer)

logger.error("EXEC_PROCESS_ERROR", {
command,
error: err.message
})

reject(err)

})

child.on("close", code => {

clearTimeout(timer)

if(code !== 0){

logger.error("EXEC_EXIT_ERROR", {
command,
code,
stderr: stderr.slice(0,500)
})

return reject(new Error(`Process exited with code ${code}`))

}

resolve(stdout)

})

})

}

module.exports = run
