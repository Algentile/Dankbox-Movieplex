//app.js started by Professor Timothy Richards
// This requires the necessary libraries for the webapp.
// (1) express - this provides the express web framework
// (2) handlebars - this provides the handlebars templating framework
// (2) session - this provides the session framework
var express       = require('express');
var handlebars    = require('express-handlebars');

var session       = require('express-session');

var cookieParser  = require('cookie-parser');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// Require flash library
var flash         = require('connect-flash');

//Set up MongoDB 
var mongoose      = require('mongoose');
  
var morgan        = require('morgan');

var mongo         = require('mongod');

//Used as a lightweight easy to use request module. We will use this to send
//requests to send requests to OMDB.
var requestify    = require('requestify'); 

//npm package required to use functions from omdb
var omdb          = require('omdb');

var cookieSession = require('cookie-session');

var bodyParser    = require('body-parser');

var bson = require('bson');


//////////////////////////////////////////////////////////////////////
///// MongoDB Setup///////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////


//Test if connection error occurs
// var uri = 'mongodb://will:dank@ds047622.mongolab.com:47622/dbmp';
var uri = 'mongodb://admin:admin@ds053784.mongolab.com:53784/dankbox';
var db = mongoose.connect(uri);
Schema = mongoose.Schema;

var movieData = new mongoose.Schema({
    username: String,
    tag: [],
    comment: String,
    imdbID: String,
    poster_URL:String
  });

var profile = mongoose.Schema({
  local: {
    username: String,
    email: String,
    password: String,
    tierList: [],
    tag: []
  },
  facebook:{
    id : String,
    token : String,
    displayName : String,
    username : String
  }
});

var movieData = mongoose.model('movieinfo', movieData);
var User = mongoose.model('User', profile);
// var user_tag  = mongoose.model('userdata', profile);

  
//////////////////////////////////////////////////////////////////////
///// Express App Setup //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

// The express library is a simple function. When you invoke this
// function it returns an express web application that you build from.
var app = express();

// This will enable our application to support parsing cookies
app.use(cookieParser());
// This will enable our application to support sessions. The secret
// provides security to our session data. Both saveUnitialized and 
// resave are deprecated but should be false.
app.use(session({
  cookieName: 'session',
  secret: '123456789',
  duration: 1000000, //how long cookie is valid for
  activeDuration: 100000, //defines how long to extend duration after interacting w/ site
  // libraries can be rather annoying!
  saveUninitialized: false, 
  resave: false
}));//comment this

// This will enable our application to support flash
app.use(flash());

// This will set an "application variable". An application variable is
// a variable that can be retrieved from your app later on. It is
// simply a key/value mapping. In this case, we are mapping the key
// 'port' to a port number. The portedit number will either be what you
// set for PORT as an environment variable (google this if you do not
// know what an evironment variable is) or port 3000.
app.set('port', process.env.PORT || 3000);

// This does the setup for handlebars. It first creates a new
// handlebars object giving it the default layout. This indicates
// that the default layout is called main.js in the views/layouts
// directory. We then set the app's view engine to 'handlebars' - this
// lets your express app know what the view engine is. We then set an
// app variable 'view engine' to 'handlebars'. This is mostly boiler
// plate so you need not worry about the details.
var view = handlebars.create({
  defaultLayout: 'main',

  //Shamelessly used from http://stackoverflow.com/questions/11924452/handlebar-js-iterating-over-for-basic-loop
  helpers: {
    times:function (times, opts) {
      var out = "";
      var i;
      var data = {};

      if ( times ) {
        for ( i = 0; i < times; i += 1 ) {
          data.index = i;
          out += opts.fn(this, {
            data: data
          });
        }
      } else {

        out = opts.inverse(this);
      }

      return out;
    }
  }
});

app.engine('handlebars', view.engine);
app.set('view engine', 'handlebars');

// This does the setup for static file serving. It uses express'
// static middleware to look for files in /public if no other route
// matches. We use the __dirname special variable which indicates the
// directory this server is running in and on(append it to '/public'.
app.use(express.static(__dirname + '/public'));

