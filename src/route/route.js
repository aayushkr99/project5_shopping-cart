const express = require("express")
const router = express.Router();
const userController = require("../controller/userController")
const productController = require("../controller/productController")

router.post("/register",userController.createUser)
router.post("/login",userController.userLogin)
router.get("/user/:userId/profile",userController.getUser)
router.put("/user/:userId/profile",userController.updateUser)

router.post("/products",productController.createProduct)
router.get("/products",productController.getProducts)
router.get("/products/:productId",productController.getProductById)
router.put("/products/:productId",productController.updateProducts)
router.delete("/products/:productId",productController.deleteProduct)




module.exports = router