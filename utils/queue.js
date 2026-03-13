const logger = require("./logger")

class Queue {

constructor(concurrency = 3){

this.concurrency = concurrency
this.running = 0
this.tasks = []

}

push(task){

return new Promise((resolve,reject)=>{

this.tasks.push({task,resolve,reject})

process.nextTick(()=>this.next())

})

}

async next(){

while(this.running < this.concurrency && this.tasks.length > 0){

const item = this.tasks.shift()

this.running++

try{

const result = await item.task()

item.resolve(result)

}catch(err){

logger.error("QUEUE_TASK_ERROR", err)

item.reject(err)

}finally{

this.running--

}

}

}

}

const defaultQueue = new Queue(3)

module.exports = defaultQueue