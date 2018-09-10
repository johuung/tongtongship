var express = require('express');
var app = express();
var path = require("path");

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
	ws.send(json.image);
    }); 
});
