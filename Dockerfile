# Set the base image to Ubuntu
FROM    ubuntu

# File Author / Maintainer
MAINTAINER graphicsforge

# Install Node.js and other dependencies
RUN apt-get update && \
    apt-get -y install python build-essential npm nodejs

# Install nodemon
RUN npm install -g nodemon

# Provides cached layer for node_modules
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /srv && cp -a /tmp/node_modules /srv/

# Define working directory
WORKDIR /srv
ADD . /srv

# Expose port
EXPOSE  80

# Run app
CMD ["nodejs", "/srv/server.js"]
