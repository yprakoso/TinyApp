const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use("/styles", express.static(__dirname + "/styles"));
const cookieParser = require('cookie-parser');
app.use(cookieParser())

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

var users = {};

app.get("/", (req, res) => {
  res.end("Hello!");
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
  let templateVars = { urls: urlDatabase };
  if (users.hasOwnProperty(req.cookies["username"])) {
    templateVars.currentUser = users[req.cookies["username"]].email;
  } else templateVars.currentUser = "Not Logged In";
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, fullURL: urlDatabase[req.params.id] };
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
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  let linkToDelete = req.params.id;
  delete urlDatabase[linkToDelete];
  res.redirect("/urls");
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
    users[userRandomId] = {id: userRandomId, email: req.body.email, password: req.body.password};
    res.cookie("username", userRandomId);
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
      users[userRandomId] = {id: userRandomId, email: req.body.email, password: req.body.password};
      res.cookie("username", userRandomId);
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
      if (req.body.password === users[user].password) {
        passwordMatch = true;
      }
    }
  }
  if (userFound && passwordMatch) {
    res.cookie("username", req.body.username);
    res.redirect('/');
  } else {res.status(403).send("Username and password Doesn't match");}
});

app.post('/logout', (req, res) => {
  res.clearCookie("username");
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