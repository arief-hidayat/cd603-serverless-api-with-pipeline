#!/bin/sh
URL=$(cat cdk-output.json | jq -r '."cd63-api-dev".apiEndpoint')
echo "http GET ${URL}"
http GET $URL

