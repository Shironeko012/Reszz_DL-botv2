const MAX_VIDEO_HEIGHT = 360

function selectVideoFormat(){

/*
Universal normal quality
Stable for TikTok / Instagram / YouTube
*/

return `bv*[height<=${MAX_VIDEO_HEIGHT}]+ba/b[height<=${MAX_VIDEO_HEIGHT}]/b/bv*+ba`

}

function selectAudioFormat(){

return `ba/bestaudio`

}

function selectPlaylistFormat(){

return `bv*[height<=${MAX_VIDEO_HEIGHT}]+ba/b`

}

module.exports = {
selectVideoFormat,
selectAudioFormat,
selectPlaylistFormat
}