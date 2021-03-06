var mongoose = require("mongoose");
var Comment = require("./comment.js");

//--SCHEMA STUP
var campgroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String, 
    imageId: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {type: Date, default: Date.now},
    author :{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        avatar: String
    },
    
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]  //speculative add
});

module.exports = mongoose.model("Campground", campgroundSchema);