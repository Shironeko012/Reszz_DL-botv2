const { exec } = require("child_process")
const logger = require("./logger")

const MAX_BUFFER = 1024 * 1024 * 25 // 🔽 turunin biar hemat RAM (25MB)
const DEFAULT_TIMEOUT = 3 * 60 * 1000 // 🔽 3 menit cukup

function run(command, options = {}) {

return new Promise((resolve, reject) => {

const timeout = options.timeout || DEFAULT_TIMEOUT

let finished = false

const child = exec(command, {
maxBuffer: MAX_BUFFER,
timeout
}, (error, stdout, stderr) => {

if (finished) return
finished = true

if (error) {

logger.error("EXEC_ERROR", {
command,
error: error.message,
stderr: stderr?.slice(0,200)
})

return reject(error)
}

resolve(stdout)

})

/*
Hard timeout (backup safety)
*/
const timer = setTimeout(() => {

if (finished) return
finished = true

try {
child.kill("SIGKILL")
} catch(e){}

logger.error("EXEC_TIMEOUT", { command })

reject(new Error("Process timeout"))

}, timeout + 1000)

/*
Cleanup on exit
*/
child.on("exit", () => {
clearTimeout(timer)
})

/*
Process error (spawn error)
*/
child.on("error", (err) => {

if (finished) return
finished = true

clearTimeout(timer)

logger.error("EXEC_PROCESS_ERROR", {
command,
error: err.message
})

reject(err)

})

})

}

module.exports = run
