'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
	return queryInterface.createTable('UserImages', {
	    cookie: {
		allowNull: false,
		primaryKey: true,
		type: Sequelize.STRING
	    },
	    url: {
		type: Sequelize.STRING
	    },
	    guest1: {
		type: Sequelize.STRING,
		defaultValue: null,
		references: {model: 'UserImages', key: 'cookie'},
		onUpdate: 'set null',
		onDelete: 'set null'
	    },
	    guest2: {
		type: Sequelize.STRING,
		defaultValue: null,
		references: {model: 'UserImages', key: 'cookie'},
		onUpdate: 'set null',
		onDelete: 'set null'
	    },
	    guest3: {
		type: Sequelize.STRING,
		defaultValue: null,
		references: {model: 'UserImages', key: 'cookie'},
		onUpdate: 'set null',
		onDelete: 'set null'
	    },
	    guest4: {
		type: Sequelize.STRING,
		defaultValue: null,
		references: {model: 'UserImages', key: 'cookie'},
		onUpdate: 'set null',
		onDelete: 'set null'
	    },
	    guest5: {
		type: Sequelize.STRING,
		defaultValue: null,
		references: {model: 'UserImages', key: 'cookie'},
		onUpdate: 'set null',
		onDelete: 'set null'
	    },
	    guest6: {
		type: Sequelize.STRING,
		defaultValue: null,
		references: {model: 'UserImages', key: 'cookie'},
		onUpdate: 'set null',
		onDelete: 'set null'
	    },
	    guest7: {
		type: Sequelize.STRING,
		defaultValue: null,
		references: {model: 'UserImages', key: 'cookie'},
		onUpdate: 'set null',
		onDelete: 'set null'
	    },
	    guest8: {
		type: Sequelize.STRING,
		defaultValue: null,
		references: {model: 'UserImages', key: 'cookie'},
		onUpdate: 'set null',
		onDelete: 'set null'
	    },
	    guest9: {
		type: Sequelize.STRING,
		defaultValue: null,
		references: {model: 'UserImages', key: 'cookie'},
		onUpdate: 'set null',
		onDelete: 'set null'
	    },
	    createdAt: {
		allowNull: false,
		type: Sequelize.DATE
	    },
	    updatedAt: {
		allowNull: false,
		type: Sequelize.DATE
	    }
	});
    },
    down: (queryInterface, Sequelize) => {
	return queryInterface.dropTable('UserImages');
    }
};
