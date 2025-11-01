const jwt = require('jsonwebtoken');
const db = require('../database/connection');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is not soft deleted
    const user = await db('users')
      .where('user_id', decoded.userId)
      .whereNull('deleted_at')
      .first();
      
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = { 
      user_id: decoded.userId, 
      email: decoded.email, 
      username: decoded.username 
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };