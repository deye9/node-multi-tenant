'use strict';

const chai = require('chai');
chai.should();

describe.skip("User Model", () => {

    let user = {};
    let sequelizeRepo = null;

    beforeEach('setup Globals', (done) => {
        user = {
            firstName: 'John',
            lastName: 'Doe'
        };
        sequelizeRepo = new PostgreRepository(db.sequelize, 'Users');
        done();
    });

    it('should not create user when email is missing', async () => {
        const result = await sequelizeRepo.add(user);
        
        result.should.be.a('object').not.empty;
        result.should.have.property('Error Title');
        result.should.have.property('Error Message');
        result.should.have.property('Error Category');
    });

    it('should not create user when payload is missing', async () => {
        const result = await sequelizeRepo.add();

        result.should.be.a('object').not.empty;
        result.should.have.property('Error Title');
        result.should.have.property('Error Message');
        result.should.have.property('Error Category');
    });

    it('should save the user and create an id when created', async () => {
        user.email = 'demo@demo.com';
        const result = await sequelizeRepo.add(user);

        result.should.have.a.property('id');
        result.should.be.a('object').not.empty;
        result.should.have.property('email').equal(user.email);
        result.should.have.property('firstName').equal(user.firstName);
    });

});
