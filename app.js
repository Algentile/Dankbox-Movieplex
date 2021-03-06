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
    poster_URL: String,
    year: String,
    plot: String,
    title: String
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
        req.session.user = userAccount;
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
    res.render('splash',{
    });
  }
});


//Route for logout 
app.post('/logout', (req, res) => {
  req.flash('splash', 'Logged Out');
  req.session.destroy();
  res.redirect('/splash');
});

//Route for Profile page
app.get('/profile', (req,res) => {
  var user = req.session.user;
  if (!user) {
    console.log('user session not found');
    res.redirect('/splash')
  }
  User.findOne({'local.username': user.local.username}, function (err, user) {
    if (err) {
      console.log("Error user not found");
    }
    var tagsCollection = user.local.tag;
    var tierListsCollection = user.local.tierList;
    movieData.find({'username' : user.local.username}, 'imdbID poster_URL comment tag year plot title' , function(err,movieData){
      if(err){console.log('Error movie posters not found');}
      res.render('profile', {
        tagsCollection: tagsCollection,
        tierListsCollection: tierListsCollection,
        reviewCollection: movieData
      });
    });
  });
});


app.post('/search', (req,res) => {
  var user = req.session.user;
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
        posterResult = result.poster;
        if(!posterResult) {
          posterResult = "/img/noPoster.png";
        }
        var plot = "";
        for(i in result.plot){
          plot += result.plot[i];
        }
        var movieToBeDisplayed = {
          title: result.title,
          year: result.year,
          director: result.director,
          actors: result.actors,
          plot: plot,
          imdbID: result.imdb.id,
          poster: posterResult
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
app.post('/addMovie',(req,res) => {
  var user = req.session.user;
  if(!user){
    console.log('User session currently not active');
    res.redirect('/splash');
  }
  else {
    var id = req.body.imdbID;
    movieData.findOne({'username': user.local.username, imdbID: id}, function (err, movie) {
      if (movie === null) {
        if (!req.body.poster) {
          var poster = "/img/noPoster.png";
        }
        else {
          var poster = req.body.poster;
        }
        var name = user.local.username;
        var movieYear = req.body.year;
        var moviePlot = req.body.plot;
        var movieTitle = req.body.title;
        var newMovie = new movieData({
          imdbID: id,
          username: name,
          poster_URL: poster,
          comment: '',
          year: movieYear,
          plot: moviePlot,
          title: movieTitle
        });
        newMovie.save();
        movieDataList.push(newMovie); //Push the movie object to the movieDataList
        res.redirect('/main');
      }
      else{
        console.log('Duplicate Movies are not allowed!');
        res.redirect('/main');
      }
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
//Checks if user session is active if not it attempts to render posters by first querying for the user 
//then after a user is found it queries the user objects for a list of the poster_URLs.
app.get('/main', (req,res) => {
  var user = req.session.user;
  var id = req.body.imdbID;
  if(!user){
    console.log('User session currently not active');
    res.redirect('/splash');
  }
  else{
    User.findOne({'local.username': user.local.username},function(err,userObject){
      if(err){console.log('user not found ');}
      movieData.find({'username' : userObject.local.username}, 'imdbID poster_URL comment tag year plot title' , function(err,movieData){
        if(err){console.log('Error movie posters not found');}
        res.render('home', {
          reviewCollection: movieData
        });
      });
    });
  }
});



//https://github.com/Algentile/Dankbox-Movieplex
//user session is not active, this is an issue for getting the data
//because I do not have a user to ref erence.
app.post('/editReview', (req,res) => {
  var user = req.session.user;
  var id = req.body.imdbID;

  User.findOne({'local.username':user.local.username},function(err,user){
    if(err){console.log('Error: user not found');}

    movieData.findOne({'username' : user.local.username, imdbID: id}, function(movie,err){
      if(err){console.log('Error movie not found');}

        res.render('editReview', {
          name: req.body.name,
          imdbID: id
      });
    });
  });
});

//Edits the comment field and adds that comment to the object stored in the DB
//Check this section out it seems like https://moodle.umass.edu/grade/report/user/index.php?id=24375it finds the comment id but does not successfully save
//to the OID in mongo.
app.post('/editReviewSubmission', (req,res) => {
  var id = req.body.imdbID; 
  var user = req.session.user;
  var comment = req.body.newComment;

  User.findOne({'local.username': user.local.username}, function(err){
    if (err){console.log('username not found');}

    movieData.findOne({'username' : user.local.username, imdbID: id}, function(err,movie){
      if(err){console.log('movie cannot be found');}

        movie.comment = comment; 
        movie.save(function(err){
          if(err){
            console.log('Error did not save');
          }
          res.redirect('/main');
        });
    }); 
  });
  //Use req.body.imdbID to find movie in db, update movie's comment[0].comment with req.body.newComment
});

app.post('/addTierList', (req, res) => {
  var user = req.session.user;
  console.log(user);
  if(!user){
    console.log('User session currently not active');
    res.redirect('/splash');
  }
  if(isNaN(req.body.tierListSize)){
    req.flash('profile', 'Inputted value is not a number');
    res.redirect("/profile");
  }
  else{
    User.findOne({'local.username':user.local.username},function(err,user){
      if(err){console.log('Error: user not found');}
      console.log(user);
      movieData.find({'username' : user.local.username}, 'imdbID title' , function(err,movieDataResults){
          if(err){console.log('Error movie not found');}

          res.render('addTierList', {
            tierListSize: req.body.tierListSize,
            movieCollection: movieDataResults
          });
        });
    });
  }
});

//Submit a new tier list to the users list of tierlists and save to the db.
app.post('/submitNewTierList', (req, res) => {
  var user = req.session.user;
  if(!user){
    console.log('User session currently not active');
    res.redirect('/splash');
  }
  var id   = req.body.imdbID;
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

      //Must sort resulting array because of callbacks
      if(newTierList.tierList.length === req.body.tierListResults.length){
        var sortedArray = [newTierList.tierList.length];
        for(var i = 0; i < newTierList.tierList.length; i++){
          if(newTierList.tierList[i].imdbID !== req.body.tierListResults[i]){
            for(var j = 0; j < req.body.tierListResults.length; j++){
              if(newTierList.tierList[i].imdbID === req.body.tierListResults[j]){
                sortedArray[j] = newTierList.tierList[i];
              }
            }
          }
          else{
            sortedArray[i] = newTierList.tierList[i];
          }
        }
        User.findOne({'local.username': user.local.username}, function(err,user){
          if(err){console.log('user session is not active');}
          var tierListArray = user.local.tierList;
          newTierList.tierList = sortedArray;
          tierListArray.push(newTierList);
          user.local.tierList = tierListArray;
          user.save(function(err){
            if(err){
              console.log('Error did not save');
            }
            res.redirect('/main');
          });
        });
      }
    });
  }
});
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
app.get('/tierLists', (req, res) => {
  var user = req.session.user;
  if(!user){
    console.log('User session currently not active');
    res.redirect('/splash');
  }
  else{
    User.findOne({'local.username': user.local.username}, function(err,user) {
        if(err){console.log('Error: user not found');}
        res.render('tierLists', {
          tierListsCollection: user.local.tierList
        });
      });
  }
});

//Removes the tierlist in the tierlist section of the User schema
//at the specific index value. Check the submitaddtierlist function
//before checking to see if this functions works accordingly.
app.post('/deleteTierList', (req, res) => {
  var user = req.session.user;
  if(!user){
    console.log('User session currently not active');
    res.redirect('/splash');
  }
  else{
    User.findOne({'local.username': user.local.username}, function(err,user) {
      if(err){console.log('Error: user not found');}
      var index = req.body.index;
      var tierListArray = user.local.tierList;
      tierListArray.splice(index, 1);
      user.save(function(err){
        if(err){
          console.log('Error did not save');
        }
        res.redirect('/main');
      });
    });
  }
});

//adds a new tag to the database to the User tag section
//If the movie does not already exist it will make a new form
//of that movie Data, otherwise save the User tag into the user tag array,
app.post('/addTag', (req, res) => {
  var user = req.session.user;
  if (!user) {
    console.log('User session currently not active');
    res.redirect('/splash');
  }
  User.findOne({'local.username': user.local.username}, function (err, user) {
    if (err) {
      console.log('Error: user not found');
    }
    for (i = 0; i < user.local.tag.length; i++) {
      if (user.local.tag[i].name === req.body.tagName) {
        req.flash('profile', 'Duplicate Tag Names Are Not Allowed!');
        return res.redirect('/profile');
      }
    }
    var newEntry = {
      name: req.body.tagName,
      moviesList: []
    }
    user.local.tag.push(newEntry);
    user.save(function(err){
      if(err){
        console.log('Error did not save');
      }
      res.redirect('/main');
    });
  });
});

//deletes tag from the database in the movieInfos schema 
//finds the tag in the tagArray at the return @index value
app.post('/deleteTag', (req, res) => {
  var index = req.body.index;
  var id    = req.body.imdbID;
  var user  = req.session.user;
  if (!user) {
    console.log('User session currently not active');
    res.redirect('/splash');
  }
  User.findOne({'local.username': user.local.username},function(err,user){
    if(err){console.log("Error user not found");}
    var deletedTag = user.local.tag[index].name;
    user.local.tag.splice(index, 1);
    user.save(function(err){
      if(err){
        console.log('Error did not save');
      }
      movieData.find({'username' : user.local.username, 'tag': {$in: [deletedTag]}}, 'imdbID title tag' , function(err,movieDataResults){
        if (err) {
          console.log('No movies');
        }
        for(i in movieDataResults){
          var index = movieDataResults[i].tag.indexOf(deletedTag);
          movieDataResults[i].tag.splice(index, 1);
          movieDataResults[i].save(function(err) {
            if (err) {
              console.log('Error did not save');
            }
            res.redirect('/main');
          });
        }
      });
      });
    });
  });



app.post('/populateTags', (req, res) => {
  var user = req.session.user;
  if (!user) {
    console.log('User session currently not active');
    res.redirect('/splash');
  }
  User.findOne({'local.username': user.local.username}, function (err, user) {
    if (err) {
      console.log("Error user not found");
    }
    res.render('populateTags', {
      name: req.body.name,
      imdbID: req.body.imdbID,
      tags: user.local.tag
    });
  });
});

app.post('/submitPopulatedTags', (req, res) => {
  var user = req.session.user;
  if (!user) {
    console.log('User session currently not active');
    res.redirect('/splash');
  }
  var checkboxResults = req.body.checkboxResults;
  var checkboxResultsArray = [];
  if(checkboxResults.constructor !== Array){
    checkboxResultsArray.push(checkboxResults);
  }
  else{
    checkboxResultsArray = req.body.checkboxResults;
  }
  User.findOne({'local.username': user.local.username}, function (err, user) {
    if (err) {
      console.log("Error user not found");
    }
    for (j = 0; j < user.local.tag.length; j++) {
      for (g = 0; g < checkboxResultsArray.length; g++) {
        if (user.local.tag[j].name === checkboxResultsArray[g]) {
          if (user.local.tag[j].moviesList.indexOf(req.body.name) === -1) {
            user.local.tag[j].moviesList.push(req.body.name);
          }
        }
        else {
          if (checkboxResultsArray.indexOf(user.local.tag[j].name) === -1) {
            var index = user.local.tag[j].moviesList.indexOf(req.body.name);
            if (index !== -1) {
              user.local.tag[j].moviesList.splice(index, 1);
            }
          }
        }
      }
    }
    user.markModified('local.tag');
    user.save(function(err){
      if(err){
        console.log('Error did not save');
      }
      movieData.find({'username' : user.local.username}, 'imdbID title tag' , function(err,movieDataResults) {
        if(err){
          console.log('No movies');
        }
        for (i = 0; i < movieDataResults.length; i++) {
          if (movieDataResults[i].imdbID === req.body.imdbID) {
            movieDataResults[i].tag = checkboxResultsArray;
            movieDataResults[i].markModified('tags');
            movieDataResults[i].save(function(err) {
              if (err) {
                console.log('Error did not save');
              }
              res.redirect('/main');
            });
          }
        }
      });
    });
  });
});

app.get('/tags', (req, res) => {
  var user = req.session.user;
  if (!user) {
    console.log('user session not found');
    res.redirect('/splash')
  }
  User.findOne({'local.username': user.local.username}, function (err, user) {
    if (err) {
      console.log("Error user not found");
    }
    res.render('tags', {
      tagsCollection: user.local.tag
    });
  });
});

// Post request for logging in. Success and failure represent redirects based on whether
// or not logging in was successful/unsuccessful
app.post('/login', passport.authenticate('regular-login', {
  successRedirect : '/main',
  failureRedirect : '/splash',
  failureFlash : true
}));

// Post request for signing up. Success and failure represent redirects based on whether
// or not signing up was successful/unsuccessful
app.post('/signup', passport.authenticate('regular-signup', {
  successRedirect : '/main',
  failureRedirect : '/splash',
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


