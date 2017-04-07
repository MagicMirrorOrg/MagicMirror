FROM node:latest

ENV NODE_ENV production
ENV MM_PORT 8080
WORKDIR /opt/magic_mirror

COPY . .
COPY /modules unmount_modules
COPY /config unmount_config

RUN apt-get update \
  && apt-get -qy install tofrodos dos2unix \
  && chmod -R 777 vendor \
  && npm install \
  && cd vendor \ 
  && npm install \ 
  && cd .. \ 
  && dos2unix docker-entrypoint.sh \
  && chmod +x docker-entrypoint.sh

EXPOSE $MM_PORT
ENTRYPOINT ["/opt/magic_mirror/docker-entrypoint.sh"]
