const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
    premium: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model("User", userSchema);