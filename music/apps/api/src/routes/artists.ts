import express from 'express';
// Handles requests made to /api/artists
export const artistsRouter = express.Router();

// Respond to a GET request to the /api/artists route:
artistsRouter.get('/', (req, res) =>
  res.send('Got a GET request at /api/artists')
);

// Respond to a PUT request to the /api/artists route:
artistsRouter.put('/', (req, res) =>
  res.send('Got a PUT request at /api/artists')
);

// Respond to a DELETE request to the /api/artists route:
artistsRouter.delete('/', (req, res) =>
  res.send('Got a DELETE request at /api/artists')
);
