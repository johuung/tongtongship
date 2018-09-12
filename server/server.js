var express = require('express');
var app = express();
var path = require("path");

var myBucket = 'jehyunlims-bucket93';
var myKey = 'AKIAIAZTO7WURJ2E3E6Q';
var mySecKey = 'vsChK3ytn1kEC+/id9RcDhgVk23URKbd7CQaHCWM';
var AWS = require('aws-sdk');
var s3 = new AWS.S3(
    {accessKeyId: myKey,
    secretAccessKey: mySecKey,
    Bucket: myBucket}
);

app.use('/static', express.static(path.join(__dirname, 'public')))

app.get('/', function (req, res) {
    res.append('Set-Cookie', 'foo=bar');
    res.sendFile(path.join(__dirname+'/../client/client.html'));
});


const WebSocket = require('ws');
const http = require('http'); 
//const wss = new WebSocket.Server({ port: 8080 });
const server = new http.createServer(app).listen(8080);
const wss = new WebSocket.Server({ server });
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
	json = JSON.parse(message);
	console.log('received cookie: %s', json.cookie);

	var b64string = json.image;
	var data = b64string.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	
	var params = { Bucket: myBucket, Key: 'sex.jpeg', ContentEncoding: 'base64', ContentType: 'image/jpeg', Body: buf };
	s3.upload(params, function(err, data){
        if (err) {
          console.log('error in callback');
          console.log(err);
        }
        console.log('success');
        console.log(data);
	});
   	ws.send(json.image);
    }); 
});
