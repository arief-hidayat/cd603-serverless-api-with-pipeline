#!/bin/sh
URL=$(cat cdk-output.json | jq -r .ClouddayIcd603Temp0Stack.myDataEndpoint)
echo "GET ${URL}"
http GET $URL

