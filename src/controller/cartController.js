const userModel = require('../model/userModel')
const ProductModel = require('../model/productModel')
const cartModel = require('../model/cartModel')
const validation = require('../Validation/validation')
const jwt = require("jsonwebtoken")



// ******************************************************** POST /users/:userId/cart ******************************************************* //
const createCart = async (req, res) => {
    try {
    const userId = req.params.userId;
    const data = req.body;
let {cartId,productId,quantity} = data; 

if(!validation.isValidRequestBody(data)){
    return res.status(400).send({ status: false, message: "Oops you forgot to enter details" });
}  

if(!validation.isValidObjectId(userId)){
    return res.status(400).send({ status: false, message: "UsertId is Not Valid" });
}

let userIdFromToken =  req.decodedToken.userId
if(userIdFromToken !== userId){
    return res.status(403).send({status : false , msg : "unauthorized"})
}

const findUser = await userModel.findById({ _id: userId})

if(!findUser){
  return res.status(404).send({ status: false, message: "User not found" });
}

if(!productId){
    return res.status(400).send({ status: false, message: "ProductId is Required" });

}
if(!validation.isValidObjectId(productId)){
    return res.status(400).send({ status: false, message: "ProductId is Not Valid" });
} 
 
let findProduct = await ProductModel.findOne({_id:productId,isDeleted:false})

if(!findProduct){
    return res.status(404).send({ status: false, message: "Product not found" });
}

if(!quantity){
    quantity =1
   // return res.status(400).send({ status: false, message: "Quantity is Required" });
}
if(quantity)
if(typeof quantity != "number" || quantity<=0){
    return res.status(400).send({ status: false, message: "Enter valid Quantity" });
}
if(!cartId){
    let cart = await cartModel.findOne({userId:userId})
    if(cart){
        return res.status(400).send({status:false,message:`${cart.userId} with this userId cart is already present ${cart._id} this is your cart id `})
    }
    if (!cart) {
        const addToCart = {
            userId:userId,
            items: {
                productId: productId,
                quantity: quantity
            },
            totalPrice: findProduct.price * quantity,
            totalItems: 1
        }

        const newCart = await cartModel.create(addToCart)
        return res.status(201).send({ status: true, message: "Success", data: newCart })
    }
}

if(cartId){
if(!validation.isValidObjectId(cartId)){
    return res.status(400).send({ status: false, message: "CartId is Not Valid" });
}

const correctCartId =await cartModel.findOne({userId:userId})
if(correctCartId)
if(correctCartId._id != cartId){
    return res.status(400).send({ status: false, message: "CartId is Not match" });
}


const findCart =await cartModel.findOne({_id:cartId})
if(!findCart){
    return res.status(404).send({ status: false, message: "Cart not exist with this id so create cart first" });
}


if(findCart.userId !=userId){
    return res.status(400).send({status:false,message:"Make sure UserId and cartId are correct"})} 
    
if (findCart) {

    //to increase quantity
    for (let i = 0; i < findCart.items.length; i++) {

        if (`${findCart.items[i].productId}` == findProduct._id) {
            findCart.items[i].quantity = findCart.items[i].quantity + quantity
            findCart.totalPrice = (findProduct.price * quantity) + findCart.totalPrice
            findCart.totalItems = findCart.items.length
            findCart.save()
            return res.status(201).send({ status: true, message: `Quantity of ${findCart.items[i].productId} increases`, data: findCart })
        }
    }

    //add new item in cart
    findCart.items[(findCart.items.length)] = { productId: productId, quantity: quantity }
    findCart.totalPrice = (findProduct.price * quantity) + findCart.totalPrice
    findCart.totalItems = findCart.items.length
    findCart.save()
    return res.status(201).send({ status: true, message: `New product ${findProduct._id} added in cart`, data: findCart })
}
}
}
catch (err) {
    console.log(err)
    res.status(500).send({ status: false, error: err.message })
  }  
}



module.exports.createCart = createCart

// ******************************************************** PUT /users/:userId/cart ******************************************************* //

