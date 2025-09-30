const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

let tokenExpiresAt = 0;

async function ensureAccessToken() {
  const now = Date.now();
  if (!spotifyApi.getAccessToken() || now >= tokenExpiresAt) {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    tokenExpiresAt = now + data.body.expires_in * 1000 - 60000;
    console.log("Spotify access token updated");
  }
}

// Parse ID & type từ link
function parseSpotifyUrl(urlOrId) {
  if (!urlOrId) return null;

  if (urlOrId.includes("spotify.com")) {
    const parts = urlOrId.split("/");
    const type = parts[3]; // track | album | playlist | artist
    const id = parts[4]?.split("?")[0];
    return { type, id };
  }

  // fallback: chỉ có id (giả định là track)
  return { type: "track", id: urlOrId };
}

async function getSpotifyData(urlOrId) {
  await ensureAccessToken();

  const parsed = parseSpotifyUrl(urlOrId);
  if (!parsed) return null;

  const { type, id } = parsed;

  let data;
  switch (type) {
    case "track":
      data = await spotifyApi.getTrack(id);
      return {
        id: data.body.id,
        type: "track",
        name: data.body.name,
        artists: data.body.artists.map((a) => a.name),
        album: data.body.album.name,
        preview_url: data.body.preview_url,
        external_url: data.body.external_urls.spotify,
      };

    case "album":
      data = await spotifyApi.getAlbum(id);
      return {
        id: data.body.id,
        type: "album",
        name: data.body.name,
        artists: data.body.artists.map((a) => a.name),
        total_tracks: data.body.total_tracks,
        release_date: data.body.release_date,
        external_url: data.body.external_urls.spotify,
        images: data.body.images,
      };

    case "playlist":
      data = await spotifyApi.getPlaylist(id);
      return {
        id: data.body.id,
        type: "playlist",
        name: data.body.name,
        owner: data.body.owner.display_name,
        total_tracks: data.body.tracks.total,
        external_url: data.body.external_urls.spotify,
        images: data.body.images,
      };

    case "artist":
      data = await spotifyApi.getArtist(id);
      return {
        id: data.body.id,
        type: "artist",
        name: data.body.name,
        genres: data.body.genres,
        followers: data.body.followers.total,
        external_url: data.body.external_urls.spotify,
        images: data.body.images,
      };

    default:
      throw new Error(`Unsupported Spotify type: ${type}`);
  }
}

module.exports = { getSpotifyData };
