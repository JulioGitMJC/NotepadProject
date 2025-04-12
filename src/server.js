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
console.log("S3 Bucket Loaded:", process.env.AWS_S3_BUCKET);
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "client", "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

/* SIGNUP */
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log("Signup request:", req.body);

    if (!username || !email || !password) {
      console.warn("Signup failed: Missing fields");
      return res.status(400).json({ error: "all fields are needed to pass" });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `users/${email}.json`
    };

    try {
      await s3.headObject(params).promise();
      console.warn("Signup failed: Email already exists");
      return res.status(400).json({ error: "email already exists" });
    } catch (err) {
      console.log("Email does not exist, proceeding to create user.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { username, email, password: hashedPassword };
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `users/${email}.json`,
      Body: JSON.stringify(user)
    };

    if (!uploadParams.Bucket) {
      console.error("Upload failed: AWS_S3_BUCKET is undefined");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    console.log("Uploading user to bucket:", uploadParams.Bucket);
    await s3.upload(uploadParams).promise();
    console.log("User created and uploaded to S3:", email);
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "error creating the user" });
  }
});

/* LOGIN */
app.post("/api/login", async (req, res) => {
  try {
    console.log("Login request received");
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    if (!email || !password) {
      console.warn("Login failed: Missing email or password");
      return res.status(400).json({ error: "Email and password required" });
    }

    const s3Key = `users/${email}.json`;
    console.log("Fetching user from S3:", s3Key);

    const userData = await s3.getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    }).promise();

    console.log("User data retrieved from S3");

    let user;
    try {
      user = JSON.parse(userData.Body.toString());
    } catch (parseErr) {
      console.error("Failed to parse user JSON:", parseErr);
      return res.status(500).json({ error: "User data corrupted" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.warn("Login failed: Incorrect password");
      return res.status(400).json({ error: "you shall not pass" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not set in .env");
      return res.status(500).json({ error: "JWT secret not configured" });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    console.log("JWT token issued for:", email);
    res.json({ token, username: user.username });
  } catch (error) {
    if (error.code === "NoSuchKey") {
      console.warn("Login failed: Email not found in S3");
      return res.status(400).json({ error: "wrong password or email" });
    }
    console.error("Login Error:", error);
    res.status(500).json({ error: "wrong password or email" });
  }
});

/* GET USER INFO */
app.get("/api/user", verifyToken, async (req, res) => {
  try {
    const userKey = `users/${req.user.email}.json`;
    console.log("Fetching user info for:", userKey);

    const userData = await s3.getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: userKey
    }).promise();

    const user = JSON.parse(userData.Body.toString());
    console.log("User info retrieved:", user.email);
    res.json({ username: user.username, email: user.email });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "error fetching user data from dark web" });
  }
});

/* GET NOTES */
app.get("/api/notes", verifyToken, async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.warn("Unauthorized notes access attempt");
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const key = `users/${decoded.email}/notes.json`;

    console.log("Fetching notes for:", decoded.email);
    const notesData = await s3.getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    }).promise();

    const notes = JSON.parse(notesData.Body.toString());
    console.log("Notes retrieved");
    res.json({ notes });
  } catch (error) {
    if (error.code === "NoSuchKey") {
      console.log("No notes found for user, returning empty array");
      return res.json({ notes: [] });
    }

    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Error fetching notes" });
  }
});

/* SAVE NOTES */
app.post("/api/notes", verifyToken, async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.warn("Unauthorized note save attempt");
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const notes = req.body.notes;
    const notesString = JSON.stringify(notes);

    console.log("Saving notes for:", decoded.email);
    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `users/${decoded.email}/notes.json`,
      Body: notesString,
      ContentType: "application/json"
    }).promise();

    console.log("Notes saved successfully for:", decoded.email);
    res.json({ message: "Notes saved successfully" });
  } catch (error) {
    console.error("Error saving notes:", error);
    res.status(500).json({ error: "Error saving notes" });
  }
});

/* START SERVER */
app.listen(80, () => console.log("Server running on port 80"));
