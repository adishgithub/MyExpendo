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

        const existingEmail = await UserLoginList.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
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
        // ✅ Also add a safety net for any other duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ success: false, message: `${field} already in use` });
        }
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
router.put('/update', protect, async (req, res) => {
    const { username, full_name, email, phone } = req.body;
    const userId = req.user._id; // ✅ trusted source, not req.body

    try {
        if (username) {
            const existingUsername = await UserLoginList.findOne({
                username,
                _id: { $ne: userId }
            });
            if (existingUsername) {
                return res.status(400).json({ success: false, message: 'Username already taken' });
            }
        }

        if (email) {
            const existingEmail = await UserLoginList.findOne({
                email,
                _id: { $ne: userId }
            });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
        }

        const updatedUser = await UserLoginList.findByIdAndUpdate(
            userId,
            { username, full_name, email, phone },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'User details updated successfully',
            user: updatedUser
        });

    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ success: false, message: `${field} already in use` });
        }
        console.error('Update error:', error);
        return res.status(500).json({ success: false, message: 'Error occurred during user update', error: error.message });
    }
});

// Change Password API
router.put('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }

        const user = await UserLoginList.findById(req.user._id);
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword; // pre-save hook will hash it
        await user.save();

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ success: false, message: 'Error updating password' });
    }
});

module.exports = router;