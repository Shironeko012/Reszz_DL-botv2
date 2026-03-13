const LIMIT = 5000

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

setInterval(()=>{

const now = Date.now()

for(const [user,time] of users){

if(now - time > 60 * 1000){
users.delete(user)
}

}

}, 60 * 1000)

module.exports = {
check
}