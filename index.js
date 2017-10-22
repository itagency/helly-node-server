require('dotenv').load();
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var multer = require('multer');
var winston = require('winston');
var fs = require('fs');
var cloudinary = require('cloudinary');

var app = express();

var upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10000000, files: 1, fields: 2 }
});

cloudinary.config({
  cloud_name: process.env.NODE_ENV === 'production' ? process.env.CLOUDINARY_NAME : process.env.STAGING_CLOUDINARY_NAME,
  api_key: process.env.NODE_ENV === 'production' ? process.env.CLOUDINARY_API_KEY : process.env.STAGING_CLOUDINARY_API_KEY,
  api_secret: process.env.NODE_ENV === 'production' ? process.env.CLOUDINARY_SECRET_KEY : process.env.STAGING_CLOUDINARY_SECRET_KEY
});

var logger = new (winston.Logger)({
  level: 'verbose',
  transports: [
    new (winston.transports.Console)({
      timestamp: true
    }),
    new (winston.transports.File)({
      filename: process.cwd() + '/logs\/server.log',
      timestamp: true
    })
  ]
});

var APP_URL = process.env.NODE_ENV === 'production' ? 'https://hellyhansen.itagency.ca/' : 'http://localhost:3000';

app.use(morgan('dev'));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", APP_URL);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json({ limit: '11mb', type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '11mb', type: 'application/x-www-form-urlencoding' }));

app.get('/get_images', function(req, res) {
  var cursor = req.query.next_cursor;
  logger.log('info', 'nextcursor: ' + cursor);
  cloudinary.v2.api.resources({ max_results: 15, next_cursor: cursor, context: true }, function (error, result) {
    if (error) {
      logger.log('error', 'cloudinary error: ' + error);
      res.status(404);
      res.json(error);
    }
    logger.log('info', 'res.next_cursor: ' + result.next_cursor);
    res.json({ images: result.resources, next_cursor: result.next_cursor });
  })
});

app.post('/upload', upload.single('imageFile'), function (req, res) {
  var tmp_path = req.file.path;
  var target_path = './uploads/' + req.file.originalname;

  logger.log('info', 'target_path: ' + target_path);

  // console.log(tmp_path);
  // console.log(target_path);
  var name = req.body.name;
  var description = req.body.description;

  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on('end', function () {
    cloudinary.v2.uploader.upload(target_path, {
      context: {
        alt: name,
        caption: description
      }
    }, function (error, result) {
      if (error) {
        logger.log('error', 'cloudinary error: ' + error);
        res.send(error)
      };
      fs.unlink(tmp_path, function(err) {
        if (err) {
          logger.error('failed to delete local image: ' + err);
          console.log('failed to delete local image: ' + err);
        } else {
          logger.info('successfully deleted local image');
          console.log('successfully deleted local image');
        }
      });
      fs.unlink(target_path, function (err) {
        if (err) {
          logger.error('failed to delete other local image: ' + err);
          console.log('failed to delete local image: ' + err);
        } else {
          logger.info('successfully deleted the other local image');
          console.log('successfully deleted the other local image');
        }
      });
      res.send({redirect: '/'});
    });
  });
  src.on('error', function (err) { logger.error('file read/write error: ' + err) });
});

app.listen(8080, function () {
  console.log('magic is happening on port 8080!');
});
