'use strict';
const express = require('express'),
  app = express(),
  nodemailer = require('nodemailer'),      
  bodyParser = require('body-parser'),
  pgp = require('pg-promise')(),      
  port = process.env.PORT || 3000,   
  jwt = require('jsonwebtoken'), 
  db = pgp({
    host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
    port: 5432,
    database: 'detamp7dm7n5kt',
    user: process.env.SERVICE_DB_USER,
    password: process.env.SERVICE_DB_PASS,    
    ssl: true,
    sslfactory: 'org.postgresql.ssl.NonValidatingFactory'
  }),
  // безопасность gmail  не дает мне отправлять письма :((

  // transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: {
  //     user: process.env.SERVICE_EMAIL,
  //     pass: process.env.SERVICE_EMAIL_PASS
  //   }
  // }),
  mailOptions = {
    from: '"Game team" <an.patralova@gmail.com>', // sender address
    to: 'user.email', // list of receivers
    subject: 'Hello? new user! ✔', // Subject line
    text: 'Hello! We are glad that you joined our game ', // plain text body
    html: '<b>Hello! We are glad that you joined our game ?</b>' // html body
  }


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
    // console.log(data);
    if (!data.password) {
    res.status(401).json({message:"no such user found"});
    }
    if(data.password === password) {    
    // create a token
      var token = jwt.sign(data, 'secret', {
        expiresIn: 28800 
      });
      console.log(token);
      // return the information including token as JSON
      res.json({
        success: true,
        message: "hello" + ' ' + data.name,
        token:token
      });
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
      // sendMail(mailOptions);
    })
    .catch(err => {     
      res.send('Something went wrong:' + err.message);
    });

});

function sendMail(mailOptions) {
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}



app.listen(port, () => {
  console.log('Listen on port: ' + port);
})
