import { Database } from '../../config/database/database';
import { App, server } from '../../server-entry';
import { Supplier, ISupplier, ITokenPayload } from '../../models';
import { Config } from '../../config/config';
import { CONST } from "../../constants";
import { AuthUtil } from "../authentication.util.spec";
import { Cleanup } from "../cleanup.util.spec";
import { suite, test } from "mocha-typescript";
import { DatabaseBootstrap } from "../../config/database/database-bootstrap";

import * as supertest from 'supertest';
import * as chai from 'chai';
import { IdentityApiService } from '../../services/index';

const api = supertest.agent(App.server);
const mongoose = require("mongoose");
const expect = chai.expect;
const should = chai.should();

@suite('Supplier Model -> ')
class SupplierTest {

    // First we need to get some users to work with from the identity service
    public static before(done) {
        console.log('Testing suppliers');
        // This code should only be called if this test is run as a single test.  When run in the suite along with
        // bootstrap.util.spec this code is run by the bootstrap spec.
        // App.server.on('dbConnected', async () => {
        //     await Cleanup.clearDatabase();
        //     await DatabaseBootstrap.seed();

        //     // This will create, 2 users, an organization, and add the users to the correct roles.
        //     await AuthUtil.createIdentityApiTestData();
        //     done();
        // });
        // //This done should be commented if you're going to run this as suite.only()
        done();
    }

    public static async after() {
        await Cleanup.clearDatabase();
    }

    @test('Just setting up a test for testing initialization')
    public async initialize() {
        expect(1).to.be.equal(1);
        return;
    }

    @test('Create a supplier')
    public async CreateASupplier() {
        let supplier: ISupplier = {
            isActive: true,
            isApproved: false,
            name: 'JRose Magic Flowers 2134123',
            slug: 'jroseas3d2f',
        }

        let response = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.SUPPLIERS}`)
            .set(CONST.TOKEN_HEADER_KEY, AuthUtil.systemAuthToken)
            .send(supplier);

        expect(response.status).to.equal(201);
        expect(response.body).to.be.an('object');
        expect(response.body.name).to.be.equal(supplier.name);
        expect(response.body.isActive).to.be.equal(true);
        expect(response.body.isApproved).to.be.equal(false);
        return;
    }

    @test('Register the supplier')
    public async RegisterSupplier() {
        // Create a new user user like this was the signup workflow.
        let userId = await AuthUtil.registerUser(CONST.testing.UPGRADE_USER_EMAIL);

        let userToken = await new IdentityApiService(CONST.ep.USERS).authenticateUser(CONST.testing.UPGRADE_USER_EMAIL, "test354435");

        let supplier: ISupplier = {
            isActive: true,
            isApproved: false,
            name: 'integration test upgrade supplier',
            slug: 'jrose1asd32',
        }

        let response = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.SUPPLIERS}${CONST.ep.REGISTER}`)
            .set(CONST.TOKEN_HEADER_KEY,userToken)
            .send(supplier);
        
        expect(response.status).to.equal(201);
        expect(response.body).to.be.an('object');
        expect(response.body.name).to.be.equal(supplier.name);
        expect(response.body.isActive).to.be.equal(true);
        expect(response.body.isApproved).to.be.equal(false);

        let registeredSupplier = response.body as ISupplier;

        // Now after we've registerd the supplier, we need to re auth the user, because their organization changed from guest to this 
        // new supplier.
        userToken = await new IdentityApiService(CONST.ep.USERS).authenticateUser(CONST.testing.UPGRADE_USER_EMAIL, "test354435");

        console.log('Token from registered supplier, should have role supplier editor', userToken)

        // Let's check to make sure that this user has the rights to change some detail about this supplier
        registeredSupplier.pickupName = 'This is a test';
        let updateResponse = await api
        .patch(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.SUPPLIERS}/${response.body._id}`)
        .set(CONST.TOKEN_HEADER_KEY,userToken)
        .send(registeredSupplier);

        expect(updateResponse.status).to.equal(202);
        expect(updateResponse.body).to.be.an('object');
        expect(updateResponse.body.name).to.be.equal(supplier.name);
        expect(updateResponse.body.pickupName).to.be.equal(registeredSupplier.pickupName);
        
        let updatedSupplier: ISupplier = updateResponse.body as ISupplier;

        // Now we cleanup the identity api, which will have an organization created in development for this supplier.
        // the organization id sits on the supplier we got back. 
        let deletedOrgResponse = await new IdentityApiService(CONST.ep.ORGANIZATIONS).delete(updatedSupplier.ownerships[0].ownerId);
        deletedOrgResponse.should.be.an('object');
        deletedOrgResponse.should.have.property('ItemRemoved');
        deletedOrgResponse.should.have.property('ItemRemovedId');
        expect(deletedOrgResponse.ItemRemovedId).to.be.equal(updatedSupplier.ownerships[0].ownerId);

        return;
    }

    @test('Supplier Admins should be able to create a supplier')
    public async CreateASupplierByAdmin() {
        let supplier: ISupplier = {
            isActive: true,
            isApproved: false,
            name: 'JRose Magic Flowers 1234',
            slug: 'asdf35v1a'
        }

        let response = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.SUPPLIERS}`)
            .set(CONST.TOKEN_HEADER_KEY, AuthUtil.supplierAdminToken)
            .send(supplier);

        expect(response.status).to.equal(201);
        expect(response.body).to.be.an('object');
        expect(response.body.name).to.be.equal(supplier.name);
        expect(response.body.isActive).to.be.equal(true);
        expect(response.body.isApproved).to.be.equal(false);
        return;
    }

    @test('Shouldnt be able to create a supplier by the same name')
    public async CreateBySupplierFailsWithValidationErrors() {
        let supplier: ISupplier = {
            isActive: true,
            isApproved: false,
            name: 'JRose Magic Flowers qwer',
            slug: 'asdf35v1a5674567'
        }

        let response = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.SUPPLIERS}`)
            .set(CONST.TOKEN_HEADER_KEY, AuthUtil.supplierAdminToken)
            .send(supplier);
    
        let response2 = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.SUPPLIERS}`)
            .set(CONST.TOKEN_HEADER_KEY, AuthUtil.supplierAdminToken)
            .send(supplier);

        // Slug and Name should both fail validation.
        expect(response2.status).to.equal(412);
        expect(response2.body).to.be.an('object');
        expect(response2.body.validationErrors.length).to.be.equal(2);
        return;
    }
}
