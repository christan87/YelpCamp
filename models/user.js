var mongoose = require("mongoose");
var passportLocalMongoosed = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    isAdmin: {type: Boolean, default: false}
});

UserSchema.plugin(passportLocalMongoosed);

module.exports = mongoose.model("User", UserSchema);
