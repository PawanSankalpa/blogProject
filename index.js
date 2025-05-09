import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import { render } from "ejs";

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000" // Base URL of the API server providing post data

// Set EJS as the templating engine
app.set("view engine", "ejs")

// Middleware to serve static files and parse request bodies
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

/* ----------- Page Rendering Routes ----------- */

// Home Page
//Fetches all blog posts from the API server and renders them on the home page
app.get("/", async(req, res) => {
    try {
        const response = await axios.get(`${API_URL}/posts`);
        const posts = response.data.data;
        console.log(response.data.message) // logs: ✅ Successfully fetched all posts
        res.render("home.ejs", { posts });
    } catch (error) {
        console.log("Failed! to fetch the posts", error.message)
        res.sendStatus(404);
    }   
});

// Register/LogIn Selector Page
// Renders a page that lets the user choose to register or log in
app.get("/register_logIn", (req, res) => {
        res.render("register-logIn.ejs")
    }
);

// New Post Form Page
// Renders a form where users can create a new blog post
app.get("/newPost", (req, res) => {
        res.render("post-form.ejs")
    }
);

// Log In Page
// Renders the login form
app.get("/register_logIn/logIn", (req, res) => {
        res.render("logIn.ejs");
    }
);

// Register Page
// Renders the registration form
app.get("/register_logIn/register", (req, res) => {
        res.render("register.ejs")
    }
);

// Edit Page
// Renders the edit form
app.get("/posts/edit", async(req, res) => {
    try {
        const postId = req.query.postId;
        const response = await axios.get(`${API_URL}/posts/singlePost/${postId}`);
        const post = response.data.data;
        res.render("edit.ejs", { post });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong with the server",
        });
    }
     
});

/* form submiting routes */
//newForm page(new Post)
app.post("/api/newPost", async(req, res) => {
    try {
        const response = await axios.post(`${API_URL}/posts/add_newPost`, req.body);
        const data = response.data;
        console.log(data.message);
        res.redirect("/");
    } catch (error) {
        console.log("Failed! to Post the new post.", error.message);
        res.sendStatus(500);
    }
});

// register a user
app.post("/register_logIn/register/api/newUser", async(req, res) => {
    try {
        const response = await axios.post(`${API_URL}/users/register`, req.body);
        const data = response.data;
        console.log(data.message);
        console.log(data.data);
        res.redirect("/");
    } catch (error) {
        console.log("Failed! to register the user.", error.message);
        res.sendStatus(500);
    }
});

//log in a user
app.post("/register_logIn/logIn/api/logInUser", async(req, res) => {
    try {
        const response = await axios.post(`${API_URL}/users/logIn`, req.body)
        const { message, data } = response.data;
        console.log("Login successfull!", message);
        console.log("User data: ", data);
        res.redirect("/")   
    } catch (error) {
        console.log("Failed! to log in the user.", error.message);
        res.sendStatus(500);
    }
});

//edit Post
app.post("/api/post/editPost", async(req, res) => {
    try {
        const postId = req.body.postId;
        const response = await axios.patch(`${API_URL}/posts/edit/${postId}`, req.body);
        const { message, data } = response.data;
        console.log(message, data);
        res.redirect("/")
    } catch (error) {
        console.log("Failed! to edit the post.", error.message);
        res.sendStatus(500);
    }
});


/*-------------delete handling -------------- */
app.post("/api/posts/delete", async(req, res) => {
    try {
        const postId = req.body.postId;
        const response = await axios.delete(`${API_URL}/posts/delete/${postId}`);
        const data = response.data;

        console.log(`Successfully deleted. ${data}`);
        res.redirect("/");
    } catch (error) {
        console.log("Failed! to delete the post.", error.message);
        res.sendStatus(500);
    }
});


// Start the server
app.listen(port, () => {
    console.log(`server running on the port: ${port}`)
});

