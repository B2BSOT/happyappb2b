'use strict';

var fs = require('fs')
var path = require('path')
var Sequelize = require('sequelize');
var sequelize = new Sequelize(
  'mysqldb', 
  'root', 
  '2bhappy'
  , {
    host: 'ec2-13-125-246-85.ap-northeast-2.compute.amazonaws.com', //port빼고 end-point
    dialect: 'mysql',
  
    pool: {
      max: 20,
      min: 0,
      idle: 10000
    } 
  });

var db = {}

fs.readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(function(file) {
        var model = sequelize['import'](path.join(__dirname, file));
        db[model.name] = model;
    }); 

/* db['quizboard'] = sequelize.import(path.join(__dirname, 'quizboard.js'));*/

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;



