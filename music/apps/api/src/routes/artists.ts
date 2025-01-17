import express from 'express';
import { ARTISTS_TABLE_NAME, documentClient } from '@music/dynamodb';
import {
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { v7 as uuidv7 } from 'uuid';
import bodyParser from 'body-parser';

// Handles requests made to /api/artists
export const artistsRouter = express.Router();
const jsonParser = bodyParser.json();

// Respond to a GET request to the /api/artists route:
artistsRouter.get('/:artistId', async (req, res) => {
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

    res.send({
      message: 'Successfully retrieved artist',
      status: 200,
      artist: result.Item,
    });
  } catch (error) {
    res.send({
      message: 'Could not find artist',
      status: 404,
    });
  }
});

// Respond to a POST request to the /api/artists route:
artistsRouter.post('/', jsonParser, async (req, res) => {
  const id = uuidv7();
  const command = new PutCommand({
    TableName: ARTISTS_TABLE_NAME,
    Item: {
      id,
      name: req.body.name,
    },
  });

  try {
    await documentClient.send(command);

    res.status(201).send({
      message: 'Successfully created artist',
      artist: {
        id,
        name: req.body.name,
      },
    });
  } catch (error) {
    res.status(500).send({
      message: 'Failed to create artistt',
    });
  }
});

// Respond to a PUT request to the /api/artists route:
artistsRouter.put('/:artistId', (req, res) =>
  res.send('Got a PUT request at /api/artists')
);

// Respond to a DELETE request to the /api/artists route:
artistsRouter.delete('/', (req, res) =>
  res.send('Got a DELETE request at /api/artists')
);
