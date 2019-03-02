// jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const findOrCreate = require("mongoose-findorcreate");




const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/messageUserDB",{useNewUrlParser:true});
mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema({
  fitstName:String,
  lastName:String,
  username:String,
  password:String,
  googleId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);


passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/message",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {

  User.findOrCreate({
    googleId: profile.id
  }, function(err, user) {
    return cb(err, user);
  });
}
));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/message"
},

function(accessToken, refreshToken, profile, cb){
  User.findOrCreate({
    facebookId: profile.id
  }, function(err, user){
    return cb(err, user);
  });
})
);

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/github/message"
},
function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

app.get("/",function(req,res){

  res.render("home");

});

app.get("/auth/google", passport.authenticate("google", {scope:["profile"]}));

app.get("/auth/google/message", passport.authenticate("google", {failureRedirect: "/login"}),function(req,res){

  res.redirect("/");
});

app.get("/auth/github", passport.authenticate("github", {scope:['user:email']}));

app.get("/auth/github/message", passport.authenticate("github", {failureRedirect: "/login"}),function(req,res){
  res.redirect("/");
});

app.get("/auth/facebook",
  passport.authenticate('facebook'));

app.get("/auth/facebook/message", passport.authenticate("facebook", {failureRedirect: "/login"}),function(req,res){
  res.redirect("/");
});

app.get("/login",function(req,res){
  res.render("login");
});


app.get("/register", function(req,res){
  res.render("register_test");
});


app.post("/register", function(req,res){

  User.register({username:req.body.username}, req.body.password,function(err,user){

    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("message");
      });
    }
  });
});

app.get("/message",function(req,res){
  if(req.isAuthenticated){
    res.render("message");
  }else{
    res.redirect("/login");
  }
});


app.post("/login",function(req,res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("message");
      });
    }
  });

});

app.get("/logout",function(req,res){

  req.logout();
  res.redirect("/");
});

app.listen(3000,function(err){
  if(err){
    console.log(err);
  }else{
    console.log("Server has started on port 3000!");
  }
});
