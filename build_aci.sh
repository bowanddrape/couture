#!/usr/bin/env bash
set -e

if [ "$EUID" -ne 0 ]; then
    echo "This script uses functionality which requires root privileges"
    exit 1
fi

# Start the build with an empty ACI
acbuild --debug begin

# In the event of the script exiting, end the build
trap "{ export EXT=$?; acbuild --debug end && exit $EXT; }" EXIT

# Name the ACI
acbuild --debug set-name bowanddrape.com/webserver

# Based on alpine
acbuild --debug dep add quay.io/coreos/alpine-sh

# Install nodejs
acbuild --debug run -- apk update
acbuild --debug run -- apk add nodejs

# Have the app listen on port 80
acbuild --debug environment add PORT 80

# Set the mongo host for the app
acbuild --debug environment add KEY value

# Add a port for http traffic on port 80
acbuild --debug port add http tcp 80

# Copy the app to the ACI
acbuild --debug copy server.js /var/www/server.js

# Run nodejs with the app
acbuild --debug set-exec -- /usr/bin/node /var/www/server.js

# Write the result
acbuild --debug write --overwrite nodejs-latest-linux-amd64.aci
