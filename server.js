const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose=require('mongoose');

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));

const mySecret=process.env.MONGO_DB;
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const {Schema}=mongoose;

const exerciseSchema= new Schema({
  
});

const userSchema= new Schema({
  username:String,
  log: [{
    description:{
      type:String,
      required:true
    },
    duration:{
      type:Number,
      required:true
    },
    date:{
      type:Date
    }
  }]
});

// const Exercise= mongoose.model('Exercise',exerciseSchema);
const User= mongoose.model('User',userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users",async(req,res) =>  {
const username= req.body.username;
const user= new User(req.body);
try  {
  await user.save();
  res.send({user});
}catch(e)  {
  res.send({e});
}
console.log(username);
});

app.get("/api/users",(req,res) =>  {
  User.find({},(err,user) =>  {
    try  {
      res.send(user);
    }catch(e)  {
      res.send();
    }
  });
});

app.post("/api/users/:_id/exercises",async(req,res) =>  {
  if (!req.body.date)  {  //if date is null
    console.log('null!');
    req.body.date= new Date();  //set the date to a new date
  }
  User.findById(req.params._id,async(err,user) =>  {
    console.log(user);
    console.log(req.body);
    try {
    await user.log.push(req.body);
    console.log(user);
    user.save();
    res.send({user});
    }catch(e)  {
      res.send({e});
    }
  });
});

app.get("/api/users/:_id/logs",(req,res) =>  {
  if (!req.query.from&&!req.query.to&&!req.query.limit)  {
    User.findById(req.params._id,async(err,user) =>  {
      res.send({user,count:user.log.length});
    });
  }else{
    const from=req.query.from;
    const to=req.query.to;
    const limit=req.query.limit;
    console.log("from: "+from);
    console.log("to: "+to);
    console.log("limit: "+limit);
    User.findById(req.params._id,async(err,user) =>  {
      const filterArray= user.log.filter(date => date>from);
      console.log("filtered array: "+filterArray);
      function filterPop()  {
        if (filterArray.length>limit)  {
          filterArray.pop();
          return filterPop();
        }
      }
      filterPop();
      console.log("post limit filtered array: "+filterArray);
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
