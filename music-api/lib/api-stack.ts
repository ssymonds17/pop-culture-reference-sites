import * as core from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import { LambdaConstruct } from "./constructs/lambda"

export class ApiStack extends core.Stack {
  constructor(scope: core.App, id: string, props: any) {
    super(scope, id)

    // Lambda functions
    const createArtistLambda = new LambdaConstruct(this, "CreateArtist", {
      functionName: "create-artist-handler",
      code: lambda.Code.fromAsset("build/apps/create-artist"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
    })
    const createAlbumLambda = new LambdaConstruct(this, "CreateAlbum", {
      functionName: "create-album-handler",
      code: lambda.Code.fromAsset("build/apps/create-album"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
    })
    const createSongLambda = new LambdaConstruct(this, "CreateSong", {
      functionName: "create-song-handler",
      code: lambda.Code.fromAsset("build/apps/create-song"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
    })

    const updateAlbumRatingLambda = new LambdaConstruct(
      this,
      "UpdateAlbumRating",
      {
        functionName: "update-album-rating-handler",
        code: lambda.Code.fromAsset("build/apps/update-album-rating"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
      }
    )

    const getArtistsLambda = new LambdaConstruct(this, "GetArtists", {
      functionName: "get-artists-handler",
      code: lambda.Code.fromAsset("build/apps/get-artists"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
    })

    const getAlbumsLambda = new LambdaConstruct(this, "GetAlbums", {
      functionName: "get-albums-handler",
      code: lambda.Code.fromAsset("build/apps/get-albums"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
    })

    const getArtistByIdLambda = new LambdaConstruct(this, "GetArtistById", {
      functionName: "get-artist-by-id-handler",
      code: lambda.Code.fromAsset("build/apps/get-artist-by-id"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
    })

    const getAlbumByIdLambda = new LambdaConstruct(this, "GetAlbumById", {
      functionName: "get-album-by-id-handler",
      code: lambda.Code.fromAsset("build/apps/get-album-by-id"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
    })

    const getSongByIdLambda = new LambdaConstruct(this, "GetSongById", {
      functionName: "get-song-by-id-handler",
      code: lambda.Code.fromAsset("build/apps/get-song-by-id"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
    })

    const getYearsLambda = new LambdaConstruct(this, "GetYears", {
      functionName: "get-years-handler",
      code: lambda.Code.fromAsset("build/apps/get-years"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
    })

    const searchLambda = new LambdaConstruct(this, "SearchLambda", {
      functionName: "search-handler",
      code: lambda.Code.fromAsset("build/apps/search"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
    })

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
    getArtists.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })
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
    getArtistById.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // Albums
    const getAlbums = api.root.addResource("albums")
    const album = api.root.addResource("album")
    const getAlbumById = album.addResource("{id}")
    const updateAlbumRating = getAlbumById.addResource("rating")

    getAlbums.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getAlbumsLambda.function)
    )
    album.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createAlbumLambda.function)
    )
    getAlbumById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getAlbumByIdLambda.function)
    )
    updateAlbumRating.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateAlbumRatingLambda.function)
    )

    getAlbums.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })
    album.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
    })
    getAlbumById.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })
    updateAlbumRating.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["PUT"],
    })

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
    getSongById.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // Years
    const getYears = api.root.addResource("years")
    getYears.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getYearsLambda.function)
    )
    getYears.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // Search
    const search = api.root.addResource("search")
    search.addMethod(
      "GET",
      new apigateway.LambdaIntegration(searchLambda.function)
    )
    search.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })
  }
}
