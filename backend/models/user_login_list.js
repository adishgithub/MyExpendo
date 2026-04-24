// Import required packages
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userLoginListSchema = new mongoose.Schema(
    {
        user_id: {
            type: String,
            required: true,
            unique: true
        },
        username: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        full_name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        phone: {
            type: String,
            required: false
        }
    },
    { timestamps: true }
);

userLoginListSchema.pre('save', async function() {
    // 'this' refers to the current document being saved
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userLoginListSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const UserLoginList = mongoose.model('user_login_list', userLoginListSchema);

module.exports = UserLoginList;