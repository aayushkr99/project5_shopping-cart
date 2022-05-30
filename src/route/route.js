const express = require("express")
const router = express.Router()
const middleware = require('../Middleware/auth')
const userController = require("../controller/userController")
const productController = require("../controller/productController")
const cartController = require("../controller/cartController")

router.post("/register",userController.createUser)
router.post("/login",userController.userLogin)
router.get("/user/:userId/profile",middleware.auth,userController.getUser)
router.put("/user/:userId/profile",middleware.auth,userController.updateUser)

router.post("/products",productController.createProduct)
router.get("/products",productController.getProducts)
router.get("/products/:productId",productController.getProductById)
router.put("/products/:productId",productController.updateProducts)
router.delete("/products/:productId",productController.deleteProduct)

router.post('/users/:userId/cart', middleware.auth, cartController.createCart)
router.put('/users/:userId/cart', middleware.auth, cartController.updateCart)
router.get('/users/:userId/cart', middleware.auth, cartController.getCart)
router.delete('/users/:userId/cart', middleware.auth, cartController.deleteCart)




module.exports = router