const logger = require("../utils/logger")

const LIMIT = 5000
const MAX_USERS = 2000

const users = new Map()

function check(user){

const now = Date.now()

const last = users.get(user)

if(!last){

users.set(user, now)
return true

}

if(now - last < LIMIT){

return false

}

users.set(user, now)
return true

}

/*
AUTO CLEANUP
prevent memory leak
*/

function cleanup(){

const now = Date.now()

for(const [user,time] of users){

if(now - time > 60 * 1000){
users.delete(user)
}

}

/*
Hard limit protection
*/

if(users.size > MAX_USERS){

const keys = users.keys()

for(let i=0;i<200;i++){

const k = keys.next().value
if(!k) break

users.delete(k)

}

}

logger.info("RATE_LIMITER_CLEANUP",{
size:users.size
})

}

setInterval(cleanup,60 * 1000)

module.exports = {
check
}
