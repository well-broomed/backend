const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');


/**
 * Any route that runs through this middleware will extract the JWT from the
 * Authorization header and pass it to the auth0 signature confirmation endpoint
 * located in 'jwksUri'. If the signature is valid, the token will be decoded
 * and its profile object will be stored as an object accessible from 'req.user'
 * within the endpoint route methods.
 * 
 */

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),

    audience: `${process.env.AUTH0_CLIENT_ID}`,
    issuer: `https://${process.env.AUTH0_DOMAIN}`,
    algorithms: ['RS256']
});

module.exports = checkJwt;