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

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });


var myBucket = 'jehyunlims-bucket93';

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
    res.append('Set-Cookie', tempCookie);
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
    ws.on('message', function incoming(message) {
	json = JSON.parse(message);
	console.log('received cookie: %s', json.cookie);
	var recvCookie = json.cookie;
	var b64string = json.image;
	var data = b64string.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	/*
	var params = { Bucket: myBucket, Key: recvCookie + '.jpeg', ContentEncoding: 'base64', ContentType: 'image/jpeg', Body: buf };
	s3.upload(params, function(err, data){
        if (err) {
          console.log('error in callback');
          console.log(err);
        }
        console.log('success');
        console.log(data);
	});
	*/
   	ws.send('https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png');
    }); 
});

function addUser(tempCookie) {
  UserImages.create({cookie: tempCookie, url: 'https://s3.ap-northeast-2.amazonaws.com/jehyunlims-bucket93/' + tempCookie + '.jpeg'});
  console.log('add User complete');
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
