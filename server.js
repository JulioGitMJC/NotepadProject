import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import s3 from "./s3.js"; // Import S3 configuration

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Signup Route (Store User in S3)
app.post("/api/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const params = { Bucket: process.env.AWS_S3_BUCKET, Key: `users/${email}.json` };
        try {
            await s3.headObject(params).promise();
            return res.status(400).json({ error: "Email already in use" });
        } catch (err) {} // If file doesn't exist, continue

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user data JSON
        const userData = { username, email, password: hashedPassword };

        // Upload user data to S3
        await s3.upload({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `users/${email}.json`,
            Body: JSON.stringify(userData),
            ContentType: "application/json"
        }).promise();

        res.json({ message: "User created successfully" });

    } catch (error) {
        res.status(500).json({ error: "Error creating user" });
    }
});

// 🔹 Login Route (Retrieve User from S3)
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user data from S3
        const userData = await s3.getObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `users/${email}.json`
        }).promise();

        const user = JSON.parse(userData.Body.toString());

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // Generate JWT token
        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, username: user.username });

    } catch (error) {
        res.status(500).json({ error: "Error logging in" });
    }
});

// 🔹 Get User Info (Protected Route)
app.get("/api/user", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user data from S3
        const userData = await s3.getObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `users/${decoded.email}.json`
        }).promise();

        const user = JSON.parse(userData.Body.toString());
        res.json({ username: user.username, email: user.email });

    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});

// 🔹 Start the Server
app.listen(5000, () => console.log("Server running on port 5000"));
