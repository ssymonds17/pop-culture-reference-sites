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
    const songsTable = new dynamodb.Table(this, "Songs", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: "songs",
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
    const createSongLambda = new LambdaConstruct(this, "CreateSong", {
      functionName: "create-song-handler",
      code: lambda.Code.fromAsset("build/apps/create-song"),
      handler: "index.handler",
    })

    const getArtistsLambda = new LambdaConstruct(this, "GetArtists", {
      functionName: "get-artists-handler",
      code: lambda.Code.fromAsset("build/apps/get-artists"),
      handler: "index.handler",
    })

    const getAlbumsLambda = new LambdaConstruct(this, "GetAlbums", {
      functionName: "get-albums-handler",
      code: lambda.Code.fromAsset("build/apps/get-albums"),
      handler: "index.handler",
    })

    const getArtistByIdLambda = new LambdaConstruct(this, "GetArtistById", {
      functionName: "get-artist-by-id-handler",
      code: lambda.Code.fromAsset("build/apps/get-artist-by-id"),
      handler: "index.handler",
    })

    const getAlbumByIdLambda = new LambdaConstruct(this, "GetAlbumById", {
      functionName: "get-album-by-id-handler",
      code: lambda.Code.fromAsset("build/apps/get-album-by-id"),
      handler: "index.handler",
    })

    const getSongByIdLambda = new LambdaConstruct(this, "GetSongById", {
      functionName: "get-song-by-id-handler",
      code: lambda.Code.fromAsset("build/apps/get-song-by-id"),
      handler: "index.handler",
    })

    const searchLambda = new LambdaConstruct(this, "SearchLambda", {
      functionName: "search-handler",
      code: lambda.Code.fromAsset("build/apps/search"),
      handler: "index.handler",
    })

    // Grant dynamo permissions to Lambda functions
    artistsTable.grantReadWriteData(createArtistLambda.function)
    artistsTable.grantReadData(getArtistsLambda.function)
    artistsTable.grantReadData(getArtistByIdLambda.function)
    artistsTable.grantReadWriteData(createAlbumLambda.function)
    artistsTable.grantReadWriteData(createSongLambda.function)
    artistsTable.grantReadData(searchLambda.function)

    albumsTable.grantReadWriteData(createAlbumLambda.function)
    albumsTable.grantReadData(getAlbumsLambda.function)
    albumsTable.grantReadData(getAlbumByIdLambda.function)
    albumsTable.grantReadWriteData(createSongLambda.function)
    albumsTable.grantReadData(searchLambda.function)

    songsTable.grantReadWriteData(createSongLambda.function)
    songsTable.grantReadData(getSongByIdLambda.function)
    songsTable.grantReadData(searchLambda.function)

    // Define the API Gateway resource
    const api = new apigateway.RestApi(this, "MusicApi", {
      restApiName: "music-api",
    })

    // RESOURCES
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
    artist.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
    })
    const getArtistById = artist.addResource("{id}")
    getArtistById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getArtistByIdLambda.function)
    )

    // Albums
    const getAlbums = api.root.addResource("albums")
    getAlbums.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getAlbumsLambda.function)
    )
    const album = api.root.addResource("album")
    album.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createAlbumLambda.function)
    )
    album.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
    })
    const getAlbumById = album.addResource("{id}")
    getAlbumById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getAlbumByIdLambda.function)
    )

    // Songs
    const song = api.root.addResource("song")
    song.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createSongLambda.function)
    )
    song.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
    })
    const getSongById = song.addResource("{id}")
    getSongById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getSongByIdLambda.function)
    )

    // Search
    const search = api.root.addResource("search")
    search.addMethod(
      "GET",
      new apigateway.LambdaIntegration(searchLambda.function)
    )
  }
}
