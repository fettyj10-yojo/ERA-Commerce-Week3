require ("dotenv").config();
const express = require ("express");
const cors = require ("cors");
const bcrypt = require ("bcryptjs");
const jwt = require ("jsonwebtoken");
const db = require ("./db");
const {connectMongo, getMongo} = require ("./mongo");
const authenticateToken = require('./middleware/authenticateToken');
const authorizeRole     = require('./middleware/authorizeRole');
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
app.get("/products", authenticateToken, (req, res) => {
    const sql = "SELECT p.id, p.name, p.description, p.price, p.stock_quantity, c.name as category_name FROM products p INNER JOIN categories c ON p.category_id = c.id ORDER BY p.id ASC";
    db.query(sql, (err, results) => {if(err) return res.status(500).json({message: "Server Error"});
        res.json(results);
});
});

//GET /products/category/:categoryId
app.get("/products/category/:categoryId", authenticateToken, (req, res) => {
    const {categoryId} = req.params;
    const sql = "SELECT p.id, p.name, p.description, p.price, p.stock_quantity, c.name AS category_name FROM products p INNER JOIN categories c ON p.category_id = c.id WHERE p.category_id = ? ORDER BY p.id ASC";
    db.query(sql, [categoryId], (err, results) => {
        if (err) return res.status(500).json ({message:"Server Error"});
        res.json(results);
    });
});

app.get("/products/:id", authenticateToken, (req, res) => {
    const {id} = req.params;
    const sql = "SELECT p.id, p.name, p.description, p.price, p.stock_quantity, c.name AS category_name FROM products p INNER JOIN categories c ON p.category_id = c.id WHERE p.id = ?";
    db.query(sql, [id], async (err, results) => {
        if (err) return res.status(500).json({message: "Server Error"});
        if (results.length === 0) {
            return res.status(404).json({message: "Product Not Found"});
        }
        const product = results[0];
        try {
            const mongo = getMongo();
            const reviews = await mongo.collection("product_reviews").find({product_id: parseInt(id, 10)}).toArray();
            res.json({...product, reviews});
        } catch (mongoErr){
            res.json({...product, reviews: []});
        }
    });
});


//GET /categories
app.get("/categories", authenticateToken, (req, res) => {
    const sql = "SELECT c.id, c.name, c.description, COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id, c.name, c.description ORDER BY c.id ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({message: "Server Error"});
        res.json(results);
    });
});

// POST /products (admin only)
app.post("/products", authenticateToken, authorizeRole("admin"), (req, res) => {
    const {name, description, price, stock_quantity, category_id} = req.body;
    if (!name || price === undefined || price === null || !category_id) {
        return res.status(400).json({
            message: "name, price and category_id are required"
        });
    }

    const initialStock = stock_quantity ?? 0;
    const sql = "INSERT INTO products(name, description, price, stock_quantity, category_id) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, description ?? null, price, initialStock, category_id], async (err, result) => {
        if (err) {
            return res.status(500).json({message: "Server Error"});
        }

        try {
            const mongo = getMongo();
            await mongo.collection("inventory_logs").insertOne({
                product_id: result.insertId,
                product_name: name,
                action: "restocked",
                quantity_change: stock_quantity || 0,
                previous_stock: 0,
                new_stock: stock_quantity || 0,
                timestamp: new Date()
            });
        } catch (mongoErr) {
            console.error("Mongo Failed to create inventory log:", mongoErr.message);
        }
         res.status(201).json({
            message: "Product Created Successfully",
            productId: result.insertId
        });
    });
});

// POST /orders
app.post("/orders", authenticateToken, (req, res) => {
    const {items} = req.body || {};
    const userId = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({message: "Order must contain at least 1 item"});
    }

    const invalidItem = items.some(({product_id, quantity}) =>
        !Number.isInteger(Number(product_id)) || Number(product_id) <= 0 ||
        !Number.isInteger(Number(quantity)) || Number(quantity) <= 0
    );
    if (invalidItem) {
        return res.status(400).json({
            message: "Each item must have a valid product_id and a positive integer quantity"
        });
    }

    db.beginTransaction(async (transactionErr) => {
        if (transactionErr) {
            return res.status(500).json({message: "Server Error"});
        }

        try {
            const orderItems = [];
            let totalCents = 0;

            // Step One: Calculate Total
            // Read prices from MySQL instead of trusting client-supplied prices.
            for (const item of items) {
                const productId = Number(item.product_id);
                const quantity = Number(item.quantity);
                const products = await new Promise((resolve, reject) => {
                    db.query(
                        "SELECT id, price FROM products WHERE id = ? FOR UPDATE",
                        [productId],
                        (err, results) => err ? reject(err) : resolve(results)
                    );
                });

                if (products.length === 0) {
                    const error = new Error(`Product ${productId} not found`);
                    error.status = 404;
                    throw error;
                }

                const priceCents = Math.round(Number(products[0].price) * 100);
                if (!Number.isFinite(priceCents) || priceCents < 0) {
                    throw new Error(`Invalid price for product ${productId}`);
                }

                const subtotalCents = priceCents * quantity;
                totalCents += subtotalCents;
                orderItems.push({
                    product_id: productId,
                    quantity,
                    price_at_purchase: (priceCents / 100).toFixed(2),
                    subtotal: (subtotalCents / 100).toFixed(2)
                });
            }

            // Step Two: Insert into orders
            const orderSql = "INSERT INTO orders (user_id, total_amount) VALUES (?, ?)";
            const orderResult = await new Promise((resolve, reject) => {
                db.query(orderSql, [userId, (totalCents / 100).toFixed(2)], (err, result) => {
                    if (err) reject(err); else resolve(result);
                });
            });
            const orderId = orderResult.insertId;

            // Step Three: Insert order_items and update stock
            for (const item of orderItems) {
                const {product_id, quantity, price_at_purchase, subtotal} = item;
                const itemSql = "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES (?, ?, ?, ?, ?)";

                await new Promise((resolve, reject) => {
                    db.query(itemSql, [orderId, product_id, quantity, price_at_purchase, subtotal], (err, result) => {
                        if (err) reject(err); else resolve(result);
                    });
                });

                await new Promise((resolve, reject) => {
                    const stockSql = "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?";
                    db.query(stockSql, [quantity, product_id, quantity], (err, result) => {
                        if (err) return reject(err);
                        if (result.affectedRows === 0) {
                            const error = new Error(`Insufficient stock for product ${product_id}`);
                            error.status = 409;
                            return reject(error);
                        }
                        resolve(result);
                    });
                });
            }

            // Step Four: Commit
            db.commit(async (commitErr) => {
                if (commitErr) {
                    return db.rollback(() => {
                        res.status(500).json({message: "Commit Failed"});
                    });
                }

                // Step Five: Auto-log to MongoDB after commit
                try {
                    const mongo = getMongo();
                    await mongo.collection("inventory_logs").insertMany(
                        orderItems.map((item) => ({
                            product_id: item.product_id,
                            action: "sold",
                            quantity_change: -item.quantity,
                            timestamp: new Date()
                        }))
                    );
                } catch (mongoErr) {
                    console.error("MongoDB log failed:", mongoErr.message);
                }

                res.status(201).json({message: "Order Placed", orderId});
            });
        } catch (err) {
            // Step Six: Roll back on any error
            db.rollback(() => {
                const status = err.status || 500;
                const message = err.status ? err.message : "Order Failed";
                res.status(status).json({message});
            });
        }
    });
});