// The `testmw` function represents out testing middleware. We use
// this in our views to conditionally include the Mocha and Chai
// testing framework as well as our own tests. Because this is a
// middleware function it expects to receive the request object
// (`req`), response object (`res`), and `next` function as arguments.
// The `next` function is used to continue processing the request
// with subsequent routes.
function testmw(req, res, next) {
  // This checks the 'env' application variable to determine if we are
  // in "production" mode. An application is in "production" mode if
  // it is actually deployed. This can be set by the NODE_ENV
  // environment variable. It also checks to see if the request has
  // given a `test` querystring parameter, such as
  // http://localhost:3000/about?test=1. If the route has that set
  // then showTests will be set to a "truthy" value. We can then
  // use that in our handlebars views to conditionally include tests.
  res.locals.showTests = app.get('env') !== 'production' &&
                         req.query.test;
  // Passes the request to the next route handler.
  next();
}

// This adds our testing middleware to the express app.
app.use(testmw);

// Initializing passport
app.use(passport.initialize());

//////////////////////////////////////////////////////////////////////
///// Passport Setup /////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

// More in-depth description can be found here: http://passportjs.org/docs
// Essentially the serialization/deserialization of the user is necessary
// for supporting login sessions.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
  
// Regular, non-facebook, Signup
passport.use('regular-signup', new LocalStrategy({
  usernameField : 'userName',
  passwordField : 'userPass',
  passReqToCallback : true 
},
function(req, userName, userPass, done){
  User.findOne({ 'local.username' :  userName }, function(err, user) {
    // Insures that the username is not already taken and that there were no
    // errors that occured while querying the DB.
    if(err){
      console.log(err);
      return done(err);
    }else if(user){
        console.log('Username is not available');
      return done(null, false, req.flash('signup', 'Username is not available'));
    }else{
      console.log('Creating new user');
      // Create a new user account and fill-in the username and password fields.
      // Once the attributes have been filled, save the user and insure that no
      // errors occured while saving the user.
      var userAccount = new User();
      userAccount.local.username = userName;
      userAccount.local.password = userPass;
      userAccount.save(function(err){
        // Error check to insure that the information was successfully saved
        if(err){
          return done(error);
        }
        req.session.user = user;
        return done(null, userAccount);
      });
    }
  }); 
}));

  // Login Authentication
  
  // This is a DB method which checks to see if the current password 
  // matches the users password. If the password and the user password
  // do not match then an error will be returned.
  // THIS IS CURRENTLY NOT IN USE!!

  // profile.methods.validPassword = function(password){
  //     return bcrypt.compareSync(password, this.local.password);
  // };
  // //

  //profile.methods.validPassword = function(password){
  //    return bcrypt.compareSync(password, this.local.password);
  //};

  passport.use('regular-login', new LocalStrategy({
    usernameField : 'user_name',
    passwordField : 'user_pass',
    passReqToCallback : true 
  },
  function(req, user_name, user_pass, done){
    User.findOne({ 'local.username' :  user_name, 'local.password' : user_pass}, function(err, user){
      // Insures there were no errors retrieving the data, that the user is
      // a valid user, and that the valid user's password is correct. If all are
      // true, the user is logged in and redirected to the main page.
      if(err){
        // flash msg?
        return done(err);
      }else if(!user){
        // flash msg?
        return done(null, false, req.flash('login', 'Invalid user'))
      }else if(user.local.password !== user_pass){
        // flash msg?
        return done(null, false, req.flash('login', 'Invalid password'));
      }else{
        // flash msg?
        req.session.user = user;
        return done(null, user);
      }
    }) ;
  }));

//////////////////////////////////////////////////////////////////////
///// User Defined Routes ////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//Functions that allow us to use body-parser
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());



var team = require('./lib/team.js');

var movieDataList = [];
var tierListArray = [];
var tagsArray = [];

app.get('/', (req, res) => {
  // Redirect to main if session and user is online:
  if(req.session && req.session.user){
    req.flash('login', 'You are already signed in');
    res.redirect('/main');
  }else{
    // flash msg?
    res.render('login',{
    });
  }
});

//Route for admin page
app.get('/admin', (req,res) => {
  res.render('admin',{

  });
});

//Route for login page
app.get('/login', (req,res) => {
  if(req.session && req.session.user){
    req.flash('login', 'You are already signed in');
    res.redirect('/main');
  }else{
    var message = req.flash('login') || '';
    res.render('login',{
    	message : message
    });
  }
});

//Route for logout 
app.post('/logout', (req, res) => {
  req.flash('login', 'Logged Out');
  req.session.destroy();
  res.redirect('/login');
});

//Route for Profile page
app.get('/profile', (req,res) => {
  for(i = 0; i < movieDataList.length; i++){
    for(j = 0; j < movieDataList[i].tags.length; j++){
      var found;
      for(g = 0; g < tagsArray.length; g++){
        if(movieDataList[i].tags[j] === tagsArray[g].name){
          found = true;
          break;
        }
        else{
          if(g === tagsArray.length-1){
            movieDataList[i].tags.splice(j, i);
          }
        }
      }
    }
  }
  var message = req.flash('profile') || '';
  res.render('profile',{
  	message: message,
    reviewCollection: movieDataList,
    tierListsCollection: tierListArray,
    tagsCollection: tagsArray
  });
});

app.post('/search', (req,res) => {
  var user_search = req.body.movieSearch;
  var searchTerms = {
    terms: user_search,
    type: 'movie'
  }
  omdb.search(searchTerms,function(err,movies){
    if(err){
      return console.log(err);
    }

    if(movies.length < 1){
      req.flash('profile', 'There were no movies found. Please search again');
      res.redirect('/profile');
    }
    var displayMovies = [];
    for(i = 0; i < movies.length; i++){
      omdb.get({imdb: movies[i].imdb}, function(error, result){
        if(error){
          return console.log(error);
        }

        if(result === undefined){
        	req.flash('profile', 'Something went wrong with the movie data retrieval');
      		res.redirect('/profile');
          return console.log("Something went wrong with the movie data retrieval");
        }
        var movieToBeDisplayed = {
          title: result.title,
          year: result.year,
          director: result.director,
          actors: result.actors,
          plot: result.plot,
          imdbID: result.imdb.id,
          poster: result.poster
        }
        displayMovies.push(movieToBeDisplayed);
        if(displayMovies.length === movies.length){
          res.render('search', { user_search   : user_search,
                               displayMovies : displayMovies});
        }
      });
    };
  });
});


//This saves to database the imdbID of the movie the user clicks on. 
//Right now this allows user to add duplicates so small bug.
app.post('/addMovie',(req,res) => {
  var user = req.session.user;
  for(var i = 0; i < movieDataList.length; i++){
    if(movieDataList[i].imdbID === req.body.imdbID){
      res.flash('Movie already added');
    }
  }
  if(user){
  var id   = req.body.imdbID;
  var name = user.local.username;
  var newMovie = new movieData({imdbID:id, username: name });
  newMovie.save();
  movieDataList.push(newMovie); //Push the movie object to the movieDataList
  res.redirect('/main');
}

else {
  res.redirect('/login');
  res.flash('User session expired please login');
}
});

//Route for signup
app.get('/signup', (req,res) => {
  if(req.session && req.session.user){
    req.flash('login', 'You are already signed in');
    res.redirect('/main');
  }else{
    //flash msg?
    res.render('signup',{
    
    });
  }
});

//Route for splash page only the template needs to be rendered.
app.get('/splash', (req,res) => {
  var user = req.session.user;
  res.render('splash',{
  });
});

//Route for main page (called home to avoid confusion with main.handlebars)
app.get('/main', (req,res) => {
  res.render('home',{
    reviewCollection: movieDataList
  });
});
https://github.com/Algentile/Dankbox-Movieplex
app.post('/editReview', (req,res) => {
  res.render('editReview', {
      name: req.body.name,
      imdbID: req.body.imdbID,
      comment: req.body.comment
    });
});

