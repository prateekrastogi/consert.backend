FROM node:8.1.2-alpine

# Create app directory
RUN mkdir -p /backend
WORKDIR /backend

# Bundle app source
COPY package.json package-lock.json providers.production.json /backend/
COPY /client  /backend/client
COPY /common  /backend/common
COPY /server  /backend/server
COPY /lib  /backend/lib

# Install app dependencies
RUN npm install --production

#Finally setting container parameters
ENV NODE_ENV 'production'
EXPOSE 3100

#Passing commands to be run on container start
CMD [ "npm", "start" ]
