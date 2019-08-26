/**
 * HapiJS Mongoose plugin
 * Ref: https://mongoosejs.com/docs/index.html
 */

'use strict';

const Joi = require('@hapi/joi');
const Hoek = require('@hapi/hoek');
const Mongoose = require('mongoose');

// use Bluebird as default Promise lib
Mongoose.Promise = require('bluebird');

const connOptionsSchema = Joi.object().keys({
    connString: Joi.string().required(),
    options: Joi.object().keys({
        useNewUrlParser: Joi.boolean().optional(),
        useCreateIndex: Joi.boolean().optional(),
        useFindAndModify: Joi.boolean().optional(),
        autoIndex: Joi.boolean().optional(),
        reconnectTries: Joi.number().min(0).optional(),
        reconnectInterval: Joi.number().min(0).optional(),
        poolSize: Joi.number().min(0).optional(),
        bufferMaxEntries: Joi.number().min(0).optional(),
        connectTimeoutMS: Joi.number().min(0).optional(),
        socketTimeoutMS: Joi.number().min(0).optional()
    }).optional().default({})
});

const defaultOptions = {
    connString: '',
    options: {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        autoIndex: false,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 500, // in milliseconds
        poolSize: 10,
        bufferMaxEntries: 0,
        connectTimeoutMS: 10000, // in milliseconds
        socketTimeoutMS: 45000 // in milliseconds
    }
};

const pluginName = 'hmongoose';

// Ref: https://mongoosejs.com/docs/connections.html
const eventTypes = [
    { name: 'connecting', alias: `${pluginName}:connecting`, type: 'info' },
    { name: 'connected', alias: `${pluginName}:connected`, type: 'info' }, // this event won't occurs because we use await on creating connection
    { name: 'disconnecting', alias: `${pluginName}:disconnecting`, type: 'info' },
    { name: 'error', alias: `${pluginName}:error`, type: 'error' },
    { name: 'disconnected', alias: `${pluginName}:disconnected`, type: 'warn' },
    { name: 'reconnected', alias: `${pluginName}:reconnected`, type: 'warn' },
    { name: 'fullsetup', alias: `${pluginName}:fullsetup`, type: 'info' },
    { name: 'all', alias: `${pluginName}:all`, type: 'info' },
    { name: 'reconnectFailed', alias: `${pluginName}:reconnectFailed`, type: 'warn' },
    { name: 'reconnectTries', alias: `${pluginName}:reconnectTries`, type: 'warn' }
];

const setupEventListener = (server, connection) => {

    eventTypes.forEach((event) => {

        connection.on(event.name, (args) => {

            const data = event.type !== 'error' ? event.name : args;
            server.log([pluginName, event.type], data);
        });
    });
};

let connection = null;

exports.plugin = {
    name: 'hmongoose',
    version: '1.0',
    register: async (server, options) => {

        const validation = connOptionsSchema.validate(options);
        if (validation.error) {
            throw Error(validation.error.details[0].message);
        }

        const { connString, options: connOptions } = Hoek.applyToDefaults(defaultOptions, options);
        connection = await Mongoose.createConnection(connString, connOptions);
        server.log([pluginName, 'info'], `Mongoose connected to ${connString}`);

        setupEventListener(server, connection);

        // expose the mongoose connection
        server.decorate('server', 'hmongoose', { connection, lib: Mongoose });
        server.decorate('request', 'hmongoose', { connection, lib: Mongoose });

        server.events.on('stop', () => {

            connection.close();
        });
    }
};

