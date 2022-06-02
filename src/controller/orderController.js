const orderModel = require("../model/orderModel.js");
const cartModel = require("../model/cartModel.js");
const userModel = require("../model/userModel.js");
const validation = require('../validation/validation.js');



const createOrder = async function(req, res) {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, message: "Invalid params present in URL"})
        }
        
        const userIdFromParams = req.params.userId

        // const userIdFromToken = req.userId

        if (!validation.isValidObjectId(userIdFromParams)) {
            return res.status(400).send({ status: false, message: "UserId is invalid" });
        }

        const body = req.body
        console.log(body.userId)
        if (Object.keys(body) == 0) {
            return res.status(400).send({status: false,message: "please provide data"})
        }
        
        const {cartId, cancellable, status} = body

        const findUser = await userModel.findById(userIdFromParams)
        if(!findUser) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        // if (userIdFromToken != userIdFromParams) {
        //     return res.status(403).send({ status: false, message: "Unauthorized access." });
        // }

        if(!validation.isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Please provide the cartId" })
        }
        if(!validation.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "CartId is invalid" })
        }
        const searchUser = await userModel.findById({_id : userIdFromParams})
        if(!searchUser){
            return res.status(404).send({status : false, message : "User not found"})
        }
        const findCart = await cartModel.findById({_id: cartId})
        if(!findCart) {
            return res.status(404).send({ status: false, message: "Cart not found" })
        }
        if(findCart.userId.toString() != userIdFromParams){
            return res.status(400).send({ status: false, message: "With this user cart is not created" });
        }
        if(findCart.items.length === 0) {
            return res.status(400).send({ status: false, message: "User cart is empty." })  //verifying whether the cart is having any products or not.
        }

        if(cancellable){
            if(!validation.isValidBoolean(cancellable)){
                return res.status(400).send({status:false, message: "Cancellable should be a valid boolean value."})
            }
        }

        if(status){
            if(!validation.isValidStatus(status)){
                return res.status(400).send({status:false, message: "Valid status is required. [completed, pending, cancelled]"})
            }
        }

        let totalQuantityInCart = 0 
        for(let i=0; i<findCart.items.length; i++){
            totalQuantityInCart += findCart.items[i].quantity
        }
        
        const newOrder = {
            userId : userIdFromParams,
            items : findCart.items,
            totalPrice : findCart.totalPrice,
            totalItems : findCart.totalItems,
            totalQuantity: totalQuantityInCart,
            cancellable,
            status
        }
        await cartModel.findOneAndUpdate({userId: userIdFromParams}, {$set: {items: [], totalPrice: 0, totalItems: 0} });

        let saveOrder = await orderModel.create(newOrder)
        return res.status(201).send({status:true, message:"Success", data:saveOrder})
    }
    catch(err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }
}
module.exports.createOrder = createOrder






const updateOrder = async function(req, res) {
    try{
        const query = req.query
        if(Object.keys(query) != 0) {
            return res.status(400).send({status: false, message: "Invalid params present in URL"})
        }
        
        const userIdFromParams = req.params.userId
        
        // const userIdFromToken = req.userId
        
        if (!validation.isValidObjectId(userIdFromParams)) {
            return res.status(400).send({ status: false, message: "UserId is invalid" });
        }
        const findUser = await userModel.findById(userIdFromParams);
        if (!findUser) {
            return res.status(404).send({ status: false, message: 'User not found.' });
        }
        // if (userIdFromToken != userIdFromParams) {
        //     return res.status(403).send({ status: false, message: "Unauthorized access." });
        // }
        
        let data = req.body
        
        if (!validation.isValidRequestBody(data)){
            return res.status(400).send({ status: false, message: "Please enter your details to update." })   //validating the parameters of body
        }
        const {orderId, status} = data
        
        if (!validation.isValid(orderId)) {
            return res.status(400).send({ status: false, messege: "Please provide OrderId" })
        }
        if (!validation.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "ProductId is invalid" });
        }
        const findOrder = await orderModel.findById(orderId);
        if (!findOrder) {
            return res.status(400).send({ status: false, message: 'Order Id is incorrect.' });
        }

        // if (findOrder.totalPrice === 0) {
        //     return res.status(404).send({ status: false, message: 'No order has been placed' });
        // }

        if(!validation.isValidStatus(status)){
            return res.status(400).send({status:false, message: "Valid status is required. [completed, pending, cancelled]"})
        }

        if(status === 'pending'){
            if(findOrder.status === 'completed'){
                return res.status(200).send({status:false, message: "Order can not be updated to pending. because it is completed."})
            }
            if(findOrder.status === 'cancelled'){
                return res.status(200).send({status:false, message: "Order can not be updated to pending. because it is cancelled."})
            }
            if(findOrder.status === 'pending'){
                return res.status(200).send({status:false, message: "Order is already pending."})
            }
            const findOrderAfterDeletion = await orderModel.findOneAndUpdate({ userId: userIdFromParams },
                {$set: {items: [], totalPrice: 0, totalItems: 0, totalQuantity : 0, status : 'cancelled' }},{new:true})
            return res.status(200).send({status: true, message: "Order is cancelled successfully", data: findOrderAfterDeletion})
        }

        if(status === 'completed'){
            if(findOrder.status === 'cancelled'){
                return res.status(200).send({status:false, message: "Order can not be updated to completed. because it is cancelled."})
            }
            if(findOrder.status === 'completed'){
                return res.status(200).send({status:false, message: "Order is already completed."})
            }
        }

        if(status === 'cancelled'){
            if(findOrder.cancellable == false){
                return res.status(400).send({status:false, message:"Item can not be cancelled, because it is not cancellable."})
            }
            if(findOrder.status === 'cancelled'){
                return res.status(400).send({status:false, message: "Order is already cancelled."})
            }
            const findOrderAfterDeletion = await orderModel.findOneAndUpdate({ _id: orderId },
                {$set: {items: [], totalPrice: 0, totalItems: 0, totalQuantity : 0, status : 'cancelled' }},{new:true})
            return res.status(200).send({status: true, message: "Order is cancelled successfully", data: findOrderAfterDeletion})
        }
    }
    catch(err) {
        console.log(err)
        res.status(500).send({message: err.message})
    }
}

module.exports.updateOrder = updateOrder;