const { exec } = require("child_process")
const logger = require("./logger")

const MAX_BUFFER = 1024 * 1024 * 50 // 50MB
const DEFAULT_TIMEOUT = 5 * 60 * 1000 // 5 menit

function run(command, options = {}) {

return new Promise((resolve, reject) => {

const timeout = options.timeout || DEFAULT_TIMEOUT

let killed = false

const child = exec(command, {
maxBuffer: MAX_BUFFER,
timeout
}, (error, stdout, stderr) => {

if (killed) return

if (error) {

logger.error("EXEC_ERROR", {
command,
error: error.message,
stderr: stderr?.slice(0,300)
})

return reject(error)
}

resolve(stdout)

})

/*
Hard timeout (extra safety)
*/
const timer = setTimeout
