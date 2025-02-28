import * as core from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { LambdaConstruct } from './constructs/lambda';

export class ApiStack extends core.Stack {
  constructor(scope: core.App, id: string, props: any) {
    super(scope, id);

    const artistsTable = new dynamodb.Table(this, 'Artists', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'artists',
    });

    const lambdaConstruct = new LambdaConstruct(this, 'GetArtists', {
      functionName: 'get-artists-handler',
      code: lambda.Code.fromAsset('lambda'),
      handler: 'get-artists-handler.handler',
    });

    artistsTable.grantReadWriteData(lambdaConstruct.function);

    // Define the API Gateway resource
    const api = new apigateway.LambdaRestApi(this, 'MusicApi', {
      restApiName: 'music-api',
      handler: lambdaConstruct.function,
      proxy: false,
    });

    // Define the '/hello' resource with a GET method
    const getArtists = api.root.addResource('artists');
    getArtists.addMethod('GET');
  }
}