//GET/orders
app.get("/orders", authenticateToken, (req, res) => {
    let sql;
    let params;
    
    if(req.user.role === "admin"){
        sql = "SELECT o.id, o.status, o.total_amount, o.created_at, u.first_name, u.last_name, u.email, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count FROM orders o INNER JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC";
        params = [];
    } else {
        sql = "SELECT o.id, o.status, o.total_amount, o.created_at, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC";
        params = [req.user.id];
    }
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({message:"Server Error"});
        res.json(results);
    });
});

//GET /orders/my - current user orders
app.get("/orders/my", authenticateToken, (req, res) =>{
    const sql = "SELECT o.id, o.status, o.total_amount, o.created_at, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC";
    db.query(sql, [req.user.id], (err, results) => {
        if(err) return res.status(500).json ({message: "Server Error"});
        res.json(results);
    });
});

//GET /orders/:id - single order
app.get("/orders/:id", authenticateToken, (req, res) =>{
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({message: "Invalid order ID"});
    }

    let sql = "SELECT o.id, o.status, o.total_amount, o.created_at, u.first_name, u.last_name, u.email, oi.id AS item_id, oi.quantity, oi.price_at_purchase, oi.subtotal, p.name AS product_name FROM orders o INNER JOIN users u ON u.id = o.user_id LEFT JOIN order_items oi ON oi.order_id = o.id LEFT JOIN products p ON p.id = oi.product_id WHERE o.id = ?";
    const params = [orderId];

    // Customers can only view their own orders; admins can view any order.
    if (req.user.role !== "admin") {
        sql += " AND o.user_id = ?";
        params.push(req.user.id);
    }
    sql += " ORDER BY oi.id ASC";

    db.query(sql, params, (err, results) => {
        if(err) return res.status(500).json ({message:"Server Error"});
        if(results.length === 0){
            return res.status(404).json ({
                message: "Order Not Found"
            });
        }

        const firstRow = results[0];
        res.json({
            id: firstRow.id,
            status: firstRow.status,
            total_amount: firstRow.total_amount,
            created_at: firstRow.created_at,
            customer: {
                first_name: firstRow.first_name,
                last_name: firstRow.last_name,
                email: firstRow.email
            },
            items: results
                .filter((row) => row.item_id !== null)
                .map((row) => ({
                    item_id: row.item_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    price_at_purchase: row.price_at_purchase,
                    subtotal: row.subtotal
                }))
        });
    });
});

// POST /reviews
app.post("/reviews", authenticateToken, async (req, res) => {
    const {product_id, rating, review_text} = req.body;

    if (product_id === undefined || rating === undefined || !review_text?.trim()) {
        return res.status(400).json({message: "Product ID, Rating, and Review Text are Required"});
    }

    const productId = Number(product_id);
    const numericRating = Number(rating);
    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({message: "Product ID must be a positive integer"});
    }
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({message: "Rating must be between 1 and 5"});
    }

    try {
        const products = await new Promise((resolve, reject) => {
            db.query("SELECT id FROM products WHERE id = ?", [productId], (err, results) => {
                if (err) reject(err); else resolve(results);
            });
        });
        if (products.length === 0) {
            return res.status(404).json({message: "Product Not Found"});
        }

        const mongo = getMongo();
        const result = await mongo.collection("product_reviews").insertOne({
            product_id: productId,
            user_id: req.user.id,
            first_name: req.user.email.split("@")[0],
            rating: numericRating,
            review_text: review_text.trim(),
            created_at: new Date()
        });

        res.status(201).json({message: "Review Submitted", reviewId: result.insertedId});
    } catch (err) {
        console.error("Review submission failed:", err.message);
        res.status(500).json({message: "Unable to submit review"});
    }
});

async function startServer() {
    await connectMongo();
    app.listen (PORT, () => {
        console.log(`Server Running at HTTP://localhost:${PORT}`);
    });
}

startServer();
