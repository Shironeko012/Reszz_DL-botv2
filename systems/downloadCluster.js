const logger = require("../utils/logger")

const nodes=[
{ id:"local", healthy:true }
]

let index=0

function getHealthyNode(){

const healthy = nodes.filter(n=>n.healthy)

if(healthy.length===0){

logger.error("NO_HEALTHY_NODE")

return null

}

const node = healthy[index % healthy.length]

index++

return node

}

function markUnhealthy(id){

const node = nodes.find(n=>n.id===id)

if(node) node.healthy=false

}

function markHealthy(id){

const node = nodes.find(n=>n.id===id)

if(node) node.healthy=true

}

module.exports={
getHealthyNode,
markUnhealthy,
markHealthy
}