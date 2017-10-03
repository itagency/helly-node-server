require('dotenv').load();
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var multer = require('multer')
var upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10000000, files: 1 }
});
var fs = require('fs');

var app = express();

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY
});

app.use(morgan('dev'));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json({ limit: '11mb', type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '11mb', type: 'application/x-www-form-urlencoding' }));

app.get('/', function (req, res) {
  res.send('Hello Digital Ocean!');
});

app.post('/upload', upload.single('imageFile'), function (req, res) {
  var tmp_path = req.file.path;
  var target_path = 'uploads/' + req.file.originalname;

  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on('end', function () { 
    cloudinary.uploader.upload(target_path, function (result, error) {
      if (error) throw(error);
      res.send(result);
    });
  });
  src.on('error', function (err) { console.log('error') });
});

app.listen(8080, function () {
  console.log('magic is happening on port 8080!');
});
