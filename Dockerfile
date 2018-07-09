FROM mhart/alpine-node

WORKDIR /usr/app

ENV NODE_ENV development

# If you have native dependencies, you'll need extra tools
# This is used to rebuild bcrypt from source Don't remove it unless you want a segmentation fault on the building
# of the docker image
RUN apk --no-cache add make gcc g++ python

# This is so that sharp which is the image libarary we're using for building will install correctly on linux.
RUN apk add vips-dev fftw-dev --update-cache --repository https://dl-3.alpinelinux.org/alpine/edge/testing/

RUN npm i -g pm2

RUN npm i -g gulp

RUN pm2 install pm2-logrotate

# have to use the unsafe perm thing here, or else node sass will fail to install with a ton of permission errors
# don't remove the --unsafe-perm unless you have tested it, and it works.
RUN npm install -g @angular/cli --unsafe-perm

# install node modules  Notice how this is before we move app code over
# this will make sure that we cache this portion.
COPY package.json /usr/app/package.json

# now we do the same thing for the client, create a directory, and then copy over the package.json
RUN mkdir client

# put the clients package.json in place
COPY /client/package.json /usr/app/client/package.json

# go to the app and install
RUN  cd /usr/app && npm install

# This is required to not have a segmentation fault when running the server
RUN npm rebuild bcrypt --build-from-source

# go to the client, and install
RUN cd /usr/app/client && npm install

# copy eveything over
COPY . .

# now we need to build the client
RUN cd /usr/app/client && npm run prodbuild
RUN cd /usr/app/client && npm run stagebuild
RUN cd /usr/app/client && npm run testbuild
RUN cd /usr/app/client && npm run devbuild

# build the server
RUN gulp build 

RUN npm test

EXPOSE 9000
CMD ["npm", "start"]