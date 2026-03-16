const logger = require("./logger")

class Queue {

constructor(concurrency = 2, maxQueue = 50){

this.concurrency = concurrency
this.maxQueue = maxQueue

this.running = 0
this.tasks = []

}

/*
Push new task
*/

push(task){

return new Promise((resolve,reject)=>{

if(this.tasks.length >= this.maxQueue){

logger.warn("QUEUE_FULL",{
queue:this.tasks.length
})

return reject(new Error("Queue full"))

}

this.tasks.push({task,resolve,reject})

process.nextTick(()=>this.next())

})

}

/*
Execute next tasks
*/

async next(){

if(this.running >= this.concurrency) return

const item = this.tasks.shift()

if(!item) return

this.running++

try{

const result = await item.task()

item.resolve(result)

}catch(err){

logger.error("QUEUE_TASK_ERROR", err)

item.reject(err)

}finally{

this.running--

/*
Run next job
*/
process.nextTick(()=>this.next())

}

}

}

const defaultQueue = new Queue(2,50)

module.exports = defaultQueue
