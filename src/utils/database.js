const mongoose = require('mongoose');

class Database {
    async connect() {
        try {
            await mongoose.connect("mongodb://127.0.0.1:27017/Dashboard", {
                // These options help avoid deprecation warnings
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log("MongoDB connected successfully");
        } catch (error) {
            console.error("Error connecting to MongoDB:", error);
            throw error;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            console.log("MongoDB disconnected");
        } catch (error) {
            console.error("Error disconnecting from MongoDB:", error);
        }
    }
}

module.exports = new Database();