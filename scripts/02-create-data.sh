#!/bin/sh
URL=$(cat cdk-output.json | jq -r .ClouddayIcd603Temp0Stack.myDataEndpoint)
echo "POST ${URL} text=$1"
# curl -XPOST $URL
http POST $URL text="$1"

