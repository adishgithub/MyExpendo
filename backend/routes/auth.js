// Import required packages
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Import models
const UserLoginList = require('../models/user_login_list');
const { protect } = require('../middleware/auth');

// Register New User API
router.post('/register', async (req, res) => {
    const { username, password, full_name, email, phone } = req.body;
    try {
        // Input validation
        if (!username || !password || !full_name || !email) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await UserLoginList.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Create new user
        const newUser = await UserLoginList.create({
            user_id: uuidv4(),
            username,
            password,
            full_name,
            email,
            phone
        });
        const token = generateToken(newUser._id);

        return res.status(201).json({ success: true, message: 'User registered successfully', user: newUser, token });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred during registration', error: error.message });
    }
});

// Login API
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Input validation
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }
        // Find user
        const user = await UserLoginList.findOne({ username });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        const token = generateToken(user._id);

        return res.status(200).json({ success: true, message: 'User logged in successfully', user: { user_id: user.user_id, username: user.username, full_name: user.full_name, email: user.email, phone: user.phone, createdAt: user.createdAt }, token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred during login', error: error.message });
    }
});

// Get Current User API
router.get('/me', protect, async (req, res) => {
    return res.status(200).json({ success: true, user: req.user });
});

// Generate JWT Token (for future use in protected routes)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// UPDATE USER DETAILS API
router.put('/update', async (req, res) => {
    const { username, full_name, email, phone, _id } = req.body;
    try {
        // user and email uniqueness checks
        if (username || email) {
            const existingUser = await UserLoginList.findOne({ username, email, _id: { $ne: _id } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Username or email already exists' });
            }
        }
        // Update user details
        const updatedUser = await UserLoginList.findByIdAndUpdate(
            _id,
            { username, full_name, email, phone },
            { returnDocument: 'after', runValidators: true }
        );
        return res.status(200).json({ success: true, message: 'User details updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred during user update', error: error.message });
    }
});

module.exports = router;