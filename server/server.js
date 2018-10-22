const express = require('express');
const app = express();
const path = require("path");
const randomString = require('random-string');
const cookie = require('cookie');
const fs = require('fs');

const WebSocket = require('ws');
const http = require('http');
// Certificate

/*
const privateKey = fs.readFileSync('/etc/letsencrypt/live/tongtongship.tk/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/tongtongship.tk/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/tongtongship.tk/fullchain.pem', 'utf8');
const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};
*/

const models = require('../db/models');
const LobbyUsers = models.LobbyUser;
const CallUsers = models.CallUser;
const Matchings = models.Matching;

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
	addLobbyUser(tempCookie);
	console.log('set cookie : ' + tempCookie);
});

app.get('/userImages/:cookie', function(req, res) {
	var cookie = req.params.cookie;

	res.sendFile(path.join(__dirname+'/../../userImages/'+cookie+'.jpeg'));
});

const httpServer = new http.createServer(app).listen(80);
//const httpsServer = new https.createServer(credentials, app).listen(443);
const wss = new WebSocket.Server({ server: httpServer, clientTracking: true });
//const wss = new WebSocket.Server({ server: httpsServer, clientTracking: true });

wss.on('connection', function connection(ws, req) {
	reqCookies = cookie.parse(req.headers.cookie);
	ws.cookie = reqCookies['cookie'];

	ws.on('message', (data) => {
		handleMessageEvent(ws, data);
	});
	ws.on('close', function close() {
		console.log('disconnected');
		deleteLobbyUser(ws.cookie);
		deleteCallUser(ws.cookie);
	});
});

function getRandomLobbyUsers(cookie) {
	return new Promise(function (resolve, reject) {
		LobbyUsers.findAll({
			where: {
				cookie: {
					[Op.ne]: cookie
				}
			},
			limit: 9,
			order: sequelize.random()
		}).then(user => {
			resolve(user);
		});
	});
}

function addLobbyUser(cookie) {
	getRandomLobbyUsers(cookie).then((randomUsers) => {
		var info = {
			cookie: cookie,
			url: 'https://s3.ap-northeast-2.amazonaws.com/jehyunlims-bucket93/' + cookie + '.jpeg'
		};

		LobbyUsers.create(info).then((user) => {
			for (let randomUser of randomUsers) {
				Matchings.create({
					host: user.get('cookie'),
					guest: randomUser.get('cookie')
				})
			}
		});

	});
}

function addCallUser(cookie) {

	CallUsers.create({
		cookie: cookie
	});

}

function deleteCallUser(cookie) {

	CallUsers.destroy({
		where: {
			cookie: cookie
		}
	});

}

function deleteLobbyUser(cookie) {
	LobbyUsers.destroy({
		where: {
			cookie: cookie
		}
	});
}

function getRandomCookie() {
	var tempCookie;
	var sw = true;

	do {
		tempCookie = randomString({length: 10});

		LobbyUsers.findOne({where: {cookie: tempCookie}}).then((user) => {
			CallUsers.findOne({where: {cookie: tempCookie}}).then((user) => {
				sw = false;
			});
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
				fillNullGuest(cookie, guests);
			}
			guestList = [];
			for (guest of guests) {
				guestList.push(guest.guest);
			}
			resolve(guestList);
		});
	});
}

function fillNullGuest(cookie, guests) {
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
}

function handleMessageEvent(webSocket, data){
	var message = JSON.parse(data);

	switch(message.type) {
		case "screenshot":
		handleScreenshotMessage(webSocket, message);
		break;
		case "request":
		handleRequestMessage(message);
		break;
		case "response":
		handleResponseMessage(message);
		break;
		case "offer":
		case "answer":
		case "candidate":
		getWebSocket(message.data.destination).then(webSocket => {
			signalingMessage(message, webSocket);
		});
		break;
		case "complete_caller":
		handleCompleteCallerMessage(message);
		break;
		case "complete_callee":
		handleCompleteCalleeMessage(message);
	}
}

function handleScreenshotMessage(webSocket, message) {
	var image = message.data.image;
	var data = image.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	fs.writeFileSync(path.join(__dirname+'/../../userImages/'+webSocket.cookie+'.jpeg'), buf);

	LobbyUsers.findOne({
		where: {
			cookie: webSocket.cookie
		}
	}).then((user) => {
		if (user.get("state") == "idle") {
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
		}
	});
}

/* From Host to Guest */
function handleRequestMessage(message) {
	/* Update Host's state to "busy" */
	updateLobbyUserState(message.data.source, "busy").then(() => {
		/* Check Guest's state */
		LobbyUsers.findOne({
			attributes: ['state'],
			where: {
				cookie: message.data.destination
			}
		}).then(user => {
			/* Guest is "idle" */
			if (user.get('state') == "idle") {
				/* Update Guest's state to "busy" */
				updateLobbyUserState(message.data.destination, "busy").then(() => {
					/* Signal to Guest */
					getWebSocket(message.data.destination).then(webSocket => {
						signalingMessage(message, webSocket);
					});
				});
			}
			/* Guest is "busy" */
			else {
				/* Update Host's state to "idle" */
				updateLobbyUserState(message.data.source, "idle");
				var data = JSON.stringify({
					"type": "response",
					"data": {
						"accept": false,
						"reason": "Guest is busy"
					}
				});
				getWebSocket(message.data.source).then(webSocket => {
					webSocket.send(data);
				});
			}
		});
	});

}

/* From Guest to Host */
function handleResponseMessage(message) {

	/* Guest sent NAK */
	if (message.data.accept == false) {
		/* Update Host's state to "idle" */
		updateLobbyUserState(message.data.source, "idle");
		updateLobbyUserState(message.data.destination, "idle");
	}

	/* Signal to Guest */
	getWebSocket(message.data.destination).then(webSocket => {
		signalingMessage(message, webSocket);
	});

}

function handleCompleteCallerMessage(message) {

	/* Insert User to CallUsers table */
	addCallUser(message.data.source);

	/* Delete User From LobbyUsers table (Cascade in Matchings table) */
	deleteLobbyUser(message.data.source);

	/* Signal to Callee */
	getWebSocket(message.data.destination).then(webSocket => {
		signalingMessage(message, webSocket);
	});

}

function handleCompleteCalleeMessage(message) {

	/* Insert User to CallUsers table */
	addCallUser(message.data.source);

	/* Delete User From LobbyUsers table (Cascade in Matchings table) */
	deleteLobbyUser(message.data.source);

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
	destination.send(JSON.stringify(message));
}

function updateLobbyUserState(cookie, state) {
	return new Promise(function (resolve, reject) {
		LobbyUsers.findOne({
			where: {
				cookie: cookie
			}
		}).then(user => {
			user.update({
				state: state
			}).then(() => {
				resolve();
			})
		})
	});
}
