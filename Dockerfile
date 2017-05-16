FROM node:6.10.3-alpine

#Add git and openssh
RUN apk add --no-cache git
RUN apk add --no-cache openssh

# add custom ssh keys
COPY ssh/ /root/.ssh/

# Fixes permission if needed
RUN chmod 600 /root/.ssh/*

# Avoid first connection host confirmation
RUN ssh-keyscan bitbucket.org > /root/.ssh/known_hosts

#Clone git repo
RUN git clone git@bitbucket.org:PrateekRastogi/frontend.git

#Set up feathers
WORKDIR /consert
COPY . .
RUN rm -rf /public/*

#Copy contents of build from the cloned repo
RUN cp -a ../frontend/build/. /public/

#Remove cloned repo and tools
RUN rm -rf ../frontend/
RUN apk del git
RUN apk del openssh

#Finally set container parameters
ENV NODE_ENV 'production'
ENV PORT '80'
RUN yarn install --production
CMD ["node", "src/"]
