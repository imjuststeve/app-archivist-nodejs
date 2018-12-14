FROM mhart/alpine-node:10.14.2
RUN apk update && apk upgrade && apk add --no-cache bash  openssh python make g++
RUN yarn global add @xyo-network/app-archivist
RUN mkdir workspace
WORKDIR /workspace
EXPOSE 11000/tcp
EXPOSE 11001/tcp

CMD xyo-archivist