FROM izone/arm:node

# Set env variables
ENV NODE_ENV production
ENV MM_PORT 8080

WORKDIR /opt/magic_mirror

# Cache node_modules
COPY package.json /opt/magic_mirror
RUN npm install

# Copy all needed files
COPY . /opt/magic_mirror

# Save/Cache config and modules folder for docker-entrypoint
COPY /modules /opt/magic_mirror/unmount_modules
COPY /config /opt/magic_mirror/unmount_config

# Convert docker-entrypoint.sh to unix format and grant execution privileges
RUN apk update \
    && apk add dos2unix --update-cache --repository http://dl-3.alpinelinux.org/alpine/edge/testing/ --allow-untrusted \
    && dos2unix docker-entrypoint.sh \
    && chmod +x docker-entrypoint.sh

EXPOSE $MM_PORT
ENTRYPOINT ["/opt/magic_mirror/docker-entrypoint.sh"]
