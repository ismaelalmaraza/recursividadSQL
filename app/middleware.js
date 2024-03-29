var express = require('express'),
    jwt = require('jsonwebtoken'),
    config = require('../config'),
    app = express();

/********************************************************************** */
/*                   Middleware para verificar Token                    */
/********************************************************************** */
function middlewareAuthorizationProvider(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, config.secret, function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
}

module.exports = middlewareAuthorizationProvider;