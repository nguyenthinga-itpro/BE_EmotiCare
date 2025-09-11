const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Cache token và thời gian hết hạn
let tokenExpiresAt = 0;

async function ensureAccessToken() {
  const now = Date.now();
  if (!spotifyApi.getAccessToken() || now >= tokenExpiresAt) {
    try {
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body["access_token"]);
      tokenExpiresAt = now + data.body["expires_in"] * 1000 - 60000; // trừ 1 phút buffer
      console.log("Spotify access token updated");
    } catch (err) {
      console.error("Spotify token error:", err.message);
      throw err;
    }
  }
}

async function getTrack(trackUrlOrId) {
  try {
    await ensureAccessToken();

    // Tách track ID nếu gửi URL
    const trackId = trackUrlOrId.includes("track/")
      ? trackUrlOrId.split("/track/")[1]?.split("?")[0]
      : trackUrlOrId;

    if (!trackId) return null;

    const data = await spotifyApi.getTrack(trackId);
    return {
      id: data.body.id,
      name: data.body.name,
      artists: data.body.artists.map((a) => a.name),
      album: data.body.album.name,
      preview_url: data.body.preview_url,
      external_url: data.body.external_urls.spotify,
    };
  } catch (err) {
    console.warn(
      "Spotify track fetch failed, fallback lưu link gốc:",
      trackUrlOrId,
      "Error:",
      err.message
    );
    return null; // fallback cho controller
  }
}

module.exports = { getTrack };
