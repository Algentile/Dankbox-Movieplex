# Dankbox-Movieplex
A movie tracking website

Overview:
DankBox Movieplex is a personalized movie-tracking website designed to remedy problems both casual and diehard cinemagoers experience. Everybody enjoys movies, both young and old, male and female. The problems lie not with enjoying movies, but remembering how much. Currently, there is no dedicated source for tracking the movies that a user has seen, along with what the user though of them. DankBox Movieplex seeks to remedy this by offering a website that tracks the movies an individual has seen, while also allowing them to rate and offer their opinions. These movies are then stored in a database, allowing any user to easily log into the website from any computer, anywhere, and retrieve their list of watched movies, in addition to their reviews. No more will people have to wonder whether they have seen a movie, or try to remember how they felt about a movie they have not seen in years.

How to Run:
From the Dankbox Movieplex directory, type "node app.js" without quotes into the terminal.

Libraries:
Express- "Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications." http://expressjs.com/
Handlebars- Handlebars is our view engine. It dynamically generates HTML as we need it. We use this to create all of our views. https://github.com/wycats/handlebars.js/
Session- Session is our session framework. Using it allows Dankbox Movieplex to support sessions, which ensures that users are able to access their data and no one else's. https://github.com/expressjs/session
CookieParser-
Flash-
Mongoose- We use Mongoose for mongoDB object modeling. We use it to create schemata that make it simple to interact with our database. http://mongoosejs.com/
Morgan-
MongoDB- Mongo is a document-oriented NoSQL database. We use it to store all of the information that Dankbox Movieplex needs about its users and the movies that they rate and review. We found it to be easy to use in a web app environment, and decided it was a great fit for our project. https://www.mongodb.org/
OMDB- OMDB is a web service that obtains movie information. This is crucial to Dankbox Movieplex's functionality, as we use it to get all of the information we need about movies that users watch. http://www.omdbapi.com/
CookieSession-
BodyParser-

Views:
404- This view is rendered when a resource is not found. This happens when a route path can't be found.
500- This view is rendered when there is an internal server error. When this view is rendered, we also print the stack trace of the error to the console.
About- The about view provides some information about Dankbox Movieplex and its function and purpose. 
Admin- This is the profile page for administrators. From this page, an admin can do anything that a user can do from their profile page. In addition, they can perform administrative actions such as view the profiles of other users or ban users.
Home- The homepage is what users first see when they login. It provides an overview of movies that the user has rated and reviewed, and allows them to search for new movies.
Login- This is where a user logs in by entering their username and password.
Main- Main is the main view of Dankbox Movieplex. It displays the logo and titles the webpage, and its body dynamically displays all of our other views.
Profile- This is the profile page for non-admin users. From here, users can find links to a comprehensive list of all the movies they have reviewed and rated, along with the ability to search through that list by tags that they have given to movies. They can also search for new movies from here and add them. In addition, the profile displays tier lists that the user has created (such as their top 5 action movies) along with their 10 most recently added movies.
Search- The search view is rendered when the user searches for a movie. The user types in the title of a movie they want to add, and they are presented with a list of all movies containing that title. The list also displays information such as year, actors, and plot to help the user determine which one is the movie they are looking for. Once the user determines which movie is the one they want, they can click the add button and add it their profile.
Signup- A user will see this view when they try to create a new account. It prompts them to create a username and password.
Splash- This view is the first view rendered when a user visits Dankbox Movieplex. From here, the user can go to the login page or go to the signup page to create a new account.
Tags- The tags view displays all of the tags that a user had created and all of the movies that belong to those tags. In addition, a user can create new tags and add movies to those tags.
Team- This view displays information about the amazing, talented and dank team behind Dankbox Movieplex. It was created for TPA02 and is currently inaccessible.

Statefulness:

Persistence:
Dankbox Movieplex makes use of MongoDB to store information. We use the following schemata:

var movieData = new mongoose.Schema({
    username: String,
    tag: [],
    tierList: [],
    comment: [{comment:String, date: Date}],
    imdbID: String,
    poster_URL:String
  });

 var profile = new mongoose.Schema({
    username: String,
    password: String,
    email: String
  });

The first one, movieData, is used to store information about movies that a user adds. It keeps track of the user's username, any tags that the user assigned to that movie, and any tierLists that the movie belongs to. It also keeps track of comments that the user leaves about the movie. In addition, we store the imdbID of the string, which allows us to get information about the movie without having to store everything, and the URL of the movie's poster.
The second one, profile, is used to store all of our users. It keeps track of the user's username, password and email.

To be continued...
