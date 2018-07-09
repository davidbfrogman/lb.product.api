import { Database } from '../../config/database/database';
import { App, server } from '../../server-entry';
import { Product, IProduct, ITokenPayload } from '../../models';
import { Config } from '../../config/config';
import { CONST } from "../../constants";
import { AuthUtil } from "../authentication.util.spec";
import { Cleanup } from "../cleanup.util.spec";
import { suite, test } from "mocha-typescript";
import { DatabaseBootstrap } from "../../config/database/database-bootstrap";

import * as supertest from 'supertest';
import * as chai from 'chai';

const api = supertest.agent(App.server);
const mongoose = require("mongoose");
const expect = chai.expect;
const should = chai.should();

@suite('Product Model -> ')
class ProductTest {

    // First we need to get some users to work with from the identity service
    public static before(done) {
        console.log('Testing products');
        // This code should only be called if this test is run as a single test.  When run in the suite along with
        // bootstrap.util.spec this code is run by the bootstrap spec.
        // App.server.on('dbConnected', async () => {
        //     await Cleanup.clearDatabase();
        //     await DatabaseBootstrap.seed();

        //     // This will create, 2 users, an organization, and add the users to the correct roles.
        //     await AuthUtil.createIdentityApiTestData();
        //     done();
        // });
        //This done should be commented if you're going to run this as suite.only()
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

    @test('system admins should be allowed to create new products')
    public async TestAbilityToCreateProduct() {
        let product: IProduct = {
            displayName: "Midnight Snap Dragon Admin",
            isTemplate: true,
        }

        let response = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}`)
            .set(CONST.TOKEN_HEADER_KEY, AuthUtil.systemAuthToken)
            .send(product);

        expect(response.status).to.equal(201);
        expect(response.body).to.be.an('object');
        expect(response.body.displayName).to.be.equal(product.displayName);
        expect(response.body.isTemplate).to.be.true;
        expect(response.body.ownerships).to.be.an('array');
        expect(response.body.ownerships.length).to.be.greaterThan(0);
        return;
    }

    @test('product admins should be able to create new product templates')
    public async AbilityToCreateNewProductTemplates() {
        let product: IProduct = {
            displayName: "Midnight Snap Dragon",
            isTemplate: true,
        }

        let response = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}`)
            .set(CONST.TOKEN_HEADER_KEY, AuthUtil.productAdminToken)
            .send(product);

