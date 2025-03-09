// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const Instance = require('../models/instance.model')


// Middleware to verify JWT token
const authenticateInstance = async (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  const instanceFound = await Instance.findOne({instance_id: token})
  if(! instanceFound) return res.status(403).json({message: 'Invalid InstanceID'})
  
  req.user = instanceFound;
  next();
};

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Bearer Token
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authenticateInstance,
  authenticateToken
};