//Edits the comment field and adds that comment to the object stored in the DB
//Check this section out it seems like it mi
app.post('/editReviewSubmission', (req,res) => {
  var id = req.body.imdbID; 
  console.log(id);
  movieData.find(id, function(err,movieData){
    console.log(id);
    if(err){
      console.log('imdbID is not found');
      res.flash('The id was not found');
    }
    else{
      movieData.comment = req.body.newComment;
      console.log(movieData.comment);
      
    }
  })

  //Use req.body.imdbID to find movie in db, update movie's comment[0].comment with req.body.newComment
  res.redirect('/main');
});

app.post('/addTierList', (req, res) => {
  if(isNaN(req.body.tierListSize)){
    req.flash('profile', 'Inputted value is not a number');
    res.redirect("/profile");
  }
  else{
    res.render('addTierList', {
      tierListSize: req.body.tierListSize,
      movieCollection: movieDataList
    });
  }
});

app.post('/submitNewTierList', (req, res) => {
  var newTierList = {
    name: req.body.tierListName,
    tierList: []
  }
  for(index = 0; index < req.body.tierListResults.length; index++){
    omdb.get(req.body.tierListResults[index], function(err, movie){
      if(err){
        return console.log(err);
      }
      var detailedElement = {
        name: movie.title,
        imdbID: movie.imdb.id
      }
      newTierList.tierList.push(detailedElement);
      if(newTierList.tierList.length === req.body.tierListResults.length){
        tierListArray.push(newTierList);
        return res.redirect('/profile');
      }
    });
  }
});

app.get('/tierLists', (req, res) => {
  res.render('tierLists',{
      tierListsCollection: tierListArray
    });
});

app.post('/deleteTierList', (req, res) => {
  tierListArray.splice(req.body.index, 1);
  res.redirect('/profile');
});

//adds a new tag to the database
app.post('/addTag', (req, res) => {
var id = req.body.imdbID;
  for(i = 0; i < tagsArray.length; i++){
    if(tagsArray[i].name === req.body.tagName){
      req.flash('profile', 'Duplicate Tag Names Are Not Allowed!');
      return res.redirect('/profile');
    }
  }
  var newEntry = {
    name: req.body.tagName,
    moviesList: []
  }
  //This is where the db section starts for for me, check this out Joshua.
  tagsArray.push(newEntry);
  movieData.findOne({imdbID: id}, function(err,movie){
    if(err){
      if(!movie){
      movie = new movieData();
      movie.imdbID = id;
      }
    }
    movie.tag = tagsArray;
    movie.save(function(err){
      if(!err){
        console.log('Comment is update to:' + movie.tag);
      }
      else{
        cosnole.log('Could not save the movie comment: ' + movie.tag);
      }
    })
  })
    res.redirect('/profile');
  });

//deletes tag from the database
app.post('/deleteTag', (req, res) => {
  tagsArray.splice(req.body.index, 1);
  res.redirect('/profile');
});

app.post('/populateTags', (req, res) => {
  var movieTags;
  res.render('populateTags', {
    name: req.body.name,
    imdbID: req.body.imdbID,
    tags: tagsArray
  });
});

app.post('/submitPopulatedTags', (req, res) => {
  var checkboxResults = req.body.checkboxResults;
  var checkboxResultsArray = [];
  if(checkboxResults.constructor !== Array){
    checkboxResultsArray.push(checkboxResults);
  }
  else{
    checkboxResultsArray = req.body.checkboxResults;
  }
  for(j = 0; j < tagsArray.length; j++){
    for(g = 0; g < checkboxResultsArray.length; g++){
      if(tagsArray[j].name === checkboxResultsArray[g]){
        if(tagsArray[j].moviesList.indexOf(req.body.name) === -1) {
          tagsArray[j].moviesList.push(req.body.name);
        }
      }
      else{
        if(checkboxResultsArray.indexOf(tagsArray[j].name) === -1){
        var index = tagsArray[j].moviesList.indexOf(req.body.name);
          if(index !== -1){
            tagsArray[j].moviesList.splice(index, 1);
          }
        }
      }
    }
  }
  for(i = 0; i < movieDataList.length; i++){
    if(movieDataList[i].imdbID === req.body.imdbID){
      movieDataList[i].tags = checkboxResultsArray;
      return res.redirect('/profile');
    }
  }
  req.flash('profile', 'Movie could not be found!');
  res.redirect('/profile');
});

