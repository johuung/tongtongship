var express = require('express');
var app = express();
var path = require("path");
var randomString = require('random-string');
var cookie = require('cookie');

var models = require('./models');
var UserImages = models.UserImage;

const Sequelize = require('sequelize');
const sequelize = new Sequelize('tongtongship', 'tongtongship', '20tongs!', {
    host: 'tongtongdb.cek80gowrna6.ap-northeast-2.rds.amazonaws.com',
    dialect: 'postgres',
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
    
    console.log(wss.clients);
    
    ws.on('message', function incoming(message) {
	recvMessage(ws, message);
    });
    ws.on('close', function close() {
	console.log('disconnected');
	deleteUser(ws.cookie);
	refreshGuests();
    });
});

function getRandomUsers(tempCookie) {
    
    return new Promise(function (resolve, reject) {
	UserImages.findAll({where: {cookie: {[Op.ne]: tempCookie}}, limit: 9, order: [[Sequelize.fn('RANDOM')]]})
	    .then(user => {
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
	
	for(var i=0; i<randomUsers.length; i++) {
	    info["guest" + String(i+1)] =  randomUsers[i].get('cookie');
	    
	}
	UserImages.create(info).then(() => {
	    refreshGuests();
	});
	console.log('add User complete');
    });
}

function deleteUser(cookie) {
    UserImages.destroy({where: {cookie: cookie}}).then(function(result) {
	console.log(result);
    });
}

function getRandomCookie() {
    var tempCookie;
    var sw = true;
    
    do {
	tempCookie = randomString({length: 10});
	
	UserImages.findOne({where: {cookie: tempCookie}})
	    .then((user) => {
		sw = false;
	    });
    }
    while(sw == false);
    
    return tempCookie;
}

function getGuests(cookie) {
    return new Promise(function (resolve, reject) {
	UserImages.findOne({attributes: ['guest1', 'guest2', 'guest3', 'guest4', 'guest5', 'guest6', 'guest7', 'guest8', 'guest9'], where: { cookie: cookie }, raw: true}).then(person => {
	    resolve(person);
	});
    });
}

function getUsersHavingNullGuests() {
    return new Promise(function (resolve, reject) {
	UserImages.findAll({where: {[Op.or]: [{guest1: {[Op.eq]: null}},
					      {guest2: {[Op.eq]: null}},
					      {guest3: {[Op.eq]: null}},
					      {guest4: {[Op.eq]: null}},
					      {guest5: {[Op.eq]: null}},
					      {guest6: {[Op.eq]: null}},
					      {guest7: {[Op.eq]: null}},
					      {guest8: {[Op.eq]: null}},
					      {guest9: {[Op.eq]: null}}]}})
	    .then(users => {
		resolve(users);
	    });
    });
}

function fillNullGuest(user) {
    return new Promise(function (resolve, reject) {
	var exceptCookies = {where: {$and: [{cookie: {$ne: user.cookie}}]}, limit: 1, order: [Sequelize.fn('RANDOM')]};
	for (let i = 0; i < 9; i++) {
	    tempCookie = user['guest' + i.toString()];
	    if (tempCookie != null) {
		exceptCookies.where['$and'].push({cookie: {$ne: tempCookie}});
	    }
	}
	UserImages.findAll(exceptCookies).then(guest => {
	    if (guest != 0) {
		for (let i = 0; i < 9; i++) {
		    tempField = 'guest' + (i+1).toString();
		    if (user.get(tempField) == null) {
			user.update({[tempField]: guest[0].get('cookie')});
			break;
		    }
		}
	    }
	    resolve();
	});
    });
    
}

function refreshGuests() {
    
    getUsersHavingNullGuests().then(users => {
	for (let i = 0; i < users.length; i++) {   
	    fillNullGuest(users[i]);
	}
    });
}

function recvMessage(webSocket, recvMsg){
  return new Promise(function (resolve, reject) {
	  var json = JSON.parse(recvMsg);

    switch(json.type) {
    	case "screenshot":
        /*
        	var buf = new Buffer(json.image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        	var params = { Bucket: myBucket, Key: clientCookie + '.jpeg', ContentEncoding: 'base64', ContentType: 'image/jpeg', Body: buf };
        	s3.upload(params, function(err, data){
                            if (err) {
                            console.log('error in callback');
                            console.log(err);
                            }
                            console.log('success');
                            console.log(data);
        	});
        */
        	getGuests(webSocket.cookie).then(function (guests) {
	            var data = JSON.stringify({'type' : 'urls', 'guests': guests});
	            console.log(data);
	            webSocket.send(data);
        	});
			break;
		case "request", "response", "offer", "answer", "candidate":
            getWebSocket(json.data.destination).then(cookie => {
				signalingMessage(recvMsg, cookie).then(() => {
		    		break;
				});
	    	});	
		}
		resolve();
    });
}

function getWebSocket(cookie) {
    return new Promise(function (resolve, reject) {
	wss.clients.forEach(function (item) {
	    if(item.cookie == cookie){
		return item;
	    }
	});
	resolve();
    });
}

function signalingMessage(message, destination) {
    return new Promise(function (resolve, reject) {
	destination.send(message);
	resolve();
    });
}
