//app.js started by Professor Timothy Richards
// This requires the necessary libraries for the webapp.
// (1) express - this provides the express web framework
// (2) handlebars - this provides the handlebars templating framework
// (2) session - this provides the session framework
var express       = require('express');
var handlebars    = require('express-handlebars');

var session       = require('express-session');

var cookieParser  = require('cookie-parser');

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



// app.use(bodyParser.json());

// app.use(bodyParser.urlencoded({
//   extended: true
// }));

//////////////////////////////////////////////////////////////////////
///// MongoDB Setup///////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////


//Test if connection error occurs
var uri = 'mongodb://admin:admin@ds053784.mongolab.com:53784/dankbox'
var db = mongoose.connect(uri);
Schema = mongoose.Schema;

var movieData = new mongoose.Schema({
    username: String,
    tag: [],
    tierList: [],
    comment: [{comment:String, date: Date}],
    imdb_ID: String,
    poster_URL:String
  });

 var profile = new mongoose.Schema({
    username: String,
    password: String,
    email: String
  });

  var movieData = mongoose.model('movieinfo', movieData);
  var user_tag  = mongoose.model('userdata', profile);

  
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
  secret: '123456789',
  // libraries can be rather annoying!
  saveUninitialized: false, 
  resave: false
}));

// This will enable our application to support flash
app.use(flash());

// This will set an "application variable". An application variable is
// a variable that can be retrieved from your app later on. It is
// simply a key/value mapping. In this case, we are mapping the key
// 'port' to a port number. The port number will either be what you
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
var view = handlebars.create({ defaultLayout: 'main' });
app.engine('handlebars', view.engine);
app.set('view engine', 'handlebars');

// This does the setup for static file serving. It uses express'
// static middleware to look for files in /public if no other route
// matches. We use the __dirname special variable which indicates the
// directory this server is running in and append it to '/public'.
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


//////////////////////////////////////////////////////////////////////
///// User Defined Routes ////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//Functions that allow us to use body-parser
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());



var team = require('./lib/team.js');

app.get('/', (req, res) => {
  //Insures nobody is logged in before redirecting to login
  var user = req.session.user;
  // Redirect to main if session and user is online:
  if (user){//&& users[user.name]) {
    res.redirect('/main');
  }else{
    console.log('No user is currently logged in');
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
  //Insures nobody is logged in before redirecting to login
  var user = req.session.user;
  // Redirect to main if session and user is online:
  if (user){//&& users[user.name]) {
    res.redirect('/main');
  }else{
    console.log('No user is currently logged in');
    res.render('login',{

    });
  }
});

//Route for Profile page
app.get('/profile', (req,res) => {
  res.render('profile',{

  });
});

//Route for Search 
//app.get('/search', (req,res) =>{
//  res.render('search',{
//    mov
//  })
//});

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
      return console.log("There were no movies found. Please search again");
    }
    var displayMovies = [];
    movies.forEach(function(movie) {
      omdb.get({imdb: movie.imdb}, function(error, result){
        if(error){
          return console.log(error);
        }

        if(result === undefined){
          return console.log("Something went wrong with the movie data retrieval");
        }
        var movieToBeDisplayed = {
          title: result.title,
          year: result.year,
          director: result.director,
          actors: result.actors,
          plot: result.plot,
          imdbID: result.imdb.id
        }
        displayMovies.push(movieToBeDisplayed);
      });
    });
    console.log(displayMovies)
  });
});

//Route for signup
app.get('/signup', (req,res) => {
  res.render('signup',{

  });
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
    
  });
});

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

