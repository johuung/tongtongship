var express = require('express');
var app = express();
var path = require("path");
var randomString = require('random-string');

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
    res.append('Set-Cookie', 'cookie='+tempCookie);
    res.sendFile(path.join(__dirname+'/../client/client.html'));
    addUser(tempCookie);
    console.log('set cookie : ' + tempCookie);
});

const WebSocket = require('ws');
const http = require('http');
//const wss = new WebSocket.Server({ port: 8080 });
const server = new http.createServer(app).listen(8080);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
    var cookie;
    ws.on('message', function incoming(message) {
	recvMessage(ws, cookie, message);
    });
    ws.on('close', function close() {
	console.log('disconnected');
	deleteUser(cookie);
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
    console.log(info);
  UserImages.create(info);
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

function recvMessage(webSocket, clientCookie, recvMsg){
        var json = JSON.parse(recvMsg);
        console.log('received cookie: %s', json.cookie);

        if(json.type=="screenshot"){
                clientCookie = json.cookie;

/*              var buf = new Buffer(json.image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
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
                getGuests(clientCookie).then(function (guests) {
                    var data = JSON.stringify({'type' : 'urls', 'guests': guests});
                    console.log(data);
                    webSocket.send(data);
                });
        }
        else if(json.type=="button"){
                var data = JSON.stringify({'type' : 'echo', 'string' : 'This is Echo' });
                webSocket.send(data);
        }
}

