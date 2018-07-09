# Leblum Product API 
 
Implementation of async - await methods in mongoose and express.

- Code coverage with Istanbul
- No need for local MongoDB
- Unit tests with Mockgoose
- API documentation using Swagger

## Installation

```bash
npm install
```
be sure to set the cluster policy on windows to RR otherwise your pm2 instance won't round robin
set NODE_CLUSTER_SCHED_POLICY=rr

## Startup

dev
In one terminal  
```
    $ npm run nm
```
In another terminal
```
    $ gulp watch
```
In another terminal
```
    $ nodemon dist/file-processor/file-processor.js
```

if you want to run pm2

```
    $ pm2 start ecosystem.config.js
```
or you can also run using the included script in the package.json.  To see how it runs in production look at the Procfile in the root:
```
npm run pm2Runner
```
you can then monitor using 
```
    $ pm2 monit
```

At some point you might want to try running pm2 to increase performance.  At this point, doing it on a free heroku dyno is hurting more than it's helping.
Change the Procfile to be this:
```
web: ./node_modules/.bin/pm2 start ecosystem.config.js && ./node_modules/.bin/pm2 logs all
```

load testing with artillery use the artillery.yml file.  This won't work without authentication
```
    artillery run artillery.yml 

    // These ones won't actually work unless you pass in the auth token, but they're good to see how the config on command line works.
    artillery quick --duration 60 --rate 100 -n 20 http://localhost:8080/api/users

    artillery quick --duration 60 --rate 100 -n 20 https://leblum-vendor-api-alpha.herokuapp.com/api/users
```

If you want to actually start using TLS/HTTPS you need to turn on Helmet to prevent a bunch of attacks on the server:
Uncomment this line in server.ts
//app.use(helmet()); //Protecting the app from a lot of vulnerabilities turn on when you want to use TLS.

If you're getting errors on gulp build missing @gulp-sourcemaps/sourcemaps
rm ./package-lock.json
rm -r ./node_modules
npm cache clear --force
npm install

## URL

If you hit the root, you'll see how you can work with the api.  the docs location etc.

# Docker Cheat sheet

if you're constantly building the image.... you'll want to clean up the lingering images
```docker image prune```

checking in changes to see automatic deploys working 
Take a look at the logs for a container.
```docker logs container-id```

 ```docker build -t leblum/product.api .```

 ```docker stop leblum-product-api```

```docker run --name=leblum-product-api -p 8080:8080 leblum/product.api```

Removing a named container
```docker rm /leblum-product-api```

Run it in the background--->
```docker run -d --name=leblum-product-api -p 8080:8080 leblum/product.api ```

Then you can stream the logs out if you want
```docker attach leblum-product-api```

Did you get a segmentation fault on running the image?  Maybe you need to rebuild the docker image from scratch
```docker build --no-cache -t leblum/product.api .```

 Deploy a stack from the compose.yml
 ```
docker stack deploy -c docker-compose.yml lb-product

 docker stack ps lb-product

 docker stack rm lb-product

 ```

Show the status of a stack/service
 docker stack services lb-product


 docker-machine create --driver digitalocean --digitalocean-access-token=3a6f3017e9b0d2a38b1f4dbdaaa7815da0e419dd226bf266251d5454f0d03c7e testing-machine

 # Linux Cheat Sheet 

 To copy out to the server.  You run this directly from a local console.  Don't log into the server. 
 ```scp -r build root@198.199.74.116:/usr/davesStuff```

Take a rancher backup
``` docker exec -i practical_swirles mysqldump -A > rancher.dump```

Copy the dump back over locally
``` scp root@198.199.74.116:/usr/rancher.dump .```

# Rancher


 # Logging into a rancher created instance
First download the keys from the host.  You go to hosts, and then machine config.
Place the keys in a folder.
My keys are stored in f:\leblum\servers\SERVER_NAME
cd into the server name you want to connect to.

# Rancher dev-luxor-1
ssh -i id_rsa root@165.227.67.136 

# Rancher dev-luxor-2
ssh -i id_rsa root@165.227.96.232

# Certificates
certs are stored inside the docker container that's running haproxy.  For instance they are stored:
/etc/haproxy/certs

You can see them by running a console from the rancher ui, on the load balancer container.
dev-luxor->lebulm-load-balancer-container-> Where the certs are.

# Hyper Visor Emulator With Docker 

Turning it off
```
bcdedit /set hypervisorlaunchtype off
```

Turning it on

```
bcdedit /set hypervisorlaunchtype on
```

# Environment files notes

So the environment files can be a bit confusing.  Especially when you take a look through the docker file, and the client code base.

Here's the deal.  The dockerfile builds all environments, and then we serve a folder based on runtime environment config.  That means that
at build time the client is built with it's related environment file, and then at run time we serve a specific client out through the express server.

For instance for development.  The client is built using the --env=dev and output-dir=/dist/dev this will put a fully functional, properly configured client in the docker container, with it's related environment built into the codebase.  The express server at runtime decides which client folder to serve out.  This is deteremined at runtime by the related convict config for the server. 

This allows me to have the best of both worlds.  We can use angular environment files like they were designed, and we can still have a single docker file.  So one dockerfile will build me all the client environments that we might need. 

If you want to have the client live reload, and served out of the server, then run in the client
```
npm start
```

and in the server ->
```
gulp watch
npm run nm
```
docker cloud push
# Text indexes in mongodb

At some point we're going to want to index various fields on the product table, so that we can allow searching, and that searching doesn't hurt 
performance.

Here's two ways to create indexes on mongodb ... which you can do throuhg mlab.

db.reviews.createIndex( { displayName: "text" } )

Or you can create a text index over all string fields in a collection:

db.collection.createIndex( { "$**": "text" } )

Obviously when the time comes we'll want to put a text index just on the fields that we want to search over, and not all fields.