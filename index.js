const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("summer Camp Server is running");
});

app.listen(port, () => {
  console.log(`This server is running on Port:${port}`);
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.llfgq6f.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    // DataCollections
    const allUserCollection = client.db("inkwell").collection("allusers");
    const ClassesCollection = client.db("inkwell").collection("classes");
    const selectedClassesCollection = client.db("inkwell").collection("selectedClasses");

    // --------------------------------
    // Add a class
    // --------------------------------
    app.post("/addClass", async(req,res) => {
      const classObj = req.body;
      const result = await ClassesCollection.insertOne(classObj);
      res.send(result)
    })

    // --------------------------------
    // Selected Data post
    // --------------------------------
    app.post("/selectedClass", async(req,res) => {
      const selectedClass = req.body;
      const result = await selectedClassesCollection.insertOne(selectedClass);
      res.send(result)
    })
    // --------------------------------
    // Selected Data get
    // --------------------------------
    app.get("/selectedClass", async(req,res) => {
      const result = await selectedClassesCollection.find().toArray();
      res.send(result)
    })
    // create payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price*100
    
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card']
        
      });
    
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // --------------------------------
    // Approve a class
    // --------------------------------
    app.patch("/classes/approve/:id", async(req,res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await ClassesCollection.updateOne(filter, updatedoc);
      res.send(result);
    })
    // --------------------------------
    // Show approved classes
    // --------------------------------
    app.get("/approvedClasses", async(req,res) => {
      const query = { status : "approved" };
      const result = await ClassesCollection.find(query).toArray();
      res.send(result)
    })
    // --------------------------------
    // Deny a class
    // --------------------------------
    app.patch("/classes/deny/:id", async(req,res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedoc = {
        $set: {
          status: "denied",
        },
      };
      const result = await ClassesCollection.updateOne(filter, updatedoc);
      res.send(result);
    })
    // --------------------------------
    // Add review to class
    // --------------------------------
    app.patch("/classes/review/:id", async(req,res) => {
      const id = req.params.id;
      const data = req.body;
      console.log(data)
      const filter = { _id: new ObjectId(id) };
      const updatedoc = {
        $set: data,
      };
      const result = await ClassesCollection.updateOne(filter, updatedoc);
      res.send(result);
    })
    // --------------------------------
    // Get all classes Data 
    // --------------------------------
    app.get("/classes", async(req,res) => {
      const result = await ClassesCollection.find().toArray();
      res.send(result)
    })
    // ----------------------------------------------------------------
    // store sign Up and social login data to get the count of students
    // ----------------------------------------------------------------
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await allUserCollection.findOne(query);
      if (existingUser) {
        return res.send((message = "user already exists"));
      }
      const result = await allUserCollection.insertOne(user);
      res.send(result);
    });

    // --------------------------------
    // get all Data of users
    // --------------------------------
    app.get("/users", async (req, res) => {
      const result = await allUserCollection.find().toArray();
      res.send(result);
    });
    
    // --------------------------------
    // make admin here
    // --------------------------------
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await allUserCollection.updateOne(filter, updatedoc);
      res.send(result);
    });

    // --------------------------------
    // make instructor here
    // --------------------------------
    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await allUserCollection.updateOne(filter, updatedoc);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
