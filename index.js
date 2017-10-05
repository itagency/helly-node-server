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

var port = process.env.PORT || 8080;

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
  res.send('...');
});

app.get('/get_images', function(req, res) {
  // console.log(req);
  cloudinary.v2.api.resources(function(error, result) {
    if (error) {
      res.status(404);
      res.json(error);
    }
    res.json(result.resources);
  })
});

app.post('/upload', upload.single('imageFile'), function (req, res) {
  var tmp_path = req.file.path;
  var target_path = './uploads/' + req.file.originalname;

  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on('end', function () { 
    cloudinary.v2.uploader.upload(target_path, function (error, result) {
      if (error) res.send(error);
      fs.unlink(target_path, function(err) {
        if (err) {
          console.log('failed to delete local image: ' + err);
        } else {
          console.log('successfully deleted local image');
        }
      });
      res.status(200);
      res.redirect('https://hellyhansen.itagency.ca/');
    });
  });
  src.on('error', function (err) { console.log('error') });
});

app.listen(port, function () {
  console.log('magic is happening on port 8080!');
});
