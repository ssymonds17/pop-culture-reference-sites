import * as core from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as dynamodb from "aws-cdk-lib/aws-dynamodb"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import { LambdaConstruct } from "./constructs/lambda"

export class ApiStack extends core.Stack {
  constructor(scope: core.App, id: string, props: any) {
    super(scope, id)

    // Tables
    const artistsTable = new dynamodb.Table(this, "Artists", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: "artists",
    })
    const albumsTable = new dynamodb.Table(this, "Albums", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: "albums",
    })

    // Lambda functions
    const createArtistLambda = new LambdaConstruct(this, "CreateArtist", {
      functionName: "create-artist-handler",
      code: lambda.Code.fromAsset("build/apps/create-artist"),
      handler: "index.handler",
    })
    const createAlbumLambda = new LambdaConstruct(this, "CreateAlbum", {
      functionName: "create-album-handler",
      code: lambda.Code.fromAsset("build/apps/create-album"),
      handler: "index.handler",
    })

    const getArtistsLambda = new LambdaConstruct(this, "GetArtists", {
      functionName: "get-artists-handler",
      code: lambda.Code.fromAsset("build/apps/get-artists"),
      handler: "index.handler",
    })

    const getArtistByIdLambda = new LambdaConstruct(this, "GetArtistsById", {
      functionName: "get-artist-by-id-handler",
      code: lambda.Code.fromAsset("build/apps/get-artist-by-id"),
      handler: "index.handler",
    })

    const searchLambda = new LambdaConstruct(this, "SearchLambda", {
      functionName: "search-handler",
      code: lambda.Code.fromAsset("build/apps/search"),
      handler: "index.handler",
    })

    // Grant dynamo permissions to Lambda functions
    artistsTable.grantReadWriteData(createArtistLambda.function)
    artistsTable.grantReadWriteData(createAlbumLambda.function)
    artistsTable.grantReadWriteData(getArtistsLambda.function)
    artistsTable.grantReadWriteData(getArtistByIdLambda.function)
    albumsTable.grantReadWriteData(createAlbumLambda.function)
    artistsTable.grantReadWriteData(searchLambda.function)
    albumsTable.grantReadWriteData(searchLambda.function)

    // Define the API Gateway resource
    const api = new apigateway.RestApi(this, "MusicApi", {
      restApiName: "music-api",
    })

    // Artists
    const getArtists = api.root.addResource("artists")
    getArtists.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getArtistsLambda.function)
    )
    const artist = api.root.addResource("artist")
    artist.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createArtistLambda.function)
    )
    const getArtistById = artist.addResource("{id}")
    getArtistById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getArtistByIdLambda.function)
    )

    // Albums
    const album = api.root.addResource("album")
    album.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createAlbumLambda.function)
    )

    // Search
    const search = api.root.addResource("search")
    search.addMethod(
      "GET",
      new apigateway.LambdaIntegration(searchLambda.function)
    )
  }
}
