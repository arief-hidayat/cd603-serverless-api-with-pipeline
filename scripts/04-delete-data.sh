#!/bin/sh
URL=$(cat cdk-output.json | jq -r .ClouddayIcd603Temp0Stack.myDataEndpoint)
# curl $URL
ID=$(http GET $URL | jq -r ".data[-1].ID")
echo "DELETE ${URL}/${ID}"
http DELETE "${URL}/${ID}"

