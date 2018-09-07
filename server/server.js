var express = require('express');
var app = express();
app.use(express.static(__dirname + '/../client'));

/*
app.get('/', function (req, res) {
    res.sendFile("client.html");
});
*/

const WebSocket = require('ws');
const http = require('http'); 
//const wss = new WebSocket.Server({ port: 8080 });
const server = new http.createServer(app).listen(8080);
const wss = new WebSocket.Server({ server });
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
	console.log('received: %s', message);
	ws.send(message);
    }); 
});
