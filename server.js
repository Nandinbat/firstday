var express = require("express");
var path = require("path");
var app = express();
// Expressiig heregjuulj config hiij baigaa
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectId;
var bodyParser = require("body-parser");

var firstday = require("./controller/firstday")
var api = require("./controller/api")

var jwt = require("jsonwebtoken")
var cookieParser = require("cookie-parser")

app.use(bodyParser.json({limit: '1mb'}))
app.use(cookieParser("key"));
app.use(bodyParser.urlencoded({extended: true, limit: '1mb'}));
let cors = require("cors");
app.use(cors());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



var dbclient, db;
MongoClient.connect("mongodb://localhost:27017", {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
    dbclient = client.db("teaching");
    db = {
        User: dbclient.collection("user"),
        Post: dbclient.collection("post")
    }
})

app.use("/public", express.static('public'));

app.use("/firstday", firstday);
app.use("/apiv1", api);




//let insertedInfo = await db.Post.insertOne({content: req.body.content}); //insertone gedgeeree ugugdliin sand medeelel oruulj baina
//     let post = await db.Post.findOne({_id: insertedInfo.insertedId});
//     res.json(post);
//     // res.sendFile(path.join(__dirname + "/views/thankyou.html"));  // await baiwal uildel huleegdene -
app.listen(8000, function(){
    console.log("Server is running on localhost:8000")
})
