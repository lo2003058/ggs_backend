const jwt = require('jsonwebtoken');

// Replace 'your-secret-key' with your actual secret key
const SECRET_KEY = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Check if Authorization header is present
  if (!authHeader) {
    return res.status(403).json({message: 'No token provided.'});
  }

  // The header should be in the format 'Bearer TOKEN'
  const tokenParts = authHeader.split(' ');

  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(403).json({message: 'Invalid token format.'});
  }

  const token = tokenParts[1];

  // Verify the token
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      // console.error('Token verification failed:', err);
      return res.status(403).json({message: 'Invalid or expired token.'});
    }

    // Attach user information to the request
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
