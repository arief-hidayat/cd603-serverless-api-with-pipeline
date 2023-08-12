import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface ServerlessApiStackProps extends cdk.StackProps {
  restResourceName: string
  stageName: string
}
export class ServerlessApiStack extends cdk.Stack {

  outputApiEndpoint: cdk.CfnOutput
  constructor(scope: Construct, id: string, props: ServerlessApiStackProps) {
    super(scope, id, props);

    // create DynamoDB Table
    const ddbTable = new dynamodb.Table(this, props.restResourceName, {
      tableName: `${props.stageName}-${props.restResourceName}`,
      partitionKey: { name: 'ID', type: dynamodb.AttributeType.STRING },
      // THIS IS NOT RECOMMENDED FOR PRODUCTION USE
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
      readCapacity: 1,
      writeCapacity: 1
    });

    // define IAM role for lambda function
    const lambdaRole = this.createLambdaRoleForLoggingAndDbAccess(ddbTable.tableArn)
    // create API Gateway Lambda integrations
    const deleteDataFn = this.createServerlessApi('delete-data', lambdaRole, ddbTable.tableName)
    const getDataFn = this.createServerlessApi('get-data', lambdaRole, ddbTable.tableName)
    const listDataFn = this.createServerlessApi('list-data', lambdaRole, ddbTable.tableName)
    const saveDataFn = this.createServerlessApi('save-data', lambdaRole, ddbTable.tableName)

    // create REST APIs
    const api = new apigateway.RestApi(this, 'api', {
      endpointConfiguration: { types: [apigateway.EndpointType.EDGE] },
      deployOptions: {
        stageName: props.stageName,
      }
    })
    const restData = api.root.addResource(props.restResourceName)
    restData.addMethod('POST', saveDataFn)
    restData.addMethod('GET', listDataFn)
    const restDataId = restData.addResource('{id}')
    restDataId.addMethod('GET', getDataFn)
    restDataId.addMethod('DELETE', deleteDataFn)

    // CDK Outputs
    this.outputApiEndpoint = new cdk.CfnOutput(this, 'apiEndpoint', {
      value: `${api.url}${props.restResourceName}`,
      exportName: `${props.stageName}-apiEndpoint`
    })
  }

  // define IAM role for lambda function
  createLambdaRoleForLoggingAndDbAccess(ddbTableArn: string): iam.Role {
    const lambdaRole = new iam.Role(this, 'lambda-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })
    // allow the following CloudWatch logs action
    const cloudWatchPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ]
    })
    lambdaRole.addToPolicy(cloudWatchPolicy)
    // allow the following DynamoDB actions
    const dynamoDbPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [ddbTableArn],
      actions: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Scan',
        'dynamodb:Query',
        'dynamodb:ConditionCheckItem',
      ]
    })
    lambdaRole.addToPolicy(dynamoDbPolicy)
    return lambdaRole
  }

  // create API Gateway Lambda Integration
  // the python function code should reside in 'serverless-api/${name}/app.py'
  createServerlessApi(name: string, lambdaRole: iam.Role, ddbTableName: string): apigateway.LambdaIntegration {
    const fn = new lambda.Function(this, name, {
      runtime: lambda.Runtime.PYTHON_3_11,
      code: new lambda.AssetCode(`serverless-api/${name}`),
      handler: 'app.handler',
      timeout: cdk.Duration.seconds(60),
      tracing: lambda.Tracing.ACTIVE,
      role: lambdaRole
    })
    fn.addEnvironment('TABLE_NAME', ddbTableName)
    return new apigateway.LambdaIntegration(fn)
  }

}
