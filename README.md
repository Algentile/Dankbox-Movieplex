<h1>Dankbox-Movieplex</h1>

<h2>Overview:</h2>
<p>Dankbox Movieplex is a personalized movie-tracking website designed to remedy problems both casual and diehard cinemagoers experience. Everybody enjoys movies, both young and old, male and female. The problems lie not with enjoying movies, but remembering movies that one has seen, or information about those movies. Currently, there is no dedicated source for tracking the movies that a user has seen, along with what the user thought of them. Dankbox Movieplex seeks to remedy this by offering a website that tracks the movies an individual has seen, while also allowing them to rate and offer their opinions. These movies are then stored in a database, allowing any user to easily log into the website from any computer, anywhere, and retrieve their list of watched movies, in addition to their reviews. No more will people have to wonder whether they have seen a movie, or try to remember how they felt about a movie they have not seen in years.</p>

<h2>How to Run:</h2>
<p>From the Dankbox Movieplex directory, type "node app.js" without quotes into the terminal.</p>

<h2>Libraries:</h2>
<ul>
<li>BodyParser- This is middleware used in body parsing. We are not fully using this right now, but it will be used in the future for parsing bodies. https://github.com/expressjs/body-parser</li>
<li>CookieParser- CookieParser is middleware used to parse cookies in an HTTP header. We are not fully using this right now, but it will be used in the future to parse cookies. https://github.com/expressjs/cookie-parser</li>
<li>CookieSession- CookieSession is session middleware that is cookie based. We are not currently using it right now, but it will be used in the future to handle sessions. https://github.com/expressjs/cookie-session</li>
<li>Express- "Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications." The express framework is the base for many of the libraries that we use, and is a necessity in any web app. http://expressjs.com/</li>
<li>Flash- Flash is middleware that is used for flash messages. We use flash messages to convey information to users when needed. For example, when a user tries to log in with a username and password that do not match, we use a flash message to inform them of that. https://github.com/jaredhanson/connect-flash</li>
<li>Handlebars- Handlebars is our view engine. It dynamically generates HTML as we need it. We use this to create all of our views as it allows us to manipulate what a user sees. https://github.com/wycats/handlebars.js/</li>
<li>MongoDB- Mongo is a document-oriented NoSQL database. We use it to store all of the information that Dankbox Movieplex needs about its users and the movies that they rate and review. We found it to be easy to use in a web app environment, and decided it was a great fit for our project. https://www.mongodb.org/</li>
<li>Mongoose- Mongoose is used for object modeling for MongoDB. We use Mongoose for creating schemata for the objects that we store in our database. In addition, we use Mongoose to connect to and interact with our database. http://mongoosejs.com/</li>
<li>Morgan- Morgan is used for server logging. We are not fully using this right now, but it will be used in the future for server logging. https://github.com/expressjs/morgan</li>
<li>OMDB- OMDB is a web service that obtains movie information. This is crucial to Dankbox Movieplex's functionality, as we use it to get all of the information we need about movies that users watch. http://www.omdbapi.com/</li>
<li>Passport- Passport is middleware that is used to authernticate users. We use it here to ensure that users are able to create their accounts without any errors, such as having a username that is the same as an existing user. It will also be used in the near future to authenticate users using Facebook. https://github.com/jaredhanson/passport</li>
<li>Session- Session is our session framework. Using it allows Dankbox Movieplex to support sessions, which ensures that users are able to access their data and no one else's. https://github.com/expressjs/session</li>
</ul>

<h2>Views:</h2>
<ul>
<li>404- This view is rendered when a resource is not found. This happens when a route path can't be followed.</li>
<li>500- This view is rendered when there is an internal server error. When this view is rendered, we also print the stack trace of the error to the console.</li>
<li>About- The about view provides some information about Dankbox Movieplex and its function and purpose. </li>
<li>Admin- This is the profile page for administrators. From this page, an admin can do anything that a user can do from their profile page. In addition, they can perform administrative actions such as view the profiles of other users or ban users.</li>
<li>Home- The homepage is what users first see when they login. It provides an overview of movies that the user has rated and reviewed, and allows them to search for new movies.</li>
<li>Login- This is where a user logs in by entering their username and password.</li>
<li>Main- Main is the main view of Dankbox Movieplex. It displays the logo and titles the webpage, and its body dynamically displays all of our other views.</li>
<li>Profile- This is the profile page for non-admin users. From here, users can find links to a comprehensive list of all the movies they have reviewed and rated, along with the ability to search through that list by tags that they have given to movies. They can also search for new movies from here and add them. In addition, the profile displays tier lists that the user has created (such as their top 5 action movies) along with their 10 most recently added movies.</li>
<li>Search- The search view is rendered when the user searches for a movie. The user types in the title of a movie they want to add, and they are presented with a list of all movies containing that title. The list also displays information such as year, actors, and plot to help the user determine which one is the movie they are looking for. Once the user determines which movie is the one they want, they can click the add button and add it their profile.</li>
<li>Signup- A user will see this view when they try to create a new account. It prompts them to create a username and password.</li>
<li>Splash- This view is the first view rendered when a user visits Dankbox Movieplex. From here, the user can go to the login page or go to the signup page to create a new account.</li>
<li>Tags- The tags view displays all of the tags that a user had created and all of the movies that belong to those tags. In addition, a user can create new tags and add movies to those tags.</li>
<li>Team- This view displays information about the amazing, talented and dank team behind Dankbox Movieplex. It was created for TPA02 and is currently inaccessible.</li>
</ul>

<h2>Statefulness:</h2>

<h2>Persistence:</h2>
<p>Dankbox Movieplex makes use of MongoDB to store information. We use the following schemata:</p>

<pre><code>var movieData = new mongoose.Schema({
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
  });</code></pre>
<p>The first one, movieData, is used to store information about movies that a user adds. It keeps track of the user's username, any tags that the user assigned to that movie, and any tierLists that the movie belongs to. It also keeps track of comments that the user leaves about the movie. In addition, we store the imdbID of the string, which allows us to get information about the movie without having to store everything, and the URL of the movie's poster.</p>

<p>The second one, profile, is used to store all of our users. It keeps track of the user's username, password and email.</p>

To be continued...
