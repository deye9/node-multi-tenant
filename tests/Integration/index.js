'use strict';

const chai = require('chai'),
    chaiHttp = require('chai-http'),
    server = require('../../lib/server'),
    aspromised = require('chai-as-promised'),
    HttpStatus = require('http-status-codes');

chai.should();
chai.use(chaiHttp);

/*
 * Test the /POST route
 */
describe('/POST api/users', () => {
    let user = {};

    beforeEach((done) => {
        user = {
            firstName: 'John',
            lastName: 'Doe'
        };
        done();
    });

    it.skip('should not create a user when email is not supplied.', (done) => {
        chai.request(server.unifiedServer)
            .post('/api/users')
            .send(user)
            .end((err, res) => {
                if (err) { console.error(err) }
                res.body.should.be.a('object');
                res.should.have.status(HttpStatus.INTERNAL_SERVER_ERROR);
                done();
            });
    });

    it.skip('should create a user.', (done) => {
        user.email = 'demo@demo.com';
        chai.request(server.unifiedServer)
            .post('/api/users')
            .send(user)
            .end((err, res) => {
                res.body.should.be.a('object');
                res.should.have.status(HttpStatus.CREATED);
                done();
            });
    });
});