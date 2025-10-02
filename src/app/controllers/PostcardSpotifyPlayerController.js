// const SpotifyWebApi = require("spotify-web-api-node");
// require("dotenv").config();

// const spotifyApi = new SpotifyWebApi({
//   clientId: process.env.SPOTIFY_CLIENT_ID,
//   clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
//   redirectUri: process.env.SPOTIFY_REDIRECT_URI,
// });

// // Redirect user to Spotify login
// const login = (req, res) => {
//   const scopes = [
//     "streaming",
//     "user-read-email",
//     "user-read-private",
//     "user-modify-playback-state",
//     "user-read-playback-state",
//     "user-read-currently-playing",
//   ];

//   const authURL = spotifyApi.createAuthorizeURL(scopes, "state123");
//   res.redirect(authURL);
// };

// // Callback Spotify: exchange code → redirect frontend với token
// const callback = async (req, res) => {
//   const { code, error } = req.query;
//   if (error) return res.status(400).send("Spotify auth error");

//   try {
//     const data = await spotifyApi.authorizationCodeGrant(code);
//     const { access_token, refresh_token, expires_in } = data.body;

//     // Redirect frontend với token query params
//     // spotifyController.js
//     // spotifyController.js
//     res.redirect(
//       `${process.env.FRONTEND_URL.replace(
//         /\/$/,
//         ""
//       )}/user/postcards?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`
//     );
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Callback error");
//   }
// };

// // Refresh token
// const refreshToken = async (req, res) => {
//   const { refreshToken } = req.body;
//   if (!refreshToken)
//     return res.status(400).json({ error: "Missing refreshToken" });

//   try {
//     spotifyApi.setRefreshToken(refreshToken);
//     const data = await spotifyApi.refreshAccessToken();
//     res.json({
//       access_token: data.body.access_token,
//       expires_in: data.body.expires_in,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

// module.exports = { login, callback, refreshToken };
