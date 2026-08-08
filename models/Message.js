const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    username: String,
    message: String,
    time: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires:3600 
    }
});

module.exports = mongoose.model("Message", messageSchema);