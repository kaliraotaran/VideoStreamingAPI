

const express = require('express')
const fs = require('fs')
const app = express()
const mongodb = require('mongodb')
const url = 'mongodb+srv://<username>:<password>@cluster0.dx0nghd.mongodb.net'




app.get('/', function(req, res){
    res.sendFile(__dirname +"/index.html")
});
 
// upload the video to mongodb
app.get('/init-video',function(req, res){
    mongodb.MongoClient.connect(url , function(error, client){
        if(error){
            res.json(error);
            return;
        }
        const db = client.db('videos');
        const bucket = new mongodb.GridFSBucket(db);
        const videoUploadStream = bucket.openUploadStream('vid')
        const videoReadStream = fs.createReadStream('vid.mp4')
        videoReadStream.pipe(videoUploadStream)
        res.status(200).send('video Sent!!')
    })
} )

app.get('/video', function(req, res){

    mongodb.MongoClient.connect(url, function(error, client){
        if(error){
            res.status(500).json(error);
            return;
        }

   

    const range = req.headers.range;
    if (!range) {
        res.status(400).send('Requires range headers')
    }

    const db = client.db('videos');
    db.collection('fs.files').findOne({}, (err, video)=>{
        if(!video){
            res.status(400).send("No Video Found");
            return;
        }
   
// we do this to divide teh video into chunks and only send certain chunks to user to stream
    // const videoPath = 'vid.mp4';
    const videoSize = video.contentLength;

    const chunkSize = 10**6 // 1MB
    const start = Number(range.replace(/\D/g,""))// removed all non digit characters with empty string
    // const end = Math.min(start+ chunkSize, videoSize-1)
    const end = videoSize-1;

    const contentLength = end-start +1;
    const headers = {
        "Content-Range":`bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges":"bytes",
        "Content-Length":contentLength,
        "Content-Type":"video/mp4"
    }

    res.writeHead(206, headers);

    const bucket = new mongodb.GridFSBucket(db);
    const downloadStream = bucket.openDownloadStreamByName('vid', {start});

    downloadStream.pipe(res);

    // const videoStream = fs.createReadStream(videoPath, {start, end});

    // videoStream.pipe(res);
 })

})
 })

app.listen(4000, function(){
    console.log('Listening on port 5000')
})