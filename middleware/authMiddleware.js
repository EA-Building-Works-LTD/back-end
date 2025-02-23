const jwt = require("jsonwebtoken");

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("No Authorization header found");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    console.log("Decoded token:", user); // Debug log to inspect token content
    req.user = user;
    next();
  });
  
};

// Middleware to authorize role
const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    console.log("Checking user role:", req.user.role, "Required role:", requiredRole); // Debug log
    if (req.user.role !== requiredRole) {
      console.log("Role mismatch: Access denied");
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
