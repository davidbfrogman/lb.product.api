import { Database } from '../config/database/database';
import { App, server } from '../server-entry';
import { Supplier, ISupplier, ITokenPayload } from '../models';
import { Config } from '../config/config';
import { CONST } from "../constants";
import { AuthUtil} from "./authentication.util.spec";
import { Cleanup } from "./cleanup.util.spec";
import { suite, test } from "mocha-typescript";
import { DatabaseBootstrap } from "../config/database/database-bootstrap";

import * as supertest from 'supertest';
import * as chai from 'chai';

const api = supertest.agent(App.server);
const mongoose = require("mongoose");
//mongoose.set('debug', true);
const expect = chai.expect;
const should = chai.should();

@suite('Bootstrap Suite -> ')
class BootstrapTest {

    // First we need to get some users to work with from the identity service
    public static before(done) {
        console.log('Testing bootstrap');
        // This code should only be called if this test is run as a single test.  When run in the suite along with
        // product this code is run by the product test.
        App.server.on('dbConnected', async () => {
            console.log('Got the dbConnected Signal, so now we can clear, and seed the database.' )
            await Cleanup.clearDatabase();
            console.log('About to seed the database');
            await DatabaseBootstrap.seed();

            console.log('About to create identity test data.');
            // This will create, 2 users, an organization, and add the users to the correct roles.
            await AuthUtil.createIdentityApiTestData();
            done();
        });
    }

    public static async after() {
        await Cleanup.clearDatabase();
    }

    @test('Just setting up a test for testing initialization')
    public async initialize() {
        expect(1).to.be.equal(1);
        return;
    }
}
