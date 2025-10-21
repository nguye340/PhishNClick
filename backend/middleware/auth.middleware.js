import jwt from 'jsonwebtoken';

// Use JWTs to protect who can even access the API route 
// Reads access token from httpOnly cookie for security (not accessible via JavaScript)
// TODO: Still needs to validate and sanitize all input whether form or URL (URL Injection) by insider/registered user
export const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({message: "No token provided"});
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({message: "Invalid token"});
    }
    req.user = user;
    next();
  });
};

export const verifyRole = (role) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (userRole !== role) {
      return res.status(403).json({message: "Unauthorized"});
    }
    next();
  };
}

export default verifyToken;