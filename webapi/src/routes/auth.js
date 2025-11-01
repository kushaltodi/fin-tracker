const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

const router = express.Router();

// Register a new user
router.post('/register', validateUserRegistration, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await db('users')
      .where('email', email)
      .orWhere('username', username)
      .whereNull('deleted_at')
      .first();
    
    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const [userId] = await db('users').insert({
      username,
      email,
      password_hash: hashedPassword
    });

    // Copy default categories for the new user
    const defaultCategories = await db('categories').whereNull('user_id').whereNull('deleted_at');
    const userCategories = defaultCategories.map(category => ({
      user_id: userId,
      category_name: category.category_name,
      category_type: category.category_type
    }));
    
    if (userCategories.length > 0) {
      await db('categories').insert(userCategories);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId, email, username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        user_id: userId,
        username,
        email
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Debug logging
    console.log('Login attempt:', { email, password: '***' });
    
    // Find user by email (only active users)
    const user = await db('users')
      .where('email', email)
      .whereNull('deleted_at')
      .first();
      
    console.log('User found:', user ? { user_id: user.user_id, email: user.email, username: user.username } : 'No user found');
      
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
});

// Debug endpoint to check existing users (remove in production)
router.get('/debug/users', async (req, res, next) => {
  try {
    const users = await db('users')
      .select('user_id', 'username', 'email', 'created_at')
      .whereNull('deleted_at');
    
    res.json({
      message: 'Users in database',
      users: users
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;