import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Client
const client = new MongoClient(process.env.MONGO_DB_URI!, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Database
const db = client.db("EventSphere");

// Collections
const usersCollection = db.collection("users");
const eventsCollection = db.collection("events");

// MongoDB Connect
async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error(error);
  }
}

connectDB();

// Test Route
app.get("/", (req, res) => {
  res.send("Server Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const user = await usersCollection.findOne({ email });

  if (user) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await usersCollection.insertOne({
    name,
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    message: "User Registered Successfully",
    result,
  });
});