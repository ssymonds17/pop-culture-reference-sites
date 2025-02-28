import * as core from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { LambdaConstruct } from './constructs/lambda';

export class ApiStack extends core.Stack {
  constructor(scope: core.App, id: string, props: any) {
    super(scope, id);

    const lambdaConstruct = new LambdaConstruct(this, 'GetSessionHandler', {
      functionName: 'GetSessionHandler',
      code: lambda.Code.fromAsset('lambda'),
      handler: 'get-session-handler.handler',
    });

    // Define the API Gateway resource
    const api = new apigateway.LambdaRestApi(this, 'HelloWorldApi', {
      handler: lambdaConstruct.function,
      proxy: false,
    });

    // Define the '/hello' resource with a GET method
    const getArtists = api.root.addResource('artists');
    getArtists.addMethod('GET');
  }
}
