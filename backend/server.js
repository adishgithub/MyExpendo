// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();


// Middleware (things that happen between request and response)
app.use(cors()); // Allow other apps to connect
app.use(express.json()); // Automatically parse JSON data

// SETUP ENVIRONMENT VARIABLES
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || 'http://localhost';
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔧 Starting server...');

app.get('/', (req, res) => {
  res.send('Hello, MyExpendo!');
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${DOMAIN}:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  })

// Import routes
const authRoutes = require('./routes/auth');
const expenseCategoryRoutes = require('./routes/expense_category_routes');
const incomeCategoryRoutes = require('./routes/income_category_routes');
const productCategoryRoutes = require('./routes/product_category_routes');
const serviceCategoryRoutes = require('./routes/service_category_routes');
const incomeListRoutes = require('./routes/income_routes');
const expenseListRoutes = require('./routes/expense_routes');
const toBuyRoutes = require('./routes/to_buy_routes');

// Use routes
app.use('/api/user', authRoutes);
app.use('/api/expenseCategory', expenseCategoryRoutes);
app.use('/api/incomeCategory', incomeCategoryRoutes);
app.use('/api/productCategory', productCategoryRoutes);
app.use('/api/serviceCategory', serviceCategoryRoutes);
app.use('/api/incomeList', incomeListRoutes);
app.use('/api/expenseList', expenseListRoutes);
app.use('/api/toBuyList/', toBuyRoutes);


