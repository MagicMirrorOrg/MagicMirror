FROM node:latest

RUN apt-get update && apt-get -y install dos2unix

WORKDIR /opt/magic_mirror
COPY . .
COPY /modules unmount_modules
COPY /config unmount_config

ENV NODE_ENV production
ENV MM_PORT 8080

RUN npm install

RUN ["dos2unix", "docker-entrypoint.sh"]
RUN ["chmod", "+x", "docker-entrypoint.sh"]

EXPOSE $MM_PORT
ENTRYPOINT ["/opt/magic_mirror/docker-entrypoint.sh"]
