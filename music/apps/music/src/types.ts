export enum Variation {
  ARTIST = 'artist',
  ALBUM = 'album',
  SONG = 'song',
}

export interface Song {
  _id: string; // unique id of the song
  title: string; // title of the song
  displayTitle: string; // title of the song to be displayed in the client
  year: number; // the year the song was released
  album?: string; // {optional} the id of the album the song was released on
  albumDisplayTitle?: string; // {optional} the display title of the album the song was released on
  artists: string[]; // array of ids that represent the artists present on the song
  artistDisplayName: string; // the display name of the artist of the song
}

export enum Rating {
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  NONE = 'NONE',
}

export interface Album {
  _id: string; // unique id of the album
  title: string; // title of the album
  displayTitle: string; // title of the album to be displayed in the client
  year: number; // the year the album was released
  artistDisplayName: string; // the display name of the artist of the album
  artists: string[]; // the ids of the artists who should be credited with this album
  songs: string[]; // the ids songs on the album
  rating: Rating; // what is the rating of the album (if applicable)
}

export interface AlbumFull extends Omit<Album, 'songs'> {
  songs: Song[]; // the songs of the artist
}

export interface Artist {
  _id: string; // unique id of the artist
  name: string; // the name of the artist
  displayName: string; // title of the artist to be displayed in the client
  albums: string[]; // the ids of the albums of the artist
  songs: string[]; // the ids of the songs of the artist
  silverAlbums: number; // how many silver rated albums this artist has
  goldAlbums: number; // how many gold rated albums this artist has
  totalSongs: number; // how many songs this artist has
  totalScore: number; // the total score for this artist
}

export interface ArtistFull extends Omit<Artist, 'albums' | 'songs'> {
  albums: Album[]; // the albums of the artist
  songs: Song[]; // the songs of the artist
}

export interface Year {
  year: number;
  songs: number;
  goldAlbums: number;
  silverAlbums: number;
  totalScore: number;
}

export interface SortedYear {
  byYear: Year[];
  byTotalScore: Year[];
  byGoldAlbums: Year[];
  bySilverAlbums: Year[];
  bySongs: Year[];
}
