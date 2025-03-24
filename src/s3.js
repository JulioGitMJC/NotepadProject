import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AKIA5FCD6AAA6JJPBZYM,
  secretAccessKey: process.env.PvKsr5W7tml+TBYcFuVWTtOyWW3MEJlWZBmITBkE,
  region: process.env.us-east-1
});

export default s3;
