const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use("/styles", express.static(__dirname + "/styles"));
//const cookieParser = require('cookie-parser');
//app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

var urlDatabaseOwnership = {};
  // {"username": [
  //   "b2xVn2" : 'url',
  //   "asdfasdf": 'url2'
  // ]}

var users = {};
var templateVars = {};

app.get("/", (req, res) => {
  res.end("Hello! Welcome to Tiny App!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  templateVars = { urls: urlDatabase };
  defineCurrentUser(req);
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  templateVars = { shortURL: req.params.id, fullURL: urlDatabase[req.params.id], currentUser: defineCurrentUser(req) };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  //console.log(req.body);  // debug statement to see POST parameters
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect("/urls/"+shortURL);
});

app.get('/u/:shortURL', (req, res) => {
  if (req.session.username) {
    let longURL = urlDatabase[req.params.shortURL];
  } else { res.status(403).send("You must login first!"); }
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  let linkToDelete = req.params.id;
  if (users[req.session.username]) {
    delete urlDatabase[linkToDelete];
    res.redirect("/urls");
  } else { res.status(403).send("You must login first!"); }
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.get('/register', (req, res) => {
  res.render("register");
});

app.post('/register', (req, res) => {
  let emailFound = false;
  if (users === undefined) {
    let userRandomId = generateRandomString();
    const hashed_password = bcrypt.hashSync(req.body.password, 10);
    users[userRandomId] = {id: userRandomId, email: req.body.email, password: hashed_password};
    req.session.username = users[userRandomId].id;

    res.redirect('/');
  } else {
    for (u in users) {
      emailFound = false;
      if (req.body.email === users[u].email) {
        emailFound = true;
        console.log("same email found");//response code 400
        res.status(400);
        res.send("User already exist!");
      }
    }
    if (emailFound === false) {
      let userRandomId = generateRandomString();
      let hashed_password = bcrypt.hashSync(req.body.password, 10);
      users[userRandomId] = {id: userRandomId, email: req.body.email, password: hashed_password};
      req.session.username = users[userRandomId].id;
      res.redirect('/');
    }
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  let userFound = false;
  let passwordMatch = false;
  for (user in users) {
    if (req.body.email === users[user].email) {
      userFound = true;
    }
  }
  if (userFound) {
    passwordMatch = false;
    for (user in users) {
      if (bcrypt.compareSync(req.body.password, users[user].password)) {
        passwordMatch = true;
        req.session.username = users[user].id;
      }
    }
  }
  if (userFound && passwordMatch) {
    res.redirect('/');
  } else { res.status(403).send("Username and password Doesn't match"); }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

function generateRandomString() {
  var randomString = "";
  const possibilities = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    randomString += possibilities[Math.floor(Math.random() * possibilities.length)];
  }
  return randomString;
}

function defineCurrentUser(req) {
  if (users.hasOwnProperty(req.session.username)) {
    templateVars.currentUser = users[req.session.username].email;
    return templateVars.currentUser;
  } else return templateVars.currentUser = "Not Logged In";
}