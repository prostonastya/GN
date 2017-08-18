'use strict';

const express = require('express'),
      app = express(),
//      nodemailer = require('nodemailer'),      
      bodyParser = require('body-parser'),
      pgp = require('pg-promise')(),      
      port = process.env.PORT || 3000,  
      db=pgp('postgres://postgres:test@localhost:5432/testb');

      // db = pgp({
      //   host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
      //   port: 5432,
      //   database: 'detamp7dm7n5kt',
      //   user: process.env.SERVICE_DB_USER,
      //   password: process.env.SERVICE_DB_PASS,    
      //   ssl: true,
      //   sslfactory: 'org.postgresql.ssl.NonValidatingFactory'
      // });

app.set('view engine', 'ejs');

//middlewares
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
   extended: true 
}));
app.use(bodyParser.json());

//ROUTES

app.get('/', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const email = req.body['log-email'],
        pass = req.body['log-pass'];
        console.log(email,pass);
  authentUser(email, pass, authResult => {
    if (!authResult) {
      res.send('Wrong Email or password.');
    }        
    res.send('Greeting!');
  }, err => {
    res.send('Something went wrong:' + err.message);
  });
});

app.post('/register', (req, res) => {
  const name = req.body['reg-name'],
        email = req.body['reg-email'],
        pass = req.body['reg-pass'],
        passCheck = req.body['reg-pass-repeat'];
  
  if (pass !== passCheck) {
    res.send('Passwords didn\'t match.');
  }

  var newUser = {
    name: name,
    email: email,
    password: pass
  } 

  createNewUser(newUser, () => {
    res.send('Nice to meet you, ' + newUser.name);
  }, (err) => {
    res.send('Something went wrong:' + err.message);
  });
});

function createNewUser(user, onResolved, onError) {
  db.any(`INSERT INTO users (email, password, reg_date, cash, name)
            VALUES (                        
            '${user.email}', 
            '${user.password}',             
            '${new Date().toISOString()}',
            150,
            '${user.name}'
          );`, [true])        
    .then(data => {
      console.log(data);
      // const letter = createGreetLetter(user);
      // sendMail(letter);
      onResolved(data);
    })
    .catch(error => {
      console.log(error);
      onError(error);
    });
}

function authentUser(email, password, onResolved, onError) {
  db.one(`SELECT password FROM users
          WHERE email = '${email}';`)
    .then(data => {  
      console.log(data);  

      var authResult;
      if  (password === data.password){
        authResult = password
      }
      onResolved(authResult, data);
    })
    .catch(error => {
      console.log(error);
      onError(error);
    });
}


app.listen(port, () => {
  console.log('Listen on port: ' + port);
})
