#!/bin/sh
URL=$(cat cdk-output.json | jq -r '."cd63-api-dev".apiEndpoint')
# curl $URL
ID=$(http GET $URL | jq -r ".data[-1].ID")
echo "http DELETE ${URL}/${ID}"
http DELETE "${URL}/${ID}"

