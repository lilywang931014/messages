// jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/messageUserDB",{useNewUrlParser:true});

const userSchema = new mongoose.Schema({
  username:String,
  password:String
});

const secret = process.env.SECRET;



const User = new mongoose.model("User", userSchema);


app.get("/",function(req,res){

  res.render("home");

});

app.get("/login",function(req,res){
  res.render("login");
});


app.get("/register", function(req,res){
  res.render("register");
});


app.post("/register", function(req,res){

  const newUser = new User({
    username: req.body.username,

    //hash the password
    password: md5(req.body.password)
  });

  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("message");
    }
  });


});

app.post("/login",function(req,res){

  const username = req.body.username;

  //hash the pass word
  const password = md5(req.body.password);

  User.findOne({username: username}, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(password === foundUser.password){
        res.render("message");
      }
    }
  });
});




app.listen(3000,function(err){
  if(err){
    console.log(err);
  }else{
    console.log("Server has started on port 3000!");
  }
});
