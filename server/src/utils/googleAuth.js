const { OAuth2Client } = require('google-auth-library');

async function verifyGoogleIdToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const error = new Error('Google sign-in is not configured on the server.');
    error.code = 'GOOGLE_SIGNIN_NOT_CONFIGURED';
    throw error;
  }

  try {
    const ticket = await new OAuth2Client(clientId).verifyIdToken({
      idToken,
      audience: clientId
    });
    const claims = ticket.getPayload();
    if (!claims) throw new Error('Google ID token has no claims.');
    return claims;
  } catch (cause) {
    if (cause.name === 'GaxiosError') throw cause;

    const error = new Error('Google ID token could not be verified.');
    error.code = 'INVALID_GOOGLE_ID_TOKEN';
    throw error;
  }
}

module.exports = { verifyGoogleIdToken };