        expect(response.status).to.equal(201);
        expect(response.body).to.be.an('object');
        expect(response.body.displayName).to.be.equal(product.displayName);
        expect(response.body.isTemplate).to.be.true;
        return;
    }

    @test('should list all the products')
    public async productList() {
        let response = await api
            .get(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}`)
            .set("x-access-token", AuthUtil.productAdminToken);

        expect(response.status).to.equal(200);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.greaterThan(0); // we have a seed user, and a new temp user.
        return;
    }

    @test('making sure get product by id works')
    public async getByIdWorking() {
        let createdId = await this.createProductTemplate(AuthUtil.productAdminToken);

        let response = await api
            .get(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${createdId}`)
            .set("x-access-token", AuthUtil.productAdminToken);

        expect(response.status).to.equal(200);
        expect(response.body).to.be.an('object');
        expect(response.body).to.have.property('displayName');
        return;
    }

    @test('it should update a product')
    public async updateAProduct() {
        let createdId = await this.createProductTemplate(AuthUtil.productAdminToken);

        let productUpdate = {
            _id: `${createdId}`,
            displayName: "Daves Tulip",
            isTemplate: true,
        };

        let response = await api
            .put(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${createdId}`)
            .set("x-access-token", AuthUtil.productAdminToken)
            .send(productUpdate);

        expect(response.status).to.equal(202);
        expect(response.body).to.have.property('displayName');
        expect(response.body.displayName).to.equal(productUpdate.displayName);
        return;
    }

    @test('it should delete a product')
    public async deleteAProduct() {
        let createdId = await this.createProductTemplate(AuthUtil.productAdminToken);

        let response = await api
            .delete(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${createdId}`)
            .set("x-access-token", AuthUtil.productAdminToken);

        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('ItemRemoved');
        expect(response.body).to.have.property('ItemRemovedId');
        expect(response.body.ItemRemovedId).to.be.equal(createdId);
        return;
    }


    @test('should return a 404 on delete when the ID isnt there')
    public async onDeleteWithoutID404() {
        let response = await api
            .delete(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/58f8c8caedf7292be80a90e4`)
            .set("x-access-token", AuthUtil.productAdminToken);

        expect(response.status).to.equal(404);
        return;
    }

    @test('should return a 404 on update when the ID isnt there')
    public async onUpdateWithoutID404() {
        let response = await api
            .put(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/58f8c8caedf7292be80a90e4`)
            .set("x-access-token", AuthUtil.systemAuthToken);

        expect(response.status).to.equal(404);
        return;
    }

    // We need to make sure all the role checking logic works for destroy.
    @test('it should delete a product when the organization IDs match.')
    public async deleteOnlyIfOrgIdsMatch() {
        let createdId = await this.createProductTemplate(AuthUtil.productAdminToken);

        let response = await api
            .delete(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${createdId}`)
            .set("x-access-token", AuthUtil.productAdminToken);

        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('ItemRemoved');
        expect(response.body).to.have.property('ItemRemovedId');
        expect(response.body.ItemRemovedId).to.be.equal(createdId);
        return;
    }

    // We need to make sure all the role checking logic works for destroy.
    @test('it send back a 403 unauthorized when org ids dont match on DELETE')
    public async deleteFailsForDifferentOrgIds() {
        let createdId = await this.createProductTemplate(AuthUtil.systemAuthToken);

        let response = await api
            .delete(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${createdId}`)
            .set("x-access-token", AuthUtil.productEditorToken);

        expect(response.status).to.equal(403);
        return;
    }

    // We need to make sure all the role checking logic works for update.
    @test('it should work fine for update if role is product:admin')
    public async updateSucceedsAccrossAdmins() {
        let createdId = await this.createProductTemplate(AuthUtil.systemAuthToken);

        let productUpdate = {
            _id: `${createdId}`,
            displayName: "Daves Tulip",
            isTemplate: true,
        };

        let response = await api
            .put(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${createdId}`)
            .set("x-access-token", AuthUtil.productAdminToken)
            .send(productUpdate);

        expect(response.status).to.equal(202);
        expect(response.body).to.have.property('displayName');
        expect(response.body.displayName).to.equal(productUpdate.displayName);
        return;
    }

    // We need to make sure all the role checking logic works for update.
    @test('it should work fine for update is done by product:editor who is in the same organization')
    public async updateSucceedsForEditorInSameOrg() {

        let createdId = await this.createProductTemplate(AuthUtil.productAdminToken);

        let productUpdate = {
            _id: `${createdId}`,
            displayName: "Daves Tulip",
            isTemplate: true,
        };

        let response = await api
            .put(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${createdId}`)
            .set("x-access-token", AuthUtil.productEditorToken)
            .send(productUpdate);

        expect(response.status).to.equal(202);
        expect(response.body).to.have.property('displayName');
        expect(response.body.displayName).to.equal(productUpdate.displayName);
        return;
    }

    // We need to make sure all the role checking logic works for update.
    @test('it should fail when a product:editor tries to update a product in a different org')
    public async updateFailsForNonAdminInDifferentOrg() {
        let product: IProduct = {
            displayName: "Midnight Snap Dragon",
            isTemplate: true,
        }

        let createResponse = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}`)
            .set("x-access-token", AuthUtil.systemAuthToken)
            .send(product);

        let productUpdate = {
            _id: `${createResponse.body._id}`,
            displayName: "Daves Tulip",
            isTemplate: true,
        };

        let response = await api
            .put(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${createResponse.body._id}`)
            .set("x-access-token", AuthUtil.productEditorToken)
            .send(productUpdate);

        expect(response.status).to.equal(403);
        return;
    }

    // We need to make sure all the role checking logic works for update.
    @test('create a product from a product template')
    public async creatProductFromTemplate() {

        let response = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}${CONST.ep.CREATE_FROM_TEMPLATE}/${await this.createProductTemplate(AuthUtil.systemAuthToken)}`)
            .set("x-access-token", AuthUtil.systemAuthToken)
            .send({});

        expect(response.status).to.equal(201);
        expect(response.body).to.have.property('displayName');
        expect(response.body).to.have.property('isTemplate');
        expect(response.body.isTemplate).to.equal(false);
        return;
    }

    // Testing creation of product template from product:admin can be edited by product:editor
    @test('create a product from a product template edit by product:editor')
    public async checkPermissionsOnTemplatesForEdit() {

        let templateCreateResponse = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}${CONST.ep.CREATE_FROM_TEMPLATE}/${await this.createProductTemplate(AuthUtil.systemAuthToken)}`)
            .set("x-access-token", AuthUtil.productEditorToken)
            .send({});

        let productUpdate = {
            _id: `${templateCreateResponse.body._id}`,
            displayName: "Daves Tulip",
            isTemplate: false,
        };

        let response = await api
            .put(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${templateCreateResponse.body._id}`)
            .set("x-access-token", AuthUtil.productEditorToken)
            .send(productUpdate);

        expect(response.status).to.equal(202);
        expect(response.body).to.have.property('displayName');
        expect(response.body.displayName).to.equal(productUpdate.displayName);
        expect(response.body).to.have.property('isTemplate');
        expect(response.body.isTemplate).to.equal(false);
        return;
    }

    // Testing geo loc searching is working.  this will ensure we have the proper indexes in place.
    @test('geolocation searching working')
    public async addGeoLocationData() {

        let templateCreateResponse = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}${CONST.ep.CREATE_FROM_TEMPLATE}/${await this.createProductTemplate(AuthUtil.systemAuthToken)}`)
            .set("x-access-token", AuthUtil.productEditorToken)
            .send({});

        // This should update this product to have a location near hearst tower
        let productUpdate = {
            _id: `${templateCreateResponse.body._id}`,
            productLocation: {
                coordinates: [
                    -73.9888796,
                    40.7707493
                ],
                type: "Point"
            }
        };

        let response = await api
            .put(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${templateCreateResponse.body._id}`)
            .set("x-access-token", AuthUtil.productEditorToken)
            .send(productUpdate);

        expect(response.status).to.equal(202);

        let locationQuery = {
            "productLocation": {
                "$geoWithin": {
                    "$centerSphere": [
                        [
                            -73.98,
                            40.77
                        ],
                        2 / 3963.2 // this is 2 mile radius
                    ]
                }
            }
        }

        // Now we're going to search for products in that location, and we should get this one back.
        let queryResponse = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}${CONST.ep.common.QUERY}`)
            .set("x-access-token", AuthUtil.productEditorToken)
            .send(locationQuery);

        expect(queryResponse.status).to.equal(200);
        expect(queryResponse.body.results).to.be.an('array');
        expect(queryResponse.body.results.length).to.equal(1); // make sure there is at least one product returned.

        return;
    }

    // create a product from a template, all with system user, try and edit by product editor
    @test('create a product template, create product by admin, edit by product:editor')
    public async checkPermissionsOnEditForProductEditor() {
        let templateCreateResponse = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}${CONST.ep.CREATE_FROM_TEMPLATE}/${await this.createProductTemplate(AuthUtil.systemAuthToken)}`)
            .set("x-access-token", AuthUtil.systemAuthToken)
            .send({});

        let productUpdate = {
            _id: `${templateCreateResponse.body._id}`,
            displayName: "Daves Tulip",
            isTemplate: false,
        };

        let response = await api
            .put(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${templateCreateResponse.body._id}`)
            .set("x-access-token", AuthUtil.productEditorToken)
            .send(productUpdate);

        expect(response.status).to.equal(403);
        return;
    }

    private async createProductTemplate(authToken: string):Promise<string>{
        let product: IProduct = {
            displayName: "Midnight Snap Dragon",
            isTemplate: true,
        }

        let createResponse = await api
            .post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}`)
            .set("x-access-token", authToken)
            .send(product);

        return createResponse.body._id;
    }

    
    @test('create a product, add images, delete should delete images')
    public async deleteProductWithImages() {
        let createdId = await this.createProductTemplate(AuthUtil.productAdminToken);

        // Now we need to post a test image. 
        // './assets/testImage.jpg'
        let uploadResponse =  await api.post(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}${CONST.ep.UPLOAD_IMAGES}/${createdId}`)
        .set("x-access-token", AuthUtil.systemAuthToken)
        .attach('file', './server/tests/assets/testImage.jpg');

        expect(uploadResponse.status).to.equal(200);

        let response = await api
            .delete(`${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${createdId}`)
            .set("x-access-token", AuthUtil.productAdminToken);

        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('ItemRemoved');
        expect(response.body).to.have.property('ItemRemovedId');
        expect(response.body.ItemRemovedId).to.be.equal(createdId);
        return;
    }
}
