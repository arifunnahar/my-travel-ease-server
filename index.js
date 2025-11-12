const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = "mongodb+srv://traveleaseUser:GMgIAWsHrODFb7XI@cluster0.7eiaaun.mongodb.net/travelease_db?retryWrites=true&w=majority&tls=true";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('TravelEase server is running!');
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db("travelease_db");

        //------ Collections----------------
        const productCollection = db.collection("products");
        const bookingsCollection = db.collection("bookings");

        // --- Test Route ---
        app.get('/test', async (req, res) => {
            const count = await productCollection.countDocuments();
            res.json({ message: "DB Connected!", count });
        });

        // --- Products Routes ---
        app.get('/products', async (req, res) => {
            try {
                const products = await productCollection.find().toArray();
                res.json(products);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.post('/products', async (req, res) => {
            try {
                const product = req.body;
                if (!product.vehicleName || !product.pricePerDay) {
                    return res.status(400).json({ error: "Missing required fields" });
                }
                const result = await productCollection.insertOne(product);
                console.log("Product added:", product);
                res.status(201).json({ _id: result.insertedId, ...product });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // --- Bookings Routes ---
        // Get bookings
        app.get('/bookings', async (req, res) => {
            try {
                const { userEmail } = req.query;
                const query = userEmail ? { userEmail } : {};
                const bookings = await bookingsCollection.find(query).toArray();
                res.json(bookings);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // Add a booking
        app.post('/bookings', async (req, res) => {
            try {
                const booking = req.body;
                if (!booking.vehicleName || !booking.userEmail || !booking.ownerEmail) {
                    return res.status(400).json({ error: "Missing required fields" });
                }
                booking.createdAt = new Date();
                const result = await bookingsCollection.insertOne(booking);
                console.log("Booking added:", booking);
                res.status(201).json({ acknowledged: true, insertedId: result.insertedId });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // Delete a booking
        app.delete('/bookings/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: "Booking not found" });
                }
                console.log("Booking deleted:", id);
                res.json({ message: "Booking deleted successfully" });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // Start server
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });

    } catch (err) {
        console.error("Connection Failed:", err.message);
    }
}

run().catch(console.dir);
