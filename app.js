'use strict';

const express = require('express'),
      app = express(),
//      nodemailer = require('nodemailer'),      
      bodyParser = require('body-parser'),
      pgp = require('pg-promise')(),      
      port = process.env.PORT || 3000,  
      db = pgp({
        host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
        port: 5432,
        database: 'detamp7dm7n5kt',
        user: process.env.SERVICE_DB_USER,
        password: process.env.SERVICE_DB_PASS,    
        ssl: true,
        sslfactory: 'org.postgresql.ssl.NonValidatingFactory'
      });

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

app.post("/login", (req, res, next) => {
 
    var email = req.body['log-email'];
    var password = req.body['log-pass'];

  db.one(`SELECT * FROM users
          WHERE email = '${email}';`)
  .then(data => {
    console.log(data);
    if (!data.password) {
    res.status(401).json({message:"no such user found"});
    }
    if(data.password === password) {
    res.json({message: "hello" + ' ' + data.name});
  } else {
    res.status(401).json({message:"passwords did not match"});
    }  
  }).catch(err => {     
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
  
  db.none(`insert into users(email, password, reg_date, cash, name)` +
      `values('${email}', '${pass}', '${new Date().toISOString()}', 150, '${name}')`,
    req.body)
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Inserted one user'
        });
    })
    .catch(err => {     
      res.send('Something went wrong:' + err.message);
    });

});

app.listen(port, () => {
  console.log('Listen on port: ' + port);
})