const updateCart = async function(req,res) {
    try{
        // Validate body
        const body = req.body
        if(!validation.isValid(body)) {
            return res.status(400).send({ status: false, message: "Product details must be present"})
        }

        // Validate query (it must not be present)
        const query = req.query;
        if(validation.isValidRequestBody(query)) {
            return res.status(400).send({ status: false, message: "Invalid request"});
        }

        // Validate params
        const userId = req.params.userId;
        if(!validation.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid parameters"});
        }

        // To check user present or not
        const userSearch = await userModel.findById({_id:userId})
        if(!userSearch) {
            return res.status(400).send({status: false, message: "userId does not exist"})
        }

        // AUTHORISATION
        let userIdFromToken =  req.decodedToken.userId
        if(userIdFromToken !== userId){
            return res.status(403).send({status : false , msg : "unauthorized"})
        }

        const {cartId, productId, removeProduct} = body

        // Validate cartId
        if(!validation.isValid(cartId)) {
            return res.status(400).send({status: false, message: "CartId is required"})
        }

        // Validation of cartId
        if(!validation.isValidObjectId(cartId)) {
            return res.status(400).send({status: false, message: "Invalid cartId"})
        }

        // Validate productId
        if(!validation.isValid(productId)) {
            return res.status(400).send({status: false, message: "productId is required"})
        }

        // Validation of productId
        if(!validation.isValidObjectId(productId)) {
            return res.status(400).send({status: false, message: "Invalid productId"})
        }

        // Validate removeProduct
        if(!validation.isValid(removeProduct)) {
            return res.status(400).send({status: false, message: "removeProduct is required"})
        }


        //1. Check the cart is present 
        const cartSearch = await cartModel.findOne({_id: cartId})
        if(!cartSearch) {
            return res.status(404).send({status: false, message: "Cart does not exist"})
        }

        //2. Check the product is present
        const productSearch = await ProductModel.findOne({ _id: productId})
        if(!productSearch) {
            return res.status(404).send({status: false, message: "product does not exist"})
        }
        // Check product if it is already deleted(isDeleted == true)
        if(productSearch.isDeleted !== false) {
            return res.status(400).send({status: false, message: "Product is already deleted"})
        }

        // 3. Check remove product

        // Validation of removeProduct
        if(!validation.isValidremoveProduct(removeProduct)) {
            return res.status(400).send({status: false, message: "Invalid remove product"})
        }

        const cart = cartSearch.items
        for(let i=0; i<cart.length; i++) {
            if(cart[i].productId == productId) {
                const priceChange = cart[i].quantity * productSearch.price
                if(removeProduct == 0) {
                    const productRemove = await cartModel.findOneAndUpdate({_id: cartId}, {$pull: {items:{productId: productId}}, totalPrice: cartSearch.totalPrice-priceChange, totalItems: cartSearch.totalItems - 1}, {new:true})
                    return res.status(200).send({status: true, message: "Removed product successfully", data: productRemove})
                }

                if(removeProduct == 1) {
                    if(cart[i].quantity == 1 && removeProduct == 1) {
                        const priceUpdate = await cartModel.findOneAndUpdate({_id: cartId}, {$pull: {items: {productId}}, totalPrice:cartSearch.totalPrice-priceChange, totalItems:cartSearch.totalItems - 1}, {new: true})
                        return res.status(200).send({status: true, message: "Successfully removed product or cart is empty", data: priceUpdate})
                    }

                    cart[i].quantity = cart[i].quantity - 1
                    const updatedCart = await cartModel.findByIdAndUpdate({_id: cartId}, {items: cart, totalPrice:cartSearch.totalPrice -productSearch.price}, {new: true})
                    return res.status(200).send({status: true, message: "sucessfully decremented the product", data: updatedCart})
                }
            }
        }
        
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ message: "Error", error: err.message })
    }
}

module.exports.updateCart = updateCart








// ******************************************************** GET /users/:userId/cart ******************************************************* //

const getCart = async function(req,res) {
    try{
         // Validate of body(It must not be present)
         const body = req.body;
         if(validation.isValidRequestBody(body)) {
             return res.status(400).send({ status: false, message: "Body must not be present"})
         }
         
 

         // Validate query (it must not be present)
        const query = req.query;
        if(validation.isValidRequestBody(query)) {
            return res.status(400).send({ status: false, message: "Query must not be present"});
        }

        // Validate params
        userId = req.params.userId
        if(!validation.isValidObjectId(userId)) {
            return res.status(400).send({status: false, message: `${userId} is invalid`})
        }

        // to check user present or not
        const userSearch = await userModel.findById({_id:userId})
        if(!userSearch) {
            return res.status(400).send({status: false, message: "userId does not exist"})
        }

        // AUTHORISATION
        let userIdFromToken =  req.decodedToken.userId
        if(userIdFromToken !== userId){
            return res.status(403).send({status : false , msg : "unauthorized"})
        }

        // To check cart is present or not
        const cartSearch = await cartModel.findOne({userId})
        if(!cartSearch) {
            return res.status(400).send({status: true, message: "UserId does not exist"})
        }
        return res.status(200).send({status: true, message: "Success", data: cartSearch})

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ message: "Error", error: err.message })
    }
}

module.exports.getCart = getCart





// ******************************************************** DELETE /users/:userId/cart ******************************************************* //

const deleteCart = async function(req,res) {
    try{
        // Validate body (it must not be present)
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, message: "Invalid params present in URL"})
        }

         // Validate params
         userId = req.params.userId
         if(!validation.isValidObjectId(userId)) {
            return res.status(400).send({status: false, message: `${userId} is invalid`})
         }

        //  To check user is present or not
        const userSearch = await userModel.findById({ _id: userId})
        if(!userSearch) {
            return res.status(404).send({status: false, message: "User doesnot exist"})
        }

        // AUTHORISATION
        let userIdFromToken =  req.decodedToken.userId
        if(userIdFromToken !== userId){
            return res.status(401).send({status : false , msg : "unauthorized"})
        }

        // To check cart is present or not
        const cartSearch = await cartModel.findOne({userId})
        if(!cartSearch) {
            return res.status(404).send({status:false, message: "cart doesnot exist"})
        }

        const cartdelete = await cartModel.findOneAndUpdate({userId}, {items:[], totalItems:0, totalPrice:0}, {new: true})
        res.status(204).send({status: true, message:"Cart deleted"})

    }
    catch (err) {
        console.log(err)
        res.status(500).send({ message: "Error", error: err.message })
    }
}

module.exports.deleteCart = deleteCart





