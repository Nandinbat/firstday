var express = require("express");
var path = require("path");
var router = express.Router();
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectId;
var jwt = require("jsonwebtoken");
var fs = require("fs");
var multer = require("multer");
var upload = multer({dest: "./public/upload/"});
var randomstring = require("randomstring")


var dbclient, db;
MongoClient.connect("mongodb://localhost:27017", {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
    dbclient = client.db("teaching");
    db = {
        User: dbclient.collection("user"),
        Post: dbclient.collection("post"),
        Event: dbclient.collection("event"),
        File: dbclient.collection("file")
    }
})

router.post("/login", async function(req, res){
    if(req.body.email && req.body.password){ // email, pw oo hiisen uguigee shalgaj baina
        if(req.body.password.length >= 6){
            let search = await db.User.findOne({email: req.body.email, password: req.body.password});
            if(search){
                let token = jwt.sign({_id: search._id}, "secretkey")
                res.json({success: true, message: "Amjilttai", data: {
                    token: token
                    }})
            } else res.json({success: false, message: "burtgelgui hereglegch"})
        } else res.json({success: false, message: "passwordoo dahin hiine uu"})
    } else res.json({success: false, message: "Email passwordoo hiine uu"});
} )

let authentication = async function(req, res, next) {
    let token = req.headers.authorization;
    if(token){
        let decoded = await jwt.verify(token, "secretkey");
        if(decoded){
            let user = await db.User.findOne({ _id: ObjectId(decoded._id)});
            if(user){
                req.user = user;
                next();
            } else res.json({success: false, message: "user oldsongui"})
        } else res.json({success: false, message: "user oldsongui"})
    } else res.json ({success: false, message: "user oldsongui"})
}

router.post("/signup", async function(req, res){
    if (req.body.email) {
        if (req.body.password) { // email, pw oo hiisen uguigee shalgaj baina
            if (req.body.password.length >= 6) {
                let search = await db.User.findOne({email: req.body.email, password: req.body.password});
                if (search) {
                    res.json({success: false, message: "burtgeltei hereglegch"})
                } else {
                    let newUser = await db.User.insertOne({email: req.body.email, password: req.body.password})
                    res.json({success: true, message:"amjilttai burtgegdlee"})
                }
            } else res.json({success: false, message: "passwordnii urt dutuu"})
        } else res.json({success: false, message: "Email passwordoo hiine uu"});
    } else res.json({success: false, message: "Email passwordoo hiine uu"});
} );

// get -> uuriin medeelliig awch bga,

router.get("/profile",  async function(req, res){
    let token = req.headers.authorization;
    if(token){
        let decoded = await jwt.verify(token, "secretkey");
        if(decoded){
            let userfound = await db.User.findOne({email: decoded.email, password: decoded.password});
            if(userfound){
                res.json({success: true, data: {
                    email : userfound.email
                }})
            } else res.json({success: false, message: "user oldsongui"})
        } else res.json({success: false, message: "user oldsongui"})
    } else res.json ({success: false, message: "user oldsongui"})

})

router.get("/event", authentication, async function(req, res){
    console.log(req.query);
    var events
    if(req.query.limit && req.query.page){
         events = await db.Event.aggregate([
            {
                $lookup: {
                    from: "user",
                    localField: "hostedby",
                    foreignField: "_id",
                    as: "hostedby"
                }
            },
            {
                $unwind: "$hostedby"
            },
            {
                $project: {
                    "hostedby.password" : 0
                }
            },
            {
                $sort: {
                    createdat : -1
                }

            },
            {
                $skip: (Number(req.query.page) - 1) * Number(req.query.limit)
            },
            {
                $limit: Number(req.query.limit)
            }
            ]
    ).toArray();
    }
    else {
         events = await db.Event.aggregate([
            {
                $lookup: {
                    from: "user",
                    localField: "hostedby",
                    foreignField: "_id",
                    as: "hostedby"
                }
            },
            {
                $unwind: "$hostedby"
            },
            {
                $project: {
                    "hostedby.password" : 0
                }
            },
            
            {
                $limit: 21
            }
            ]   
            ).toArray();
    }
    let count = await db.Event.count();


res.json({success: true, message:"Amjilttai", data: {
    events : events,
    eventcount: count
} })
});

router.post("/event", authentication, async function(req, res){
    if(req.body.title){
        if (req.body.title.length > 6){
            if (req.body.time){
                if(Number(req.body.time) > Date.now()){
                    await db.Event.insertOne({title: req.body.title, time: Number(req.body.time), hostedby: req.user._id})
                    res.json({success: true, message: "Amjilttai burtgegdlee"})
                } else res.json({success: false, message: "tsag buruu"})
            }else res.json({success: false, message: "tsag oldsongui"})
        } else res.json({success: false, message: "title buruu"})
    } else res.json({success: false, message: "title buruu"})

});

router.post("/event/:eventid", authentication, async function(req, res){
    let event = await db.Event.findOne({_id: ObjectId(req.params.eventid)})
    if(event){
        if(req.body.title){
            if(req.body.time){

                await db.Event.updateOne({_id: event._id}, {$set: {title: req.body.title, time: req.body.time}})
                res.json({success: true, message: "amjilttai"});
            }
        }

    }

})

router.post("/delete/:eventid", authentication, async function(req, res){
    let event = await db.Event.findOne({_id: ObjectId(req.params.eventid)});
    if(event){
        await db.Event.deleteOne({_id: event._id})
        res.json({success: true, message: "bolloo"})
    }
})


/*router.get("/event/:eventid", async function(req, res){
    
    let event = await db.Event.findOne({_id: ObjectId(req.params.eventid)});

    res.json({success: true, data: {
        event: event,
        }})
})
*/

router.get("/event/:eventid", async function(req, res){
    
    let event = await db.Event.findOne({_id: ObjectId(req.params.eventid)});

    if(event){
        let user = await db.User.findOne({_id: event.hostedby});
        if(user) {
            event.hostedby = user;
            res.json({success: true, message: "", data: {
                event : event
            } })
        }
    }
})

router.post("/upload", upload.single('file'), async function(req, res, next){

    let random = randomstring.generate()
    console.log(req.file, req.body);
    let splittedname = req.file.originalname.split(".");
    console.log(splittedname)

    fs.rename("./public/upload/" + req.file.filename , "./public/upload/" + random + "." + splittedname[splittedname.length - 1], async function(err){
    
        if(err){
            console.log(err)
        }
        else{
          await db.File.insertOne(
                 {
                     filename : random,
                     url : "http://localhost:3000/public/upload" + random
                 }
             )
             next();
        }
    })
},
async function(req, res){
    res.json({success:true, message: "Upload amjilttai"})
})


router.get("/profile/:userid", authentication, async function(req, res){
    let events = await db.Event.aggregate([
            {
                $match: {
                    hostedby : ObjectId(req.params.userid)
                }
            },
            {
                $lookup: {
                    from: "user",
                    localField: "hostedby",
                    foreignField: "_id",
                    as: "hostedby"
                }
            },
            {
                $unwind: "$hostedby"
            },
            {
                $project: {
                    "hostedby.password" : 0
                }
            }
        ]
    ).toArray();

    let user = await db.User.findOne({_id: ObjectId(req.params.userid)}, {$project: {password: 0}});
    res.json({success: true, data: {
        events: events,
        user: user
        }})
})






module.exports = router;