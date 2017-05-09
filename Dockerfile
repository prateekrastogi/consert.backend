FROM node:6.10.3-alpine

COPY README.md README.md
COPY package.json package.json
COPY config/ config/
COPY public/ public/
COPY src/ src/
ENV NODE_ENV 'production'
ENV PORT '8080'
RUN yarn install --production
CMD ["node", "src/"]
