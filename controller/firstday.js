var express = require("express");
var path = require("path");
var router = express.Router();
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectId;
var jwt = require("jsonwebtoken");

var dbclient, db;
MongoClient.connect("mongodb://localhost:27017", {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
    dbclient = client.db("teaching");
    db = {
        User: dbclient.collection("user"),
        Post: dbclient.collection("post")
    }
})

router.get( "/", function(req, res){
    res.send("Hello")
})

router.get( "/about", function(req, res){
    res.send("This is about page")
})


router.get("/timer", function(req, res){
    res.render("index.ejs", {poem: "This is a poem"});
})

//Json formataar unshigdana: objectiig file helbereer uguhduu ashiglana

router.get("/json", function(req, res){
    var obj = {
        firstname: "a",
        lastname: "b"
    }
    res.json(obj);
})
//json formataar postiin medeelel garch irne
router.get("/post/:postid", async function(req, res){
    let post = await db.Post.findOne({_id: ObjectId(req.params.postid)});
    res.render("index.ejs", {poem : post.content});
})



//insertedInfo gedeg huvisagchaar function ii hariug hadgalj baina

//app.get("/userposts/:userid", async function (req, res){
//     let user = await db.User.findOne({_id: ObjectId(req.params.userid)});
//     if (user) {
//         let post = await db.Post.find({postedby: user._id}).toArray()
//         res.json(post)
//     } else res.send("oldsongui")
// })

router.get("/signup", async function (req, res) {
    res.render("signup.ejs")
})

router.post("/signup", async function (req, res){
    let user = await db.User.findOne({email: req.body.email}); // input email n re.body.email hadgalaastai baigaa
    if (user == null) {
        let insertedInfo = await db.User.insertOne({email: req.body.email, password: req.body.password});
        res.redirect("/login")
    } else res.send("burtgeltei bainaa")
})
router.get("/login", async function(req, res){
    res.render("login.ejs");
})

router.post("/login", async function(req, res){
    let user = await db.User.findOne({email: req.body.email, password: req.body.password});
    if (user) {
        let token = jwt.sign({email: user.email, password: user.password}, "secretkey");
        res.cookie('token', token, {signed:true});
        res.redirect("/profile")
    } else res.send('ta burtgelgui baina');
})

router.get("/profile", async function(req, res){
    if(req.signedCookies.token){
        let decoded = jwt.verify(req.signedCookies.token, "secretkey")
        if(decoded) {
            let user = await db.User.findOne({email: decoded.email});
            if(user){
                let posts = await db.Post.find({postedby: user._id}).toArray();
                res.render("profile.ejs", {user: {email: user.email}, posts1: posts});
            } else res.redirect("/login")
        } else res.redirect("/login")
    } else res.redirect("/login")
} )

router.get("/form", function (req, res){
    res.sendFile(path.join(__dirname + "/views/form.html"));
})


router.post("/form", async function (req, res){
    if(req.signedCookies.token) {
        let decoded = jwt.verify(req.signedCookies.token, "secretkey");
        if(decoded) {
            let user = await db.User.findOne({email: decoded.email});
            if(user){
                await db.Post.insertOne({
                    content: req.body.content,
                    postedby: user._id,
                    createdat: Date.now()
                })
                res.redirect("/profile")
            } else res.send("user oldsongui")
        } else res.send("decoded ajillagui")
    } else res.send("cookie nii token oldsongui")

})

router.get("/profile/:userid", async function (req,res){

    let user = await db.User.findOne({_id: ObjectId(req.params.userid)}); // deed taliin userid ni param iin ariin userid, stringiig objectid bolgoj huvirganga
    if(user){
        let posts = await db.Post.find({postedby: user._id}).toArray()
        res.render("profile.ejs", {user: {email: user.email}, posts1: posts})
    } else res.send("user baihgui")
})

module.exports = router;