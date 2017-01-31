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

var users = { A536Rf:
               { id: 'A536Rf',
                 email: 'iam@example.com',
                 password: '$2a$10$/IiAARwim127pbc006wfF.bU2XqFUFfNSQHntyY.3UVwzzP4N1QYC',
                 urls : {
                  "b2xVn2": "http://www.lighthouselabs.ca"
                  }
                },
              B8G3hs:
               { id: 'B8G3hs',
                 email: 'asdas@asdad.asd',
                 password: '$2a$10$XUZyRdvZnjRPn42pbo./L.8PFgTQBMIsq3.BaEVFWjbCPW6gKPBEe',
                 urls: {
                  "9sm5xK": "http://www.google.com"
                }
               }
           };
var templateVars = {};

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

app.get("/", (req, res) => {
  let user = defineCurrentUser(req);
  if (user === "Not Logged In") {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(users);
});

app.get("/urls", (req, res) => {
  templateVars = { urls: users, username: req.session.username };
  defineCurrentUser(req);
  if (templateVars.currentUser !== "Not Logged In") {
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send("You are not logged in! <a href='/login'>Login Here</a>");
  }
});

app.get("/urls/new", (req, res) => {
  defineCurrentUser(req);
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  templateVars = { shortURL: req.params.id, fullURL: users[req.session.username]['urls'][req.params.id], currentUser: defineCurrentUser(req) };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  users[req.session.username]['urls'][shortURL] = req.body.longURL;
  res.redirect("/urls/"+shortURL);
});

app.get('/u/:shortURL', (req, res) => {
  // if (req.session.username) {
  //   let longURL = users[req.session.username]['urls'][req.params.shortURL];
  //   res.redirect(longURL);
  // } else { res.status(403).send("You must login first!"); }

  //The commented code above make only associated user can access the link

  let linkFound = false;
  let longURL = "";
  for (let data in users) {
    if (users[data]['urls'][req.params.shortURL]) {
      longURL = users[data]['urls'][req.params.shortURL];
      linkFound = true;
    }
  }
  if (linkFound) {
    res.redirect(longURL);
  } else {
      res.status(404).send("<h1>Link not found</h1>");
  }
});

app.post('/urls/:id/delete', (req, res) => {
  let linkToDelete = req.params.id;
  if (users[req.session.username]) {
    delete users[req.session.username]['urls'][linkToDelete];
    res.redirect("/urls");
  } else { res.status(403).send("You must login first!"); }
});

app.post('/urls/:id', (req, res) => {
  users[req.session.username]['urls'][req.params.id] = req.body.longURL;
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
    users[userRandomId] = {id: userRandomId, email: req.body.email, password: hashed_password, urls: []};
    req.session.username = users[userRandomId].id;

    res.redirect('/');
  } else {
    for (u in users) {
      emailFound = false;
      if (req.body.email === users[u].email) {
        emailFound = true;
        console.log("same email found");//response code 400
        res.status(400);
        res.send("User already exist! <a href='/register'>Register with another email</a>");
      }
    }
    if (emailFound === false) {
      let userRandomId = generateRandomString();
      let hashed_password = bcrypt.hashSync(req.body.password, 10);
      users[userRandomId] = {id: userRandomId, email: req.body.email, password: hashed_password, urls: []};
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});