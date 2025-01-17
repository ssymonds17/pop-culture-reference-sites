import express from 'express';
import { ARTISTS_TABLE_NAME, documentClient } from '@music/dynamodb';
import {
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { v7 as uuidv7 } from 'uuid';
import bodyParser from 'body-parser';

// Handles requests made to /api/artists
export const artistsRouter = express.Router();
const jsonParser = bodyParser.json();

// Respond to a GET request to the /api/artists/:artistId route:
artistsRouter.get('/:artistId', async (req, res) => {
  console.log('GETTING ARTIST BY ID');
  const params: GetCommandInput = {
    TableName: ARTISTS_TABLE_NAME,
    Key: {
      id: req.params.artistId,
    },
  };

  try {
    const result: GetCommandOutput = await documentClient.send(
      new GetCommand(params)
    );

    if (!result.Item) {
      throw new Error('Artist not found');
    }

    res.status(200).send({
      message: 'Successfully retrieved artist',
      artist: result.Item,
    });
  } catch (error) {
    res.status(404).send({
      message: 'Could not find artist',
      status: 404,
    });
  }
});

// Respond to a GET request to the /api/artists route:
artistsRouter.get('/', async (req, res) => {
  console.log('GETTING ALL ARTIST');
  const params: ScanCommandInput = {
    TableName: ARTISTS_TABLE_NAME,
  };

  try {
    const result: ScanCommandOutput = await documentClient.send(
      new ScanCommand(params)
    );

    res.status(200).send({
      message: 'Successfully retrieved artists',
      artist: result.Items,
    });
  } catch (error) {
    res.status(404).send({
      message: 'Could not find artists',
    });
  }
});

// Respond to a GET request to the /api/artists/name-search route:
artistsRouter.get('/name/search', async (req, res) => {
  console.log('SEARCHING ARTIST BY NAME');
  const searchQuery = req.query.name as string;
  const params: ScanCommandInput = {
    TableName: ARTISTS_TABLE_NAME,
  };

  try {
    const result: ScanCommandOutput = await documentClient.send(
      new ScanCommand(params)
    );

    const filteredArtists = result.Items.filter((artist) =>
      artist.name.includes(searchQuery)
    );

    res.status(200).send({
      message: 'Successfully retrieved artists',
      artist: filteredArtists,
    });
  } catch (error) {
    res.status(404).send({
      message: 'Could not find artists',
    });
  }
});

// Respond to a POST request to the /api/artists route:
artistsRouter.post('/', jsonParser, async (req, res) => {
  console.log('CREATING ARTIST');
  const id = uuidv7();
  const command = new PutCommand({
    TableName: ARTISTS_TABLE_NAME,
    Item: {
      id,
      name: req.body.name,
      songs: 0,
      silverAlbums: 0,
      goldAlbums: 0,
      score: 0,
    },
  });

  try {
    await documentClient.send(command);

    res.status(201).send({
      message: 'Successfully created artist',
      artist: {
        id,
        name: req.body.name,
        songs: 0,
        silverAlbums: 0,
        goldAlbums: 0,
        score: 0,
      },
    });
  } catch (error) {
    res.status(500).send({
      message: 'Failed to create artistt',
    });
  }
});

// Respond to a PUT request to the /api/artists/:artistId route:
artistsRouter.put('/:artistId', (req, res) =>
  res.send('Got a PUT request at /api/artists')
);

// Respond to a DELETE request to the /api/artists/:artistId route:
artistsRouter.delete('/:artistId', async (req, res) => {
  console.log('DELETING ARTIST BY ID');
  const command = new DeleteCommand({
    TableName: ARTISTS_TABLE_NAME,
    Key: {
      id: req.params.artistId,
    },
  });

  try {
    await documentClient.send(command);

    res.status(200).send({
      message: 'Successfully deleted artist',
    });
  } catch (error) {
    res.status(500).send({
      message: 'Failed to delete artistt',
    });
  }
});
