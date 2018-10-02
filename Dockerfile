FROM mhart/alpine-node:10.11.0
RUN apk update && apk upgrade && apk add --no-cache bash git openssh python make g++
RUN git clone https://github.com/XYOracleNetwork/sdk-archivist-nodejs.git
WORKDIR /sdk-archivist-nodejs
RUN yarn install --production=false
RUN yarn build
RUN rm -r node_modules
RUN yarn install --production=true
EXPOSE 11000/tcp
EXPOSE 11001/tcp
CMD node bin/xyo-archivist -p 11000 -g 11001 -d /archivist-data