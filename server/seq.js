var randomString = require('random-string');
var randomCookie = null;

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

const User = sequelize.define('user', {
  cookie: {
    type: Sequelize.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  url: {
    type: Sequelize.STRING,
    allowNull: true
  }
});

User.sync({force: true}).then(() => {
	console.log('table created');

	for(var i=0; i<20; i++) { makeUser(); } //make test users

	//deleteUserByCookie('3JxkOrknGc');
	makeUser();
});

function makeUser() {
	var sw = false;

	do {
		var tempCookie = getRandomCookie();
		User.findOrCreate({where: {cookie: tempCookie}, defaults: {cookie: tempCookie}})
			.spread((user, created) => {
			    if(created) {
			    	sw = true;
			    }
			    else {
			    	sw = true;
			    }
			})
	}
	while(sw == true);
}

function deleteUserByCookie(tempCookie) {
	User.destroy({where: {cookie: tempCookie}})
		.then(result => {
		  console.log('delete : ' + tempCookie);
		});
}

function getRandomCookie() {
	return randomString({length: 10});
}