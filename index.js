import express from "express";
import bodyParser from "body-parser";
// import axios from "axios";
import { render } from "ejs";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import GoogleStrategy from "passport-google-oauth2";
import pgSession from "connect-pg-simple";

env.config();

const app = express();
const port = 3000;
const PgSession = pgSession(session);

const saltRounds = 10;

let posts = [];



const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: true,
});

db.connect()
  .then(async() => {
    console.log("✅ Database connected successfully!");
    const result = await db.query("SELECT * FROM posts");
    posts = result.rows;
  })
  .catch((err) => {
    console.error("❌ Failed to connect to the database:", err);
  });



app.use(
  session({
    store: new PgSession({
      pool: db, // your existing PostgreSQL pool
      tableName: "session", // name of table to store sessions
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30 , // 30 days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Middleware to serve static files and parse request bodies
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/* ----------- Page Rendering Routes ----------- */

// Home Page
//Fetches all blog posts from the API server and renders them on the home page
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM posts");
    posts = result.rows;
    res.render("home.ejs", { posts, user: req.user });
  } catch (error) {
    console.log("Failed! to fetch the posts", error.message);
    res.sendStatus(404);
  }
});

// Register/LogIn Selector Page
// Renders a page that lets the user choose to register or log in
app.get("/register_login", (req, res) => {
  res.render("register-logIn.ejs");
});

// New Post Form Page
// Renders a form where users can create a new blog post
app.get("/newPost", (req, res) => {
  res.render("post-form.ejs");
});

// Log In Page
// Renders the login form
app.get("/login", (req, res) => {
  res.render("logIn.ejs");
});

// Register Page
// Renders the registration form
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

// User posts page
app.get("/user_posts", async(req, res) => {
    const username = req.query.username;
    try {
        const myPostsRaw = await db.query("SELECT * FROM posts WHERE username = $1", [
            username
        ]);

        const myPosts = myPostsRaw.rows;
        res.render("userPage.ejs", { myPosts });

    } catch (error) {
        console.log("Failed! to fetch the posts", error.message);
        res.sendStatus(404);
    }
})

app.get("/back_to_mainPage", (req, res) => {
    res.redirect('/'); 
});

app.post("/user_posts/delete", async(req, res) => {
    const postId = req.body.postId;
    const username = req.user.username;

    try {
        const result = await db.query("DELETE FROM posts WHERE post_id = $1 RETURNING *", 
            [postId]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("Post not found");
        }

        const updatedPosts = await db.query("SELECT * FROM posts WHERE username = $1", 
            [username]
        );
        const myPosts = updatedPosts.rows;

        res.render("userPage.ejs", { myPosts });


    } catch (error) {
        console.log("Failed! to delete the posts", error.message);
        res.sendStatus(404);
    }
});

// edit page
app.get("/user_posts/edit", async(req, res) => {
  const postId = req.query.postId;
  try {
    
    const postRaw = await db.query("SELECT * FROM posts WHERE post_id = $1", 
      [postId]
    );

    if (postRaw.rowCount === 0) {
      return res.status(404).send("Post not found");
    }

    const post = postRaw.rows[0];

    res.render("edit.ejs", { post });


  } catch (error) {
    console.log("Failed! to load the edit page", error.message);
    res.sendStatus(404);
  }
});

// edit
app.post("/user_posts/edit", async(req, res) => {
  const { postId, title, description } = req.body;

  try {
    
    const result = await db.query("UPDATE posts SET title = $1, content = $2 WHERE post_id = $3 RETURNING *",
      [title, description, postId]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Post not found");
    }

    res.redirect("/");


  } catch (error) {
    console.log("Failed! to edit the page", error.message);
    res.sendStatus(404);
  }
})




// // Edit Page
// // Renders the edit form
// app.get("/posts/edit", async (req, res) => {
//   try {
//     const postId = req.query.postId;
//     const response = await axios.get(`${API_URL}/posts/singlePost/${postId}`);
//     const post = response.data.data;
//     res.render("edit.ejs", { post });
//   } catch (error) {
//     res.status(500).json({
//       message: "Something went wrong with the server",
//     });
//   }
// });

// /* form submiting routes */
// //newForm page(new Post)
// app.post("/api/newPost", async (req, res) => {
//   try {
//     const response = await axios.post(`${API_URL}/posts/add_newPost`, req.body);
//     const data = response.data;
//     console.log(data.message);
//     res.redirect("/");
//   } catch (error) {
//     console.log("Failed! to Post the new post.", error.message);
//     res.sendStatus(500);
//   }
// });

// // register a user
// app.post("/register_logIn/register/api/newUser", async (req, res) => {
//   try {
//     const response = await axios.post(`${API_URL}/users/register`, req.body);
//     const data = response.data;
//     console.log(data.message);
//     console.log(data.data);
//     res.redirect("/");
//   } catch (error) {
//     console.log("Failed! to register the user.", error.message);
//     res.sendStatus(500);
//   }
// });

// //log in a user
// app.post("/register_logIn/logIn/api/logInUser", async (req, res) => {
//   try {
//     const response = await axios.post(`${API_URL}/users/logIn`, req.body);
//     const { message, data } = response.data;
//     console.log("Login successfull!", message);
//     console.log("User data: ", data);
//     res.redirect("/");
//   } catch (error) {
//     console.log("Failed! to log in the user.", error.message);
//     res.sendStatus(500);
//   }
// });

// //edit Post
// app.post("/api/post/editPost", async (req, res) => {
//   try {
//     const postId = req.body.postId;
//     const response = await axios.patch(
//       `${API_URL}/posts/edit/${postId}`,
//       req.body
//     );
//     const { message, data } = response.data;
//     console.log(message, data);
//     res.redirect("/");
//   } catch (error) {
//     console.log("Failed! to edit the post.", error.message);
//     res.sendStatus(500);
//   }
// });

// /*-------------delete handling -------------- */
// app.post("/api/posts/delete", async (req, res) => {
//   try {
//     const postId = req.body.postId;
//     const response = await axios.delete(`${API_URL}/posts/delete/${postId}`);
//     const data = response.data;

//     console.log(`Successfully deleted. ${data}`);
//     res.redirect("/");
//   } catch (error) {
//     console.log("Failed! to delete the post.", error.message);
//     res.sendStatus(500);
//   }
// });

/**  ----------------Updated version------------------------------- */

//register
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  //console.log("Incoming form data:", req.body);

  try {
    const existingUsername = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({
        // 404 - not found, 400 - bad request
        message: "Username already exists. Try a different one",
      });
    }

    const existingEmail = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({
        message: "This Email already exists, try login",
      });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );

    if (user.rows.length === 0) {
      return res.status(500).json({
        message: "Problem with inserting the user details into the database",
      });
    }
    console.log("User inserted:", user.rows[0]);

    res.redirect("/login");
  } catch (error) {
    console.error(
      "Error during user registration:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Error during registering." });
  }
});

// login
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

/** ----------- Blog post section ------------ */

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// newPost
app.post("/newPost", isLoggedIn, async (req, res) => {
  const { title, description } = req.body;

  const userId = req.user.id;

  if (!userId) {
    return res.redirect("/register_login");
  }

  const username = req.user.username;

  try {
    const blogPost = await db.query(
      "INSERT INTO posts (user_id, content, title, username) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, description, title, username]
    );

    if (!blogPost.rows[0]) {
      return res.redirect("/newPost").status(400).json({
        message: "problem with inserting the new blog post",
      });
    }

    res.redirect("/")


  } catch (error) {
    console.error(
      "Error during posting the new post:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Error during posting a post." });
  }


});

/** ----------- Passport strategy section ------------ */
//Local passport strategy
passport.use(
  new Strategy(
    { usernameField: "email" },
    async function verify(email, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        email,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password_hash;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            //Error with password check
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              //Passed password check
              return cb(null, user);
            } else {
              //Did not pass password check
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

// ------     -------------
passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]);
    } else {
      cb(new Error("User not found"));
    }
  } catch (err) {
    cb(err);
  }
});
// ---------  -------------

// Start the server
app.listen(port, () => {
  console.log(`server running on the port: ${port}`);
});
