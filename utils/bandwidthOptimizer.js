const os = require("os")

const CPU_COUNT = os.cpus().length

function getConnections(){

if(CPU_COUNT <= 2) return 8
if(CPU_COUNT <= 4) return 12
if(CPU_COUNT <= 8) return 16

return 24

}

function getAria2Args(){

const conn = getConnections()

return [
"--external-downloader","aria2c",
"--external-downloader-args",
`-x ${conn} -s ${conn} -k 1M`
]

}

function limitRate(rate=null){

if(!rate) return []

return [
"--limit-rate",
rate
]

}

module.exports={
getAria2Args,
limitRate
}