'use strict';

const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');

const { describe, it, beforeEach, expect } = exports.lab = Lab.script();

describe('Hapi server', () => {

    const connString = 'mongodb://localhost:27017/test';
    let server;

    beforeEach(() => {

        server = Hapi.Server();
    });

    it('should reject options without connection string', async () => {

        try {
            await server.register({
                plugin: require('../')
            });
        }
        catch (err) {
            expect(err).to.exist();
        }
    });

    it('should reject invalid mongodb connection', async () => {

        try {
            await server.register({
                plugin: require('../'),
                options: {
                    connString: 'mongodb://localhost:37017/test'
                }
            });
        }
        catch (err) {
            expect(err).to.exist();
        }
    });

    it('should reject invalid connString', async () => {

        try {
            await server.register({
                plugin: require('../'),
                options: {
                    connString: null,
                    options: {}
                }
            });
        }
        catch (err) {
            expect(err).to.exist();
        }
    });

    it('should reject invalid options', async () => {

        try {
            await server.register({
                plugin: require('../'),
                options: {
                    connString: null,
                    options: {
                        invalidOptions: 'invalid'
                    }
                }
            });
        }
        catch (err) {
            expect(err).to.exist();
        }
    });

    it('should accept valid connection string', async () => {

        server.events.once('log', (entry) => {

            expect(Object.keys(entry)).to.equal(['timestamp', 'tags', 'data', 'channel']);
            expect(entry.tags).to.equal(['hmongoose', 'info']);
        });

        await server.register({
            plugin: require('../'),
            options: { connString }
        });

    });

    it('should accept valid connection string and options', async () => {

        server.events.once('log', (entry) => {

            expect(Object.keys(entry)).to.equal(['timestamp', 'tags', 'data', 'channel']);
            expect(entry.tags).to.equal(['hmongoose', 'info']);
        });

        await server.register({
            plugin: require('../'),
            options: {
                connString,
                options: {
                    autoIndex: true,
                    connectTimeoutMS: 10000, // in milliseconds
                    socketTimeoutMS: 45000 // in milliseconds
                }
            }
        });

    });

    it('should return hmongoose object inside server object', async () => {


        await server.register({
            plugin: require('../'),
            options: {
                connString
            }
        });

        const { hmongoose } = server;

        expect(hmongoose).to.be.exist();
        expect(typeof hmongoose).to.be.equal('object');

    });

    it('should has lib and connection prop in server.hmongoose object', async () => {

        await server.register({
            plugin: require('../'),
            options: {
                connString
            }
        });

        const { hmongoose } = server;


        expect(hmongoose.lib).to.be.exist();
        expect(typeof hmongoose.lib).to.be.equal('object');

        expect(hmongoose.connection).to.be.exist();
        expect(typeof hmongoose.connection).to.be.equal('object');

    });

    it('should disconnect when server stop', async () => {

        await server.register({
            plugin: require('../'),
            options: {
                connString
            }
        });

        await server.initialize();

        server.events.on('log', (entry) => {

            if (entry.data === 'disconnecting') {
                expect(entry.tags).to.equal(['hmongoose', 'info']);
                expect(entry.data).to.equal('disconnecting');
            }

            if (entry.data === 'disconnected') {
                expect(entry.tags).to.equal(['hmongoose', 'warn']);
                expect(entry.data).to.equal('disconnected');
            }
        });
        await server.stop();

        await Hoek.wait(300);

    });


});
