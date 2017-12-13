var express         = require("express");
var bodyParser      = require('body-parser');
var mongoose        = require('mongoose');

var app             = express();
var Schema          = mongoose.Schema;
// Use native promises
mongoose.Promise    = global.Promise;


app.set('views', __dirname + '/views'); 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/static"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost/MessageBoardDB');

// define Post schema
var PostSchema = new mongoose.Schema({
 name: {type: String, required: true},
 text: {type: String, required: true }, 
 _comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}]
 
}, {timestamps: true }, { usePushEach: true });

// define Comment Schema
var CommentSchema = new mongoose.Schema({
 name: {type: String, required: true},
 _post: {type: Schema.Types.ObjectId, ref: 'Post'},
 text: {type: String, required: true }
}, {timestamps: true }, { usePushEach: true });

// set our models by passing them their respective Schemas
mongoose.model('Post', PostSchema);
mongoose.model('Comment', CommentSchema);

// store our models in variables
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

app.get('/', function(req, res) {
    
    Post.find({}).                               
    populate('_comments').exec(function(err, posts){                    
      console.log(posts);
      res.render('index', {posts: posts})
    });
});

app.listen(8000,function(){
    console.log("Listening on port 8000");
});

app.post('/posts', function(req, res) {
    console.log(req.body);
    var new_post = new Post(req.body);
    //console.log(new_post);
    new_post.save().then(function(new_post){
        console.log("Created new post: ", new_post);
        res.redirect('/');
    }).catch(function (err) {
        console.log("Error while saving the post ", err);
    });
});

app.post('/comments/:id', function(req, res){
    var id = req.params.id;

    Post.findOne({_id: id}, function(err, post){
        console.log("Found post: ", post);
        // data from form on the front end
        var comment = new Comment(req.body);
        //  set the reference like this:
        comment._post = post._id;
        // now save both to the DB
        comment.save(function(err){
            if (!err) {
                post._comments.push(comment);

                post.save(function(err){
                    if(err) {
                        console.log('Error while saving comment: ', err);
                    } else {
                        console.log("Saved comment");
                        res.redirect('/');
                    }
                });
            } else {
                console.log("Error while saving the comment ", err);
            }
            
         });
    });
});

