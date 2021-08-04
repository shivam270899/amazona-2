const mongoose = require("mongoose");

var mongoURL = 'mongodb+srv://amazona:amazona@cluster0.czbv1.gcp.mongodb.net/amazona'

mongoose.connect(mongoURL, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true});

var db = mongoose.connection;

db.on('connected', () => console.log("mongodb connection successfull"));

db.on('error', () => console.log("mongodb connection fail"));

module.exports = mongoose;