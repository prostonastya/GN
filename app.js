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
        // user: smdtzebruscqxv,
        // password: b988acabcae53edc03642deec8eabbbd891f2c549a02100e9f5b134c624ea4cd,
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

app.listen(port, () => {
  console.log('Listen on port: ' + port);
})
