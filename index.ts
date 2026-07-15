import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

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

const db = client.db("EventSphere");

const usersCollection = db.collection("users");
const eventsCollection = db.collection("events");
const bookingsCollection = db.collection("bookings");

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

app.post("/events", async (req, res) => {
  try {
    const result = await eventsCollection.insertOne(req.body);

    res.status(201).json({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add event",
    });
  }
});

app.get("/events", async (req, res) => {
  try {
    const events = await eventsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
});

app.get("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const event = await eventsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

app.get("/manage", async (req, res) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const events = await eventsCollection
      .find({
        "createdBy.email": email,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
});

app.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await eventsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
});

app.post("/bookings", async (req, res) => {
  try {
    const bookingData = req.body;

    const totalPrice = bookingData.tickets * bookingData.price;

    const booking = {
      ...bookingData,
      totalPrice,
      bookedAt: new Date(),
    };

    const result = await bookingsCollection.insertOne(booking);

    res.send({
      success: true,
      message: "Ticket booked successfully",
      data: result,
    });

  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      message: "Failed to book ticket",
    });
  }
});

app.get("/bookings", async (req, res) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const bookings = await bookingsCollection
      .find({ email })
      .sort({ bookedAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
});

app.delete("/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await bookingsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
    });
  }
});