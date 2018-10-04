var express = require('express');
var app = express();
var path = require("path");
var randomString = require('random-string');
var cookie = require('cookie');

var models = require('../db/models');
var LobbyUsers = models.LobbyUser;
var CallUsers = models.CallUser;
var Matchings = models.Matching;

const env = 'development';
const config = require('../db/config/config.js')[env];
const Sequelize = require('../db/node_modules/sequelize');


const sequelize = new Sequelize(config.database, config.username, config.password, {
	host: config.host,
	dialect: config.dialect,
	operatorsAliases: false,
});

const Op = Sequelize.Op;

/*
sequelize
.authenticate()
.then(() => {
console.log('Connection has been established successfully.');
})
.catch(err => {
console.error('Unable to connect to the database:', err);
});
*/

var myBucket = 'jehyunlims-bucket93';
//var myKey = '';
//var mySecKey = '';
var AWS = require('aws-sdk');
/*
var s3 = new AWS.S3(
{accessKeyId: myKey,
secretAccessKey: mySecKey,
Bucket: myBucket}
);
*/

app.use('/static', express.static(path.join(__dirname, 'public')))

app.get('/', function (req, res) {
	var tempCookie = getRandomCookie();
	res.append('Set-Cookie', cookie.serialize('cookie', tempCookie));
	res.sendFile(path.join(__dirname+'/../client/client.html'));
	addUser(tempCookie);
	console.log('set cookie : ' + tempCookie);
});

const WebSocket = require('ws');
const http = require('http');
//const wss = new WebSocket.Server({ port: 8080 });
const server = new http.createServer(app).listen(8080);
const wss = new WebSocket.Server({ server: server, clientTracking: true });

wss.on('connection', function connection(ws, req) {
	reqCookies = cookie.parse(req.headers.cookie);
	ws.cookie = reqCookies['cookie'];

	ws.on('message', function incoming(message) {
		recvMessage(ws, message);
	});
	ws.on('close', function close() {
		console.log('disconnected');
		deleteUser(ws.cookie);
	});
});

function getRandomUsers(tempCookie) {
	return new Promise(function (resolve, reject) {
		console.log(sequelize.random);
		console.log(sequelize.random());
		LobbyUsers.findAll({
			where: {
				cookie: {
					[Op.ne]: tempCookie
				}
			},
			limit: 9,
			//order: sequelize.col('cookie')
			//order: [Sequelize.fn('RANDOM')]
			order: sequelize.random()
		}).then(user => {
			resolve(user);
		});
	});
}

function addUser(tempCookie) {
	getRandomUsers(tempCookie).then(function (randomUsers) {
		var info = {
			cookie: tempCookie,
			url: 'https://s3.ap-northeast-2.amazonaws.com/jehyunlims-bucket93/' + tempCookie + '.jpeg'
		};

		LobbyUsers.create(info).then((user) => {
			for(var i=0; i<randomUsers.length; i++) {
				Matchings.create({
					host: user.get('cookie'),
					guest: randomUsers[i].get('cookie')
				})
			}
		});





		console.log('add User complete');
	});
}

function deleteUser(cookie) {
	LobbyUsers.destroy({
		where: {
			cookie: cookie
		}
	}).then((result) => {
		console.log(result);
	});
}

function deleteCallUser(cookie) {
	CallUsers.destroy({
		where: {
			cookie: cookie
		}
	}).then((result) => {
		console.log(result);
	});
}

function getRandomCookie() {
	var tempCookie;
	var sw = true;

	do {
		tempCookie = randomString({length: 10});

		LobbyUsers.findOne({where: {cookie: tempCookie}}).then((user) => {
			sw = false;
		});
	}
	while(sw == false);

	return tempCookie;
}

function getGuests(cookie) {
	return new Promise(function (resolve, reject) {
		Matchings.findAll({
			attributes: ['guest'],
			where: {
				host: cookie
			}
		}).then(guests => {
			if (guests.length < 9) {
				fillNullGuest(cookie, guests).then(() => {
					resolve(guests);
				})
			}
			resolve(guests);
		});
	});
}

function fillNullGuest(cookie, guests) {
	return new Promise(function (resolve, reject) {
		var exceptCookies = {
			where: {
				$and: [{cookie: {$ne: cookie}}]
			},
			limit: (9 - guests.length),
			order: [Sequelize.fn('RANDOM')]
		};

		for (let guest of guests) {
			exceptCookies.where['$and'].push({cookie: {$ne: guest.get("guest")}});
		}

		LobbyUsers.findAll(exceptCookies).then(newGuests => {
			if (newGuests != 0) {
				for (let newGuest of newGuests) {
					Matchings.create({
						host: cookie,
						guest: newGuest.get("cookie")
					});
				}
			}
		});
		resolve();
	});
}

function recvMessage(webSocket, recvMsg){

	return new Promise(function (resolve, reject) {
		var json = JSON.parse(recvMsg);

		console.log(json);

		switch(json.type) {
			case "screenshot":
			getGuests(webSocket.cookie).then((guests) => {
				var data = JSON.stringify({
					"type": 'urls',
					"data": {
						"guests": guests
					}
				});
				console.log(data);
				webSocket.send(data);
			});
			break;
			case "request":
			case "response":
			case "offer":
			case "answer":
			case "candidate":
			getWebSocket(json.data.destination).then(webSocket => {
				console.log(json.data.source);
				signalingMessage(recvMsg, webSocket);
			});
			break;
			case "hangup":
			deleteCallUser(json.data.callSource);
			deleteCallUser(json.data.callDestination);
			break;
		}
		resolve();
	});
}

function getWebSocket(cookie) {
	return new Promise(function (resolve, reject) {
		wss.clients.forEach(function (item) {
			if(item.cookie == cookie){
				resolve(item);
			}
		});
	});
}

function signalingMessage(message, destination) {
	return new Promise(function (resolve, reject) {
		destination.send(message);
		resolve();
	});
}
