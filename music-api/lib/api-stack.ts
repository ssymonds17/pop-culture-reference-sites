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

    const createArtistLambda = new LambdaConstruct(this, 'CreateArtist', {
      functionName: 'create-artist-handler',
      code: lambda.Code.fromAsset('build/apps/create-artist'),
      handler: 'index.handler',
    });
    artistsTable.grantReadWriteData(createArtistLambda.function);

    const getArtistsLambda = new LambdaConstruct(this, 'GetArtists', {
      functionName: 'get-artists-handler',
      code: lambda.Code.fromAsset('build/apps/get-artists'),
      handler: 'index.handler',
    });
    artistsTable.grantReadWriteData(getArtistsLambda.function);

    const getArtistByIdLambda = new LambdaConstruct(this, 'GetArtistsById', {
      functionName: 'get-artist-by-id-handler',
      code: lambda.Code.fromAsset('build/apps/get-artist-by-id'),
      handler: 'index.handler',
    });
    artistsTable.grantReadWriteData(getArtistByIdLambda.function);

    const searchLambda = new LambdaConstruct(this, 'SearchLambda', {
      functionName: 'search-handler',
      code: lambda.Code.fromAsset('build/apps/search'),
      handler: 'index.handler',
    });
    artistsTable.grantReadWriteData(searchLambda.function);

    // Define the API Gateway resource
    const api = new apigateway.RestApi(this, 'MusicApi', {
      restApiName: 'music-api',
    });

    const getArtists = api.root.addResource('artists');
    getArtists.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getArtistsLambda.function)
    );
    const search = api.root.addResource('search');
    search.addMethod(
      'GET',
      new apigateway.LambdaIntegration(searchLambda.function)
    );
    const artist = api.root.addResource('artist');
    artist.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createArtistLambda.function)
    );
    const getArtistById = artist.addResource('{id}');
    getArtistById.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getArtistByIdLambda.function)
    );
  }
}
