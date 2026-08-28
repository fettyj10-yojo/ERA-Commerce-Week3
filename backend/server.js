require ("dotenv").config();
const express = require ("express");
const cors = require ("cors");
const bcrypt = require ("bcryptjs");
const jwt = require ("jsonwebtoken");
const db = require ("./db");
const {connectMongo} = require ("./mongo");
const app = express();
const PORT = 3000;

app.use (cors());
app.use (express.json());

app.get ("/", (req, res) => {
    res.json({message: "ERA Commerce API is Running"});
});

// POST /login
app.post("/login", (req, res) => {
    const {email, password} = req.body;
    if(!email || !password) {
        return res.status(400).json({message: "Email and Password are Required"});
    }
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query (sql,[email], async(err, results) => {
        if(err) return res.status(500).json({message: "Server Error"});
        if(results.length === 0) {
            return res.status(401).json({message: "Invalid Email or Password"});
        }
        const user = results [0];
        const isMatch = await bcrypt.compare (password, user.password);
        if (!isMatch) {
            return res.status(401).json({message: "Invalid Email or Password"});
        }
        const token = jwt.sign(
            {id: user.id, email: user.email, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN}
        );
        res.json({
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });
    });
});

// POST /users (register)
app.post("/users", async (req, res) => {
    const {first_name, last_name, email, password} = req.body;
    if(!first_name || !last_name || !email || !password) {
        return res.status(400).json ({message: "All Fields are Required"});
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";
        db.query(sql, [first_name, last_name, email, hashedPassword], (err, result) => {
            if(err) {
                if(err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json ({message: "Email Already Registered"});
                }
                return res.status(500).json ({message: "Server Error"});
            }
            res.status(201).json ({message: "User Registered Successfully", userId: result.insertId});
        });
    } catch (err) {
        res.status(500).json ({message: "Server Error"});
    }
});

//GET /products
app.get("/products", (req, res) => {
    const sql = "SELECT p.id, p.name, p.description, p.price, p.stock_quantity, c.name as category_name FROM products p INNER JOIN categories c ON p.category_id = c.id ORDER BY p.id ASC";
    db.query(sql, (err, results) => {if(err) return res.status(500).json({message: "Server Error"});
        res.json(results);
});
});

//GET /products/category/:categoryId
app.get("/products/category/:categoryId", (req, res) => {
    const {categoryId} = req.params;
    const sql = "SELECT p.id, p.name, p.description, p.price, p.stock_quantity, c.name AS category_name FROM products p INNER JOIN categories c ON p.category_id = c.id WHERE p.category_id = ? ORDER BY p.id ASC";
    db.query(sql, [categoryId], (err, results) => {
        if (err) return res.status(500).json ({message:"Server Error"});
        res.json(results);
    });
});

//GET /categories
app.get("/categories", (req, res) => {
    const sql = "SELECT c.id, c.name, c.description, COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id, c.name, c.description ORDER BY c.id ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({message: "Server Error"});
        res.json(results);
    });
});

async function startServer() {
    await connectMongo();
    app.listen (PORT, () => {
        console.log(`Server Running at HTTP://localhost:${PORT}`);
    });
}

startServer();