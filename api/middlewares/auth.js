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

module.exports = {
  authenticateInstance,
};
