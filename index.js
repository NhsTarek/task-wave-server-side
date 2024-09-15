 const express = require('express');
 const app = express();
 const cors = require('cors');
 require('dotenv').config();
 const jwt = require('jsonwebtoken');
 const port = process.env.PORT || 5000;


// middlewares

// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions));



app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1qruita.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const tasksCollection = client.db('taskWaveDB').collection('tasks')
    const usersCollection = client.db('taskWaveDB').collection('users')
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    // JWT related api
    app.post('/jwt', async (req, res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn : '365d'});
      res.send({token})
    })


    // Verify admin middleware
    const verifyAdmin = async (req, res, next) =>{
      const user = req.user;
      const query = {email : user?.email};
      const result = await usersCollection.findOne(query);
      if(!result || result?.role === 'admin') return res.status(401).send({message : 'forbidden access'})


        next()
    }





  //  Save a user data in db


  app.post('/user', async (req, res) =>{
    const user = req.body;
    // Checking if a user already existed
    const query = {email : user?.email};
    const existingUser = await usersCollection.findOne(query);
    if(existingUser){
      return res.send({message : 'user already exist', insertedId : null})
    }

    const result = await usersCollection.insertOne(user);
    res.send(result);
  })


// get a user info with email
app.get('/user/:email', async (req, res) =>{
  const email = req.params.email;
  const result = await usersCollection.findOne({email});
  res.send(result);

})







  // app.put('/user', async (req, res) =>{
  //   const user = req.body;

  //   const options = { upsert: true};
  //   const query = {email: user?.email};
  //   const updateDoc = {
  //     $set : {
  //       ...user,
  //       timestamp : Date.now()
  //     },
  //   }
  //   const result = await usersCollection.updateOne(query, updateDoc, options);
  //   res.send(result);
  //   console.log(result);
  // })


  // Get all users data in db
  app.get('/users', async (req, res) =>{
    const result = await usersCollection.find().toArray();
    res.send(result);
  })


    //  Delete a user
    app.delete('/user/:id', async (req, res) =>{
      const id = req.params.id;
      const query = { _id : new ObjectId(id)};
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })

    // Update user role by ID
app.put('/user/role/:id', async (req, res) => {
  const id = req.params.id;
  const { role } = req.body;

  const query = { _id: new ObjectId(id) };
  const updateDoc = {
      $set: {
          role: role,
      },
  };

  const result = await usersCollection.updateOne(query, updateDoc);
  res.send(result);
});



   // Get all tasks from db
   app.get('/tasks', async (req, res) =>{
    const result = await tasksCollection.find().toArray()
    res.send(result)
   })




  //  Save a task in db
  app.post('/task', async (req, res) =>{
    const taskData = req.body;
    const result = await tasksCollection.insertOne(taskData);
    res.send(result)
  })



  // Get all tasks for taskCreator
  app.get('/my-tasks/:email', async (req, res) =>{
    const email = req.params.email;
    let query = {'taskCreator.creator_email': email}
    const result = await tasksCollection.find(query).toArray()
    res.send(result)
   })



  //  Delete a task
  app.delete('/task/:id', async (req, res) =>{
    const id = req.params.id;
    const query = { _id : new ObjectId(id)};
    const result = await tasksCollection.deleteOne(query);
    res.send(result);
  })




  //  get a single task from db

  app.get('/task/:id', async (req, res) =>{
    const id = req.params.id
    const query = { _id: new ObjectId(id)}
    const result = await tasksCollection.findOne(query)
    res.send(result)
   })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
    res.send('TaskWave is running on');
})

app.listen(port, () =>{
    console.log(`TaskWave is running on port ${port}`);
})