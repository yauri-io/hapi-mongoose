# HapiJS Plugin Mongoose 

[![Circle CI](https://img.shields.io/circleci/project/asilluron/hapi-mongoose/master.svg?style=flat-square)](https://circleci.com/gh/asilluron/hapi-mongoose/tree/master)

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

const mongooseOpts = {
    connString: 'mongodb://localhost:27017/test',
    options: {} // the default is using example in http://mongoosejs.com/docs/connections.html#options
};

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

    const {userId} = request.params;
    const {hmongoose} = request.server; // mongoose exposed in server object as hmongoose
    const userModel = getUserModel(hmongoose);
    
    try {

        const result = await userModel.findOne({  _id: new ObjectID(userId) });
        return result;
    }
    catch (err) {

        request.server.log(['error'], err);
        return Boom.internal();
    }
} ;

const startServer = async () => {
    
    const server = new Hapi.Server();

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

## Options

* `connString` - A [MongoDB connection string](https://docs.mongodb.org/v4.0/reference/connection-string/).
* `options` - A JavaScript object with [Mongoose connection options](http://mongoosejs.com/docs/connections.html#options).
