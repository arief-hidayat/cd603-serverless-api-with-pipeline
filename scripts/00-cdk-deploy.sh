#!/bin/sh
echo "Executing: cdk deploy --require-approval never cd63-api-dev -O cdk-output.json"
cdk deploy --require-approval never cd63-api-dev -O cdk-output.json