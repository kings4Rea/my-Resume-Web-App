 require('dotenv').config();
const express = require("express");
const  bodyParser = require("body-parser");
const cookieParser =require("cookie-parser");
const ejs = require("ejs");
const path = require("path");
const request = require("request");
const https = require("https");
const mongoose = require("mongoose");
const session = require("express-session");
const  passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const favicon = require("express-favicon");
const  homeStartingContent = "To work in a firm with a professional work driven environment where I can utilize and apply my extensive knowledge, skills which would enable me support in fulfilling organizational goals. I'm flexible person who likes to take initiative and seek out new challenge. My ability to communicate effectively helps in resolving issues and improving relationships between the organization and its clients, team members. with a background knowledge in Full-Stack Development and  Information Technology(IT), coupled with my passion for service and delivery excellence, I am confident I will be able to perform my tasks efficiently & accurately. Looking forward to a career growth oriented position."

const dataBasePage  = " Database Management System (DBMS) is software for storing and retrieving users’ data while considering appropriate security measures. It consists of a group of programs that manipulate the database. The DBMS accepts the request for data from an application and instructs the operating system to provide the specific data. In large systems, a DBMS helps users and other third-party software store and retrieve data. Database management systems are important because they provides programmers, database administrators and end users with a centralized view of data and free applications and end users from having to understand where data is physically located. APIs (application program interfaces) handle requests and responses for specific types of data over the internet. Relational and non-relational DBMS components delivered over the internet may be referred to as DBaaS (database as a service) in marketing materials. According to the research firm Gartner, database management systems designed to support distributed data in the cloud currently account for half of the total DBMS market.";

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public"));
app.use('/favicon.ico', express.static('public/favicon/favicon.ico'));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser("secret"));
app.use(session({cookie:{maxAge:null}}));


app.use(session({
  secret: "My little tittled secret",
  resave: false,
  saveUninitialized: false
}));
 app.use(passport.initialize());
 app.use(passport.session());

mongoose.set("strictQuery", true);
mongoose.connect("mongodb+srv://Admin-Kingsley:kingsley4Real*@cluster0.wbfbliz.mongodb.net/publicationDB");


const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User =  new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
  done(null, user.id);
});
passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret:  process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/My-Resume-Website",
    userProfileUrl:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new LinkedInStrategy({
 clientID: process.env.LINKEDIN_ID,
 clientSecret: process.env.LINKEDIN_SECRET,
 callbackURL: "https://localhost:3000/linkedin/My-Resume-Website",
 scope: ['r_emailaddress', 'r_liteprofile'],
}, function(accessToken, refreshToken, profile, done) {
  process.env.accessToken,
 // asynchronous verification, for effect...
 process.nextTick(function () {
   // To keep the example simple, the user's LinkedIn profile is returned to
   // represent the logged-in user. In a typical application, you would want
   // to associate the LinkedIn account with a user record in your database,
   // and return that user instead.
   return done(null, profile);
 });
}));

app.get('/auth/linkedin', passport.authenticate('linkedin', {
  scope: ['r_emailaddress', 'r_liteprofile'],
}));


  app.get('/auth/linkedin/My-Resume-Website',
  passport.authenticate('linkedin', {
    successRedirect: '/profile',
    failureRedirect: '/login'
  }));

app.get("/", function(req, res){
  res.render("home", {homeStartingContent});

});


app.get("/auth/google",
  passport.authenticate("google", {scope:["profile"]})
);



app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});


app.get("/secret", function(req, res){
  if(req.isAuthenticated()){
    res.render("secret");
  }else{
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res){
 req.logout(function(err){
   if(err){
     console.log(err);
   }else{
     res.render("logout");
   }

 });

});

app.get("/auth/google/My-Resume-Website",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('secret');
  });
  app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.render("success");
    }else{
      passport.authenticate("local")(req, res, function(){

      });
    }
  });
  });

app.get("/logout", function(req, res){
  res.redirect("/");
});


app.post("/login", function(req, res){
 const user = new User({
   username:req.body.username,
   password:req.body.password
 });
  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.render("secret");
      });
    }
  });

});

const postSchema = {
  title: String,
  content: String
};
const Post = mongoose.model("Post", postSchema)

app.get("/databasemanagementsystemdomainforyou", function(req, res){
  Post.find({}, function(err, posts){
    res.render("publish", {openContent: dataBasePage,
    posts:posts
    });
  });

});

app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){
  const post = new Post({
    title:req.body.postTitle,
    content:req.body.postBody
  });
  post.save(function(err){
    if(!err){
        res.redirect("/databasemanagementsystemdomainforyou");
    }
  });

});
app.get("/posts/:postId", function(req, res){
 const requestedPostId = req.params.postId;
 Post.findOne({_id: requestedPostId}, function(err, post){
   res.render("post", {
     title: post.title,
     content: post.content
});
});
});


app.get("/success.ejs", function(req, res){
  res.render("success");
});

app.get("/failure.ejs", function(req, res){
res.render("failure");
});

app.get("/cv", function(req, res){
  res.render("resume");
});

app.get("/",function(req, res){
});


app.post("/failure", function(req, res){
 res.redirect("login");
});


app.get("/about", function(req, res){
  res.render("about.ejs");
});

app.post("/about", function(req, res){
  const query = req.body.cityName;
  const apiKey = process.env.APIKEY;
  const unit = "metric#";
  const url = "https://api.openweathermap.org/data/2.5/weather?q=" + query + "&appid=" + apiKey + "&units=" + unit;

  https.get(url, function(response){
  console.log(response.statusCode);
  response.on("data", function(data){
  const weatherData =  JSON.parse(data);
  const temp = weatherData.main.temp
  const weatherDescription = weatherData.weather[0].description
  const icon = weatherData.weather[0].icon
  const imageURL= "http://openweathermap.org/img/wn/"  + icon  + "@2x.png"
   res.write("<p>The weather is currently " + weatherDescription + "</p>");
  res.write("<h1>The temperature in "+ query +" is " + temp + "degrees celcius.</h1>");
  res.write("<image src=" + imageURL  + ">");
  res.send();
});
});

});

app.get("/contact", function(req,res){
  res.render("contact.ejs");
});


   app.listen(process.env.PORT || 3000,()=>{
  console.log("Server is running on port 3000");
});
