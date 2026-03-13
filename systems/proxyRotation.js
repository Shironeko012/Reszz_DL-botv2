const fs=require("fs")
const path=require("path")

const PROXY_FILE=path.resolve("./storage/proxy.txt")

let proxies=[]
let index=0

function load(){

if(!fs.existsSync(PROXY_FILE)) return

proxies=fs.readFileSync(PROXY_FILE,"utf8")
.split("\n")
.map(v=>v.trim())
.filter(Boolean)

}

function getProxy(){

if(proxies.length===0) return null

const proxy=proxies[index]

index=(index+1)%proxies.length

return proxy

}

function getProxyArgs(){

const proxy=getProxy()

if(!proxy) return ""

return `--proxy ${proxy}`

}

setInterval(load,300000)

load()

module.exports={
getProxy,
getProxyArgs
}