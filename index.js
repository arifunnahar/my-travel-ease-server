const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB credentials
const DB = process.env.DB_USERNAME;
const PASS = process.env.DB_PASSWORD;

// MongoDB URI
const uri = `mongodb+srv://${DB}:${PASS}@cluster0.7eiaaun.mongodb.net/travelease_db?retryWrites=true&w=majority&tls=true`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('TravelEase server is running!');
});




async function run() {
    try {
        // await client.connect();
       

        const db = client.db("travelease_db");
        const productCollection = db.collection("products");
        const bookingsCollection = db.collection("bookings");

        // -------- Test Route ------------------------------
        app.get('/test', async (req, res) => {
            const count = await productCollection.countDocuments();
            res.json({ message: "DB Connected!", count });
        });

        // ---------------- Products Routes -----------------------------------

        // Get all products
        app.get('/products', async (req, res) => {
            try {
                const products = await productCollection.find().toArray();
                res.json(products);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // Get single product by id---
        app.get('/products/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const query = { _id: new ObjectId(id) };
                const product = await productCollection.findOne(query);
                if (!product) return res.status(404).json({ error: "Product not found" });
                res.json(product);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

      
         // Add a product---------------------------

       app.post('/products', async (req, res) => {
        try {
            const product = req.body;
            product.createdAt = new Date(); 

            const data = await productCollection.insertOne(product);
            res.status(201).json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
       });
        

        // Latest 6 products here----------------------------
        
            app.get('/products/latest', async (req, res) => {
            try {
                const latestProducts = await productCollection
                .find({})
                .sort({ createdAt: -1 })
                .limit(6)
                .toArray();

                res.status(200).json(latestProducts);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
            });


        //-------- UPDATE Form product----------------------------------------------------
        app.put('/products/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const updatedData = req.body;

                console.log("PUT /products/:id → ID:", id);
                console.log(" Update Data:", updatedData);

                if (!id) return res.status(400).json({ error: "Product ID required" });

                const filter = { _id: new ObjectId(id) };
                const updateDoc = { $set: updatedData };

                const result = await productCollection.findOneAndUpdate(
                    filter,
                    updateDoc,
                    { returnDocument: 'after' }
                );

                console.log(" Update Result:", result);

                if (!result) {
                    return res.status(404).json({ error: "Product not found" });
                }

                res.json(result); 
            } catch (err) {
                console.error(" Update Error:", err.message);
                res.status(500).json({ error: err.message });
            }
        });

        // Delete a product
        app.delete('/products/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const query = { _id: new ObjectId(id) };
                const data = await productCollection.deleteOne(query);
                if (data.deletedCount === 0) {
                    return res.status(404).json({ error: "Product not found" });
                }
                res.json({ message: "Product deleted successfully" });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // --------------------- Bookings Routes -----------------------------------

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

        // Add booking
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
            console.log(` Server running on port ${port}`);
        });

    } catch (err) {
        console.error(" Connection Failed:", err.message);
    }
}

run().catch(console.dir);