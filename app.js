/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , methodOverride = require('method-override')
  , serveStatic = require('serve-static')
  , errorhandler = require('errorhandler')
  , favicon = require('serve-favicon')
  , morgan = require('morgan')
  , bodyParser = require('body-parser')
  , multer = require('multer') // v1.0.5
  , upload = multer() // for parsing multipart/form-data
  , session = require("express-session")
  ;
  
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(morgan());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(methodOverride('X-HTTP-Method-Override'));
//app.use(app.router);
app.use(serveStatic(__dirname + '/public'));
app.use(serveStatic(__dirname + '/semantic'));
app.use(serveStatic(__dirname + '/models'));

// development only 
if ('development' == app.get('env')) {
  app.use(errorhandler());
}

/*
 *  express-session 모듈 사용
 */
app.use(session({
  secret : 'keyboard cat',
  resave : false,
  saveUninitialized : true
}));

/*
 * db connect pool
 */
var mysql = require('mysql');
var connectionPool;

/* TEST DB */
/*connectionPool = mysql.createPool({
  user : 'tester',
  password : 'tobehappy',
  database : 'testdb',
  host : 'testb2bdb.csrn58xktwkr.ap-northeast-1.rds.amazonaws.com', //port빼고 end-point
  port : '3306',
  connectionLimit : 20,
  waitForConnections : false
});*/

/* 운영 DB */
connectionPool = mysql.createPool({
    user : 'root',
    password : '2bhappy',
    database : 'mysqldb',
    host : 'ec2-13-125-246-85.ap-northeast-2.compute.amazonaws.com', //port빼고 end-point
    port : '3306',
    connectionLimit : 20,
    waitForConnections : false

});

//app.get('/', routes.index);
var index = require('./routes/index')(app, connectionPool);

// main route file 사용
var main = require('./routes/happyday/main')(app, connectionPool); // set route file
var user = require('./routes/mypage/user')(app, connectionPool); // set route file
var hdmain = require('./routes/happyday/hdmain')(app, connectionPool);
var detail = require('./routes/happyday/detail')(app, connectionPool);
var postlist = require('./routes/happyday/postlist')(app, connectionPool);
var mappopup = require('./routes/happyday/mappopup')(app, connectionPool);
var hdregpopup = require('./routes/happyday/hdregpopup')(app, connectionPool);
var hduppopup = require('./routes/happyday/hduppopup')(app, connectionPool);
var imageupload = require('./routes/testing/imageupload')(app, connectionPool);

var votemain = require('./routes/vote/votemain')(app, connectionPool);
var votemain = require('./routes/vote/votemain')(app, connectionPool);
var votereg = require('./routes/vote/votereg')(app, connectionPool);
var voteupdate = require('./routes/vote/voteupdate')(app, connectionPool);
var votedetail = require('./routes/vote/votedetail')(app);
var quizboard = require('./routes/quizboard/quizboard')(app);
var bestco = require('./routes/bestco/bestco')(app);
var teamschedule = require("./routes/teamschedule/calendar")(app);

var server = http.createServer(app)

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + ' : '+app.get('port'));
  
  console.log('opened server on', server.address().address + " : " + server.address().port);
  
});

module.exports = app;
