import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import s3 from "./s3.js";
import { verifyToken } from "./middleware/auth.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* SIGNUP */
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `users/${email}.json`
    };

    try {
      await s3.headObject(params).promise();
      return res.status(400).json({ error: "Email already exists" });
    } catch (err) {
      // Email does not exist, proceed
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { username, email, password: hashedPassword };

    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `users/${email}.json`,
      Body: JSON.stringify(user),
      ContentType: "application/json"
    }).promise();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Error creating the user" });
  }
});

/* LOGIN */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const userData = await s3.getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `users/${email}.json`
    }).promise();

    let user;
    try {
      user = JSON.parse(userData.Body.toString());
    } catch (parseErr) {
      return res.status(500).json({ error: "User data corrupted" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT secret not configured" });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    res.json({ token, username: user.username });
  } catch (error) {
    if (error.code === "NoSuchKey") {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/* GET USER INFO */
app.get("/api/user", verifyToken, async (req, res) => {
  try {
    const userKey = `users/${req.user.email}.json`;

    const userData = await s3.getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: userKey
    }).promise();

    const user = JSON.parse(userData.Body.toString());
    res.json({ username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ error: "Error fetching user data" });
  }
});

/* GET NOTES */
app.get("/api/notes", verifyToken, async (req, res) => {
  try {
    const key = `users/${req.user.email}/notes.json`;

    const notesData = await s3.getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    }).promise();

    const notes = JSON.parse(notesData.Body.toString());
    res.json({ notes });
  } catch (error) {
    if (error.code === "NoSuchKey") {
      return res.json({ notes: [] });
    }

    res.status(500).json({ error: "Error fetching notes" });
  }
});

/* SAVE NOTES */
app.post("/api/notes", verifyToken, async (req, res) => {
  try {
    const notes = req.body.notes;

    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `users/${req.user.email}/notes.json`,
      Body: JSON.stringify(notes),
      ContentType: "application/json"
    }).promise();

    res.json({ message: "Notes saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error saving notes" });
  }
});

/* Serve Frontend */
app.use(express.static(path.join(__dirname, "client", "build")));
app.get("/*path", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

console.log("Registered routes:");
if (app._router && app._router.stack) {
  app._router.stack
    .filter(r => r.route)
    .forEach(r => console.log(r.route.path));
} else {
  console.log("Router stack not available.");
}

/* START SERVER */
app.listen(80, () => console.log("\u{1F680} Server running on http://localhost:80"));
