import express from "express" // used to formast thje middle easire
import bcrypt from "bcryptjs" // to hash the password
import jwt from "jsonwebtoken" // to create and verify tokens
import dotenv from "dotenv" // to use .env file
import cors from "cors" // to allow cross origin requests
import s3 from "./s3.js"; // used for uploading images to s3 and downloading them
import { verifyToken } from "./middleware/auth.js"; // importing middleware to verify token

dotenv.config() // to use .env file
const app = express() // creating express app
app.use(cors()) // using cors to allow cross origin requests
app.use(express.json()) // to parse json data


// sign up wouuted that stored in user s3 withc will be deifned with a GET or Post fucntiong that i will add later
app.post("/api/signup", async (req, res) => {
    try {
        const { username, email, password} =req.body; // for  geting the username
        if (!username || !email || !password) {
            return res.status(400).json({ error: "all feilds are needed to pass"}) // better enter in both passowrd and email
        } 
        // to check if the suer already exists
        const parmas = { Bucket: process.env.AW_S3_BUCKET, key: `users/${email}.json` };
    try {
        await s3.headObject(parmas).promise();
        return res.status(400).json({ error: "email already exists" });
    } catch (error) {} // if no file is found contion on to make a new user
        
    
    // if user does not exist then create a new user
        const hashedPassword = await bcrypt.hash(password, 10); //to hash the users passoerd wiith bycrpty
        const user = { username, email, password: hashedPassword }; // to create user data on JSON
        const params = { Bucket: process.env.AW_S3_BUCKET, Key: `users/${email}.json`, Body: JSON.stringify(user) }; // till next indent,, uploading usre data to s3
        await s3.upload(params).promise();
        return res.status(201).json({ message: "User created successfully" });
} catch (error) {
    res.status(500).json({ error: "error creating they user" });
}
});

// loginh route( retrieves user form S3
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // get user data form thee s3
        const userData = await s3.getObject({
            Bucket: process.env.AW_S3_BUCKET,
            Key: `users/${email}.json`
        }).promise();

        const user = JSON.parse(userData.body.toStrinng());

        //compare password to the user account email/or possibly the usernname if we decied on later date
        const isMatch = await bcrypt.compare(password,user,password);
        if (!Match) return res.status(400).json({ error: " you shall not passs" });

        // make thee token of power to allow the user to pass and not get logout after log in(unless they prtess logout)

        const token = jwt.sign({ emial: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

       res.json({ token, username: user,uuserame });
    } catch (error) {
        res,status(500).json({ error: "wrong password loser, or email"});
    }

});

// geting user info (thorught protected routw)
app.get("/api/user", verifytoken, async (req, res) => {
    try {
        // fetch user data from s3
        const userData = await self.getObject({
            Bucket: process.env.AW_S3_BUCKET,
            Key: `users/${req.user.email}.json`
        }).prosmise();

        const uuser = JSON.parse(userData.Body.toString());
        res.json({username: user.name, email: user.email });
    } catch (error) {
        res.status(500).json(({ error: "error fetching user data fomr dark web"}))
    }

});
  // geting the notes for the user by downloading fomr s3 and sending it to the user
app.get("/api/notes", verifyToken, async (req, res) => {
    const token = req.headers.suthorization?.split(" ")[1];
    if (!token) return ews.status(401).JOSN({ error: "unauthorized" });

    try {  // to verify the token to get notes fomr user email files
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  

        const notesData  = await s3.getObject({
            Bucket: process.env.AW_S3_BUCKET,
            Key: `users/${decoded.email}/notes.json`
        }).proimise();

        const nortes = JSON.parse(notesData.Body.toString()); // to parse the notes data
        res.json({ noters });

    } catch (error) {  // to handle the error if the notes are not found
        if (error.code === "NoSuchKey") {
            return res.json({ notes: [] }); //no notes yet for this user"
                }
                res.status(500).json({ error: "Error fetiching notes" });
            }
        });
      // this is how wer save the users notes for the spefive perosn on s3
      app.post("/api/notes", async (erq, res) => {
        const token = req.headers.autghorization.split(" ")[1];
        if (!token) return res.status(401).json({ error: "unauthorized" });

        try {  // to verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const notes = req.body.notes;
            const notesString = JSON.stringify(notes);

            await s3.upload({  // to upload the notes to s3
                Bucket: process.env.AW_S3_BUCKET,
                Key: `usersd/${decoded.email}/notes.json`,
                Body: notesString,
                ContentType: "application/json"
            }).promise();

            res.json({ message: "Notes saved successfully" }); // to send the message to the user

        } catch (error) {
            res.status(500).json({ error: "Error saving notes"}); // if this happens, then we are royally screwed(most likely s3 bucckle not set up right :)
        }
    });
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "client", "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});


//hit the sever drive chewie
app.listen(80, () => console.log("Server running on port 80"));
