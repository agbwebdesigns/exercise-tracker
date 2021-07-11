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
  description:{
    type:String,
    required:true
  },
  duration:{
    type:Number,
    required:true
  },
  date:{
    type:String
  }
});

const userSchema= new Schema({
  username:String,
  log: [exerciseSchema]
});

const Exercise= mongoose.model('Exercise',exerciseSchema);
const User= mongoose.model('User',userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users",async(req,res) =>  {
// const username= req.body.username;
const user= new User(req.body);
const {username,_id}=user;
console.log(username+", "+_id)
try  {
  await user.save();
  res.send({username,_id});
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
    const newDayString= new Date().toISOString().substring(0,10);  //set the date to a new date
    req.body.date=newDayString;
  }else{
    const newDayString= new Date(req.body.date).toISOString().substring(0,10);
    req.body.date=newDayString;
  }
  const exercises= new Exercise(req.body);
  console.log(exercises);
  User.findByIdAndUpdate(req.params._id,{
    $push:{
      log:exercises,
      $position:0
    }
  },{new:true,useFindAndModify: false},async(err,user) =>  {
    try {
      console.log(user);
      const {username,_id}=user;
      const {description,duration,date}=user.log[user.log.length-1];
      const modDate= new Date(date).toDateString();
      await user.save();
      res.send({_id,username,date:modDate,description,duration});
    }catch(e)  {
      res.send({e});
    }
  });
});

app.get("/api/users/:_id/logs",(req,res) =>  {
  if (!req.query.from&&!req.query.to&&!req.query.limit)  {
    User.findById(req.params._id,async(err,user) =>  {
      const {username,_id}=user;
      res.send({username,_id,log:user.log,count:user.log.length});
    });
  }else{
    User.findById(req.params._id,async(err,user) =>  {
      let from="";
      let to="";
      let finalFilter="";
      if (req.query.from===undefined&&req.query.to===undefined)  {
        console.log("no from or to");
        finalFilter=user.log;
      }else{
        console.log("pre date from: "+req.query.from);
        console.log("pre date to: "+req.query.to);
        from=new Date(req.query.from);
        from=from.getTime();
        console.log("from: "+from);
        to=new Date(req.query.to);
        to=to.getTime();
        console.log("to: "+to);
          finalFilter= user.log.filter((date) => {
          let exDate=new Date(date.date).getTime();
          return exDate>=from&&exDate<=to;
        });
        console.log("first filtered array: "+finalFilter);
        console.log("filtered array length: "+finalFilter.length);
      }
      const limit=parseInt(req.query.limit);
      console.log("limit: "+limit);
      console.log("req.params._id: "+req.params._id);
      function filterPop(limit)  {
        if (finalFilter.length>limit)  {
          finalFilter.pop();
          return filterPop();
        }else{
          return finalFilter;
        }
      }
      let reallyTheLastFilter="";
      const {username,_id}=user;
      if (isNaN(limit)===true)  {
        reallyTheLastFilter=finalFilter;
        console.log("NaN final filter: "+finalFilter);
        res.send({username,_id,log:finalFilter});
      }else{
        reallyTheLastFilter= filterPop(limit);
        console.log("non-NaN final filter: "+reallyTheLastFilter);
        res.send({username,_id,log:reallyTheLastFilter});
      }
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