app.get('/tags', (req, res) => {
  res.render('tags', {
      tagsCollection: tagsArray
    });
});

app.post('')
//Route for about handlebars about view
app.get('/about', (req, res) => {
  res.render('about', {
    description: "DankBox Movieplex is a personalized movie-tracking website designed to remedy problems both casual and diehard cinemagoers experience. Everybody enjoys movies, both young and old, male and female. The problems lie not with enjoying movies, but remembering how much. Currently, there is no dedicated source for tracking the movies that a user has seen, along with their ratings and opinions on them. DankBox Movieplex seeks to remedy this by offering a website that tracks the movies an individual has seen, while also allowing them to rate and offer their opinions. These movies are then stored in a database, allowing any user to easily log into the website from any computer, anywhere, and retrieve their list of watched movies, in addition to their reviews. No more will people have to wonder whether they have seen a movie, or try to remember how they felt about a movie they have not seen in years." ,
    problems: "There is no real movie journal on the internet. There is no place where you can effectively tag your own movie going experiences and  share those details among your friends in a user friendly way. New-Movie going experiences are only suggested based off of the supply of the company and not the demand of the user. Dankbox Movieplex aims to change that, by allowing the user to decide and supplying every choice option from every dank platform.",
    uses: [ 
    {use:"Personalized movie suggestions based on YOU"},
    {use: "Keep track of your favorite movies"},
    {use: "Reviews of movies from other users"},
    {use: "Share your thoughts on movies with others on the web" }
    ]
  });
});

// Post request for logging in. Success and failure represent redirects based on whether
// or not logging in was successful/unsuccessful
app.post('/login', passport.authenticate('regular-login', {
  successRedirect : '/main',
  failureRedirect : '/login',
  failureFlash : true
}));

// Post request for signing up. Success and failure represent redirects based on whether
// or not signing up was successful/unsuccessful
app.post('/signup', passport.authenticate('regular-signup', {
  successRedirect : '/main',
  failureRedirect : '/signup',
  failureFlash : true 
}));

//Get JSON objects from OMDB

//////////////////////////////////////////////////////////////////////
///// Error Middleware ///////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

// A middleware function that will be invoked if no other route path
// has been matched. HTTP 404 indicates that the resource was not
// found. We set the HTTP status code in the response object to 404.
// We then render our views/404.handlebars view back to the client.
function notFound404(req, res) {
  res.status(404);
  res.render('404');
}

// A middleware function that will be invoked if there is an internal
// server error (HTTP 500). An internal server error indicates that
// a serious problem occurred in the server. When there is a serious
// problem in the server an additional `err` parameter is given. In
// our implementation here we print the stack trace of the error, set
// the response status code to 500, and render our
// views/500.handlebars view back to the client.
function internalServerError500(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render('500');
}

// This adds the two middleware functions as the last two middleware
// functions. Because they are at the end they will only be invoked if
// no other route defined above does not match.
app.use(notFound404);
app.use(internalServerError500);

//////////////////////////////////////////////////////////////////////
//// Application Startup /////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

// Starts the express application up on the port specified by the
// application variable 'port' (which was set above). The second
// parameter is a function that gets invoked after the application is
// up and running.
app.listen(app.get('port'), () => {
  console.log('Express started on http://localhost:' +
              app.get('port') + '; press Ctrl-C to terminate');
});

//////////////////////////////////////////////////////////////////////
///// Handlebars Helper //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////


