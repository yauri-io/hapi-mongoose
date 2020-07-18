# HapiJS Plugin Mongoose 

[![Build Status](https://travis-ci.org/yauri-io/hapi-mongoose.svg?branch=master)](https://travis-ci.org/yauri-io/hapi-mongoose)
[![Maintainability](https://api.codeclimate.com/v1/badges/118a5236e2142d8b965c/maintainability)](https://codeclimate.com/github/yauri-io/hapi-mongoose/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/118a5236e2142d8b965c/test_coverage)](https://codeclimate.com/github/yauri-io/hapi-mongoose/test_coverage)

This is a [HapiJS](https://hapi.dev) plugin to share Mongoose in HapiJS server object.

## Install

```
npm install --save @y-io/hapi-mongoose
```

## Example usage

```javascript
'use strict'

const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');

// this is just a simple example on how to create a model
// in real implementation, the model must be instantiate once only
const getUserModel = (hmongoose) => {
    
    // hmongoose object consists of two objects
    // lib is the original object of Mongooose
    // connection is the Mongoose established connection
    const {lib: mongooseLib, connection} = hmongoose;
    const Schema = mongooseLib.Schema;
    const objectId = mongooseLib.Schema.Types.ObjectId;
    
    const userSchema = new Schema({
        id: objectId,
        firstName: String,
        lastName: String
    });

    // use connection to create the model
    // REF: https://mongoosejs.com/docs/models.html
    return connection.model('users', userSchema);
    
};

const createUserHandler = async (request) => {

    const {firstName, lastName} = request.payload;
    const {hmongoose, log} = request.server; // mongoose exposed in server object as hmongoose
    const userModel = getUserModel(hmongoose);
    
    const newUser = new userModel({
        firstName,
        lastName
    });

    try {

        const result = await newUser.save();
        return result;
    }
    catch (err) {

        log(['error'], err);
        return Boom.internal();
    }
} ;

const startServer = async () => {
    
    const server = new Hapi.Server();

    const mongooseOpts = {
        connString: 'mongodb://localhost:27017/test',
        options: {} // the default is using example in http://mongoosejs.com/docs/connections.html#options
    };

    await server.register({
        plugin: require('@y-io/hapi-mongoose'),
        options: mongooseOpts
    });

    server.route( {
        method: 'POST',
        path: '/users',
        config: {
            validate: {
                payload: Joi.object().keys({
                    firstName: Joi.string().required(),
                    lastName: Joi.string().required()
                })
            },
            handler: createUserHandler        
        }
    });
    
    await server.start();
    server.log(['info'], `Server started at ${server.info.uri}`)
};


startServer()
    .catch((err) => { 
        console.error(err); 
        process.exit(1);
    });
```

## Test
Please install the peer dependencies manually to be able to run test.

## Note
About warning
```
(node:21295) DeprecationWarning: current Server Discovery and Monitoring engine is deprecated, and will be removed in a future version. To use the new Server Discover and Monitoring engine, pass option { useUnifiedTopology: true } to the MongoClient constructor.
```
To disable the warning, please pass option {useUnifiedTopology: true} but it would create issue when the connection string is invalid / MongoDB server is unreachable. There will be no error thrown until timeout.


## Options

* `connString` - A [MongoDB connection string](https://docs.mongodb.org/v4.0/reference/connection-string/).
* `options` - A JavaScript object with [Mongoose connection options](https://mongoosejs.com/docs/connections.html#options).
