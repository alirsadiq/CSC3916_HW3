var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.promise = global.Promise;

try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}

var movieSchema = new Schema ({
    title: {type: String, required: true, index: {unique: true}},
    year: {type: String, required:true},
    genre: {
        type:string,
        required: true,
        enum: ["Action, Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Thriller", "Western"]
    },
    actors: [
        {
            actor_name: {type: String, required: true}, character_name: {type: String, required: true}
        },
        {
            actor_name: {type: String, required: true}, character_name: {type: String, required: true}
        },
        {
            actor_name: {type: String, required: true}, character_name: {type: String, required: true}
        },

    ]

});

movieSchema.pre("save", function (next) {
    var movie = this

    if (movie.actors.length < 3) {
        console.log(" You didn't enter three actors")
        var error = new ValidationError(this);
        error.errors.movie = new ValidationError("Add more members");
        next(error);
    }
    else
    {
        next();
    }
});

module.exports = mongoose.model('Movies', movieSchema);