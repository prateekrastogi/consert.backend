FROM node:8.11.1-alpine

# Create app directory
RUN mkdir -p /backend
WORKDIR /backend

# Bundle app source
COPY package.json providers.production.json /backend/
COPY /client  /backend/client
COPY /common  /backend/common
COPY /server  /backend/server
COPY /lib  /backend/lib

# Install app dependencies
RUN apk add --no-cache \
    git \
    && npm install --production \
    && apk del git

#Finally setting container parameters
ENV NODE_ENV 'production'
EXPOSE 3100 5000

#Container Start-up
CMD [ "npm", "start" ]
