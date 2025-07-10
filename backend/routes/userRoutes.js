const express = require('express');
const router = express.Router();
const { registerUser, getUsers, getUserById } = require('../controllers/userController');

// Route: /api/users
router.route('/')
  .get(getUsers);

// Route: /api/users/register
router.route('/register')
  .post(registerUser);

// Route: /api/users/:id
router.route('/:id')
  .get(getUserById);

module.exports = router; 