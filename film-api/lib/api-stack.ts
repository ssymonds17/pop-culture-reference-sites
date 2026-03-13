import * as core from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import { LambdaConstruct } from "./constructs/lambda"

export class ApiStack extends core.Stack {
  constructor(scope: core.App, id: string, props: any) {
    super(scope, id, props)

    // Get environment variables
    const mongodbUri = process.env.MONGODB_URI
    if (!mongodbUri) {
      throw new Error("MONGODB_URI environment variable is required")
    }

    const tmdbApiKey = process.env.TMDB_API_KEY
    if (!tmdbApiKey) {
      throw new Error("TMDB_API_KEY environment variable is required")
    }

    const lambdaEnvironment = {
      MONGODB_URI: mongodbUri,
      TMDB_API_KEY: tmdbApiKey,
    }

    // Lambda functions for Films
    const createFilmLambda = new LambdaConstruct(this, "CreateFilm", {
      functionName: "film-create-film-handler",
      code: lambda.Code.fromAsset("build/apps/create-film"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const getFilmsLambda = new LambdaConstruct(this, "GetFilms", {
      functionName: "film-get-films-handler",
      code: lambda.Code.fromAsset("build/apps/get-films"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const getFilmByIdLambda = new LambdaConstruct(this, "GetFilmById", {
      functionName: "film-get-film-by-id-handler",
      code: lambda.Code.fromAsset("build/apps/get-film-by-id"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const updateFilmLambda = new LambdaConstruct(
      this,
      "UpdateFilm",
      {
        functionName: "film-update-film-handler",
        code: lambda.Code.fromAsset("build/apps/update-film"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    const deleteFilmLambda = new LambdaConstruct(this, "DeleteFilm", {
      functionName: "film-delete-film-handler",
      code: lambda.Code.fromAsset("build/apps/delete-film"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    // Lambda functions for Directors
    const getDirectorsLambda = new LambdaConstruct(this, "GetDirectors", {
      functionName: "film-get-directors-handler",
      code: lambda.Code.fromAsset("build/apps/get-directors"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const getDirectorByPersonIdLambda = new LambdaConstruct(
      this,
      "GetDirectorByPersonId",
      {
        functionName: "film-get-director-by-person-id-handler",
        code: lambda.Code.fromAsset("build/apps/get-director-by-person-id"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    const updateDirectorStatsLambda = new LambdaConstruct(
      this,
      "UpdateDirectorStats",
      {
        functionName: "film-update-director-stats-handler",
        code: lambda.Code.fromAsset("build/apps/update-director-stats"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    // Lambda functions for Stats and Years
    const getStatsLambda = new LambdaConstruct(this, "GetStats", {
      functionName: "film-get-stats-handler",
      code: lambda.Code.fromAsset("build/apps/get-stats"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const getYearsLambda = new LambdaConstruct(this, "GetYears", {
      functionName: "film-get-years-handler",
      code: lambda.Code.fromAsset("build/apps/get-years"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const getYearLambda = new LambdaConstruct(this, "GetYear", {
      functionName: "film-get-year-handler",
      code: lambda.Code.fromAsset("build/apps/get-year"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const updateYearStatsLambda = new LambdaConstruct(
      this,
      "UpdateYearStats",
      {
        functionName: "film-update-year-stats-handler",
        code: lambda.Code.fromAsset("build/apps/update-year-stats"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    // Lambda functions for Search and Import
    const searchLambda = new LambdaConstruct(this, "SearchLambda", {
      functionName: "film-search-handler",
      code: lambda.Code.fromAsset("build/apps/search"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const searchTmdbLambda = new LambdaConstruct(this, "SearchTmdb", {
      functionName: "film-search-tmdb-handler",
      code: lambda.Code.fromAsset("build/apps/search-tmdb"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const importFilmsLambda = new LambdaConstruct(this, "ImportFilms", {
      functionName: "film-import-films-handler",
      code: lambda.Code.fromAsset("build/apps/import-films"),
      handler: "index.handler",
      timeout: core.Duration.minutes(5), // Longer timeout for import operations
      environment: lambdaEnvironment,
    })

    // Define the API Gateway resource
    const api = new apigateway.RestApi(this, "FilmApi", {
      restApiName: "film-api",
    })

    // RESOURCES - Films
    const films = api.root.addResource("films")
    films.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getFilmsLambda.function)
    )
    films.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    const film = api.root.addResource("film")
    film.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createFilmLambda.function)
    )
    film.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
    })

    const filmById = film.addResource("{id}")
    filmById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getFilmByIdLambda.function)
    )
    filmById.addMethod(
      "PATCH",
      new apigateway.LambdaIntegration(updateFilmLambda.function)
    )
    filmById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteFilmLambda.function)
    )
    filmById.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PATCH", "DELETE"],
    })

    // RESOURCES - Directors
    const directors = api.root.addResource("directors")
    directors.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getDirectorsLambda.function)
    )
    directors.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    const director = api.root.addResource("director")
    const directorByPersonId = director.addResource("{tmdbPersonId}")
    directorByPersonId.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getDirectorByPersonIdLambda.function)
    )
    directorByPersonId.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    const directorStats = directorByPersonId.addResource("stats")
    directorStats.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateDirectorStatsLambda.function)
    )
    directorStats.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["PUT"],
    })

    // RESOURCES - Stats
    const stats = api.root.addResource("stats")
    stats.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getStatsLambda.function)
    )
    stats.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // RESOURCES - Years
    const years = api.root.addResource("years")
    years.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getYearsLambda.function)
    )
    years.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    const year = api.root.addResource("year")
    const yearById = year.addResource("{year}")
    yearById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getYearLambda.function)
    )
    yearById.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    const yearStats = yearById.addResource("stats")
    yearStats.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateYearStatsLambda.function)
    )
    yearStats.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["PUT"],
    })

    // RESOURCES - Search
    const search = api.root.addResource("search")
    search.addMethod(
      "GET",
      new apigateway.LambdaIntegration(searchLambda.function)
    )
    search.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    const searchTmdb = search.addResource("tmdb")
    searchTmdb.addMethod(
      "GET",
      new apigateway.LambdaIntegration(searchTmdbLambda.function)
    )
    searchTmdb.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // RESOURCES - Import
    const importResource = api.root.addResource("import")
    const importFilms = importResource.addResource("films")
    importFilms.addMethod(
      "POST",
      new apigateway.LambdaIntegration(importFilmsLambda.function)
    )
    importFilms.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
    })
  }
}
