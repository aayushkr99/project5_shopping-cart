const userModel = require('../model/userModel')
const ProductModel = require('../model/productModel')
const cartModel = require('../model/cartModel')
const validation = require('../Validation/validation')


// ******************************************************** POST /users/:userId/cart ******************************************************* //

const addToCart = async function(req, res) {
    try{
        
        const userIdFromParams = req.params.userId;
        
        // const userIdFromToken = req.userId;
        
        if (!validation.isValidObjectId(userIdFromParams)) {
            return res.status(400).send({ status: false, message: 'Please enter valid UserId' });
        }
        const findUser = await userModel.findById(userIdFromParams);
        if (!findUser) {
            return res.status(404).send({ status: false, message: 'User not found.' });
        }
        // if (userIdFromToken !== userIdFromParams) {
        //     return res.status(400).send({ status: false, message: 'Unauthorized Access' });
        // // }
        // if (findUser._id.toString() != userIdFromToken) {
        //     return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });   //Authentication & authorization
        // }
        
        let data = req.body
        
        if (!validation.isValidRequestBody(data)){
            return res.status(400).send({ status: false, message: "Please provide the valid details" })   //validating the parameters of body
        }
        
        const  {productId , quantity} = data
        
        if (!validation.isValidObjectId(productId) ) {
            return res.status(400).send({ status: false, message: "Please provide valid Product Id" })
        }
        const findProduct = await ProductModel.findById(productId);
        if (!findProduct) {
            return res.status(404).send({status : false , message : "products doesnot exists"})
        }
        if(findProduct.isDeleted == true){
            return res.status(400).send({ status:false, message: "Product is deleted" });
        }

        if (!validation.isValidNumber(quantity)) {
            return res.status(400).send({ status: false, message: "Please provide the Quantity" })
        }
        if ((isNaN(Number(quantity)))) {
            return res.status(400).send({status:false, message: 'Quantity should be a valid number' })         //price should be valid number
        }
        if (quantity < 0) {
            return res.status(400).send({status:false, message: 'Quantity can not be less than zero' })    //price should be valid number
        }

    const findCartOfUser = await cartModel.findOne({ userId: userIdFromParams }) //finding cart related to user.

        if (!findCartOfUser) {      //destructuring for the response body.
            var cartData = {
                userId: userIdFromParams,
                items: [{ productId:productId, quantity:quantity}],
                totalPrice: (findProduct.price) * quantity,
                totalItems: 1
            }
            const createCart = await cartModel.create(cartData)
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart })
        }

        if (findCartOfUser) {
            //updating price when products get added or removed.
            let price = findCartOfUser.totalPrice + (req.body.quantity * findProduct.price)
            let items = findCartOfUser.items

            //updating quantity.
            for(let i=0; i<items.length; i++){
                if (items[i].productId.toString() === productId) {
                    items[i].quantity += quantity
                    let updatedCart = { items: items, totalPrice: price, totalItems: items.length }
                    let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true })
                    return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData })
                }
            }

            items.push({ productId: productId, quantity: quantity })   //storing the updated prices and quantity to the newly created array.

            let updatedCart = { items: items, totalPrice: price, totalItems: items.length }
            let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true, upsert:true })
            return res.status(200).send({ status: true, message: `Product added to the cart successfully`, data: responseData })
        }
    }
    catch(err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }
}
module.exports.addToCart = addToCart





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
        // if(userId !== req.user.userId) {
        //     return res.status(401).send({status: false, message: "Unauthorised access"})
        // }

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
        console.log("This is the error :", err.message)
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
        // if(userId !== req.user.userId) {
        //     return res.status(401).send({status: false, message: "Unauthorised access"})
        // }

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
        // if(userId !== req.user.userId) {
        //     return res.status(401).send({status: false, message: "Unauthorised access"})
        // }

        // To check cart is present or not
        const cartSearch = await cartModel.findOne({userId})
        if(!cartSearch) {
            return res.status(404).send({status:false, message: "cart doesnot exist"})
        }

        const cartdelete = await cartModel.findOneAndUpdate({userId}, {items:[], totalItems:0, totalPrice:0}, {new: true})
        res.status(200).send({status: true, message:"Cart deleted"})

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ message: "Error", error: err.message })
    }
}

module.exports.deleteCart = deleteCart





