#!/bin/sh
URL=$(cat cdk-output.json | jq -r '."cd63-api-dev".apiEndpoint')
echo "http POST ${URL} text=$1"
http POST $URL text="$1"

