import express from 'express';
import { ARTISTS_TABLE_NAME, documentClient } from '@music/dynamodb';
import {
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
} from '@aws-sdk/lib-dynamodb';
// Handles requests made to /api/artists
export const artistsRouter = express.Router();

// Respond to a GET request to the /api/artists route:
artistsRouter.get('/:artistId', async (req, res) => {
  const params: GetCommandInput = {
    TableName: ARTISTS_TABLE_NAME,
    Key: {
      id: req.params.artistId,
    },
  };
  const result: GetCommandOutput = await documentClient.send(
    new GetCommand(params)
  );

  if (result.Item) {
    res.send({
      message: 'Successfully retrieved artist',
      status: 200,
      artist: result.Item,
    });
  } else {
    res.send({
      message: 'Could not find artist',
      status: 404,
    });
  }
});

// Respond to a PUT request to the /api/artists route:
artistsRouter.put('/', (req, res) =>
  res.send('Got a PUT request at /api/artists')
);

// Respond to a DELETE request to the /api/artists route:
artistsRouter.delete('/', (req, res) =>
  res.send('Got a DELETE request at /api/artists')
);
