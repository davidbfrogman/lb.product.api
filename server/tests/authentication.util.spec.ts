import { Database } from '../config/database/database';
import { App, server } from '../server-entry';
import { Config } from '../config/config';
import { CONST } from "../constants";

import * as moment from 'moment';
import * as supertest from 'supertest';
import * as chai from 'chai';
import log = require('winston');
import { IdentityApiService } from "../services/identity.api.service";

const api = supertest.agent(App.server);
const identityApi = supertest(Config.active.get('identityApiEndpoint'));

const mongoose = require("mongoose");
const expect = chai.expect;
const should = chai.should();

// We need to rename this so it doesn't collide with the authentication utility in the controllers folder.
export class AuthUtil {

    static systemAuthToken: string;
    static productAdminToken: string;
    static productEditorToken: string;
    static supplierAdminToken: string;
    static supplierEditorToken: string;

    // We want to make sure we're cleaning up any test accounts that we create on the identity api.
    public static async cleanupIdentityApi() {
        try {
            // First with the system credentials we're going to clean up the identity api.
            // get a token for the system admin account.
            this.systemAuthToken = await IdentityApiService.getSysToken();

            // This will double check that we actually got a token back.
            expect(this.systemAuthToken).length.to.be.greaterThan(0);

            // Now we have the system credentials.  it's time to clear out anything that we might want to.
            // first up lets delete users that we might have created.
           await new IdentityApiService(CONST.ep.USERS).deleteSingle({
                "email": CONST.testing.PRODUCT_ADMIN_EMAIL
            });

           await new IdentityApiService(CONST.ep.USERS).deleteSingle({
                "email": CONST.testing.PRODUCT_EDITOR_EMAIL
            });

            await new IdentityApiService(CONST.ep.USERS).deleteSingle({
                "email": CONST.testing.SUPPLIER_EDITOR_EMAIL
            });

            await new IdentityApiService(CONST.ep.USERS).deleteSingle({
                "email": CONST.testing.SUPPLIER_ADMIN_EMAIL
            });

            await new IdentityApiService(CONST.ep.USERS).deleteSingle({
                "email": CONST.testing.UPGRADE_USER_EMAIL
            });

            // Now let's delete the organization we created for testing.
            await new IdentityApiService(CONST.ep.ORGANIZATIONS).deleteSingle({
                "name": CONST.testing.ORGANIZATION_NAME
            });
        }
        catch (err) {
            this.handleTestError(err);
        }

    }

    public static async createIdentityApiTestData(): Promise<any> {
        try {
            await this.cleanupIdentityApi();
            //We're going to create 2 users for each of the different roles.  We'll still link them to the same organization
            const productAdminId = await this.registerUser(CONST.testing.PRODUCT_ADMIN_EMAIL);
            const productEditorId = await this.registerUser(CONST.testing.PRODUCT_EDITOR_EMAIL);
            const supAdminId = await this.registerUser(CONST.testing.SUPPLIER_ADMIN_EMAIL);
            const supEditorId = await this.registerUser(CONST.testing.SUPPLIER_EDITOR_EMAIL);

            // Create the organization we'll use for testing
            let orgResponse = await new IdentityApiService(CONST.ep.ORGANIZATIONS).createRaw({
                "name": CONST.testing.ORGANIZATION_NAME,
                "isSystem": false,
                "type": 3,
                "users": [
                    productAdminId,
                    productEditorId,
                    supAdminId,
                    supEditorId
                ]
            });

            // So we're going to issue a patch request to update the roles array on our new users
            // find me 2 different roles.  I want one role that was the 'product:owner', and one that was 'product:editor'
            await this.addRolesToUser(CONST.PRODUCT_ADMIN_ROLE, productAdminId);
            await this.addRolesToUser(CONST.PRODUCT_EDITOR_ROLE, productEditorId);
            await this.addRolesToUser(CONST.SUPPLIER_ADMIN_ROLE, supAdminId);
            await this.addRolesToUser(CONST.SUPPLIER_EDITOR_ROLE, supEditorId);

            // Now we can use these tokens when we call back out to the product api during testing.
            this.productAdminToken = await new IdentityApiService(CONST.ep.USERS).authenticateUser(CONST.testing.PRODUCT_ADMIN_EMAIL, "test354435");
            this.productEditorToken = await new IdentityApiService(CONST.ep.USERS).authenticateUser(CONST.testing.PRODUCT_EDITOR_EMAIL, "test354435");
            this.supplierEditorToken = await new IdentityApiService(CONST.ep.USERS).authenticateUser(CONST.testing.SUPPLIER_EDITOR_EMAIL, "test354435");
            this.supplierAdminToken = await new IdentityApiService(CONST.ep.USERS).authenticateUser(CONST.testing.SUPPLIER_ADMIN_EMAIL, "test354435");

        } catch (err) {
            this.handleTestError(err);
        }
    }

    public static async registerUser(email:string): Promise<string>{
        const userResponse = await new IdentityApiService(CONST.ep.USERS).registerUser({
            "firstName": "Dave",
            "lastName": "Brown",
            "email": email,
            "password": "test354435"
        });

        return userResponse.body._id;
    }

    private static async addRolesToUser(role: string, userId: string) {
        let roleResponse = await new IdentityApiService(CONST.ep.ROLES).query(
            {
                "name": role
            });

        const adminResponse = await new IdentityApiService(CONST.ep.USERS).update(
            {
                "roles": roleResponse.body
            }, userId);
    }

    private static handleTestError(err: any): void {
        log.error('There was an error during the authentication utitlity setup');
        log.error(err)
        throw err;
    }
}