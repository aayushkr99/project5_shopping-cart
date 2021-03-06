const productModel = require("../model/productModel")
const aws = require("../aws/aws")
const validation = require("../validation/validation")



const createProduct = async function(req,res){

    try{
        let data = req.body
        if(!validation.isValidRequestBody(data))  return res.status(400).send({ status: false, message: "please provide  details" })   

        if (!validation.isValid(data.title)) return res.status(400).send({ status: false, message: "please provide valid title" })
        let uniTitle = await productModel.findOne({title : data.title}) 
        if(uniTitle) return res.status(400).send({status:false , message : "title should be unique"})

        if (!validation.isValid(data.description)) return res.status(400).send({ status: false, message: "Valid description is required" })

        if (!validation.isValidNumber(data.price)) return res.status(400).send({ status: false, message: "Product price should be only number" })

        if(data.currencyId){
            if ( data.currencyId !== 'INR'){ 
            return res.status(400).send({ status: false, message: "Invalid currencyId, INR is the valid format" })}
        }
        if(data.currencyFormat){
            if ( data.currencyFormat !== '₹') {
            return res.status(400).send({ status: false, message: "Invalid currencyFormat, ₹ is the valid format" })}
        }
        
        if(data.isFreeShipping){
            data.isFreeShipping = JSON.parse(data.isFreeShipping)
            if (!validation.isValidBoolean(data.isFreeShipping) )
            return res.status(400).send({ status: false, message: "Invalid format of isFreeShipping" })
        }
        if(data.style){
            if (!validation.isValid(data.style) ) 
            return res.status(400).send({ status: false, message: "Invalid style format" })
        }
            
    if(data.availableSizes){
    
        if (data.availableSizes) {
        if (Array.isArray(validation.isValidSizes(data.availableSizes))) {
            data.availableSizes = validation.isValidSizes(data.availableSizes)
          } else {
               return res.status(400).send({ status: false, message: `size should be one these only "S", "XS", "M", "X", "L", "XXL", "XL" ` })
          }
      }
   }
        
        if(data.installments){
            if (!validation.isValidNumber(data.installments)) 
            return res.status(400).send({ status: false, message: "Please enter valid installments" })
        }
        if(data.isDeleted){
            data.isDeleted = JSON.parse(data.isDeleted)
            if (data.isDeleted == true) { return res.status(400).send({ status: false, message: "data is not valid" }) } 
            if (!validation.isValidBoolean(data.isDeleted )){
            return res.status(400).send({ status: false, message: "Boolean format of isDeleted is required" })}
          
        }    
          
        let files = req.files
        if (!(files && files.length > 0)) {return res.status(400).send({status : false , message : "productImage is required"})}
            let updatedFileUrl = await aws.uploadFile(files[0])
            data.productImage = updatedFileUrl 
         
        
        let savedData = await productModel.create(data)
        res.status(201).send({ status : true, message : "Success" , data : savedData})

    }
    catch(err){
        console.log(err)
        res.status(500).send({status: false , err : err.message})
    }
}






const getProducts = async (req, res) => {
    try{
        const filterQuery = { isDeleted: false }
        const queryParams = req.query
    
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = queryParams

        if(size){

            if (Array.isArray(validation.isValidSizes(size))) {
                filterQuery.availableSizes = {$in : validation.isValidSizes(size)}
            } else {
                return res.status(400).send({ status: false, message: `size should be one these only "S", "XS", "M", "X", "L", "XXL", "XL" ` })
            }
        
    } 

       if (name) {
        if (!validation.isValid(name)) return res.status(400).send({ status: false, message: 'name is invalid' })
        filterQuery['title'] = name
    }

        if (priceGreaterThan && priceLessThan) {
            console.log("both given");
            filterQuery['price'] = { $gte: priceGreaterThan, $lte: priceLessThan }
        }
    
        if (priceGreaterThan) {
            console.log("only 1 given");
            filterQuery['price'] = { $gte: priceGreaterThan }
        }
    
        if (priceLessThan) {
            console.log("only 2 given");
            filterQuery['price'] = { $lte: priceLessThan }
        }
    
        if (priceSort) {
            if (priceSort == 1) {
                const products = await productModel.find(filterQuery).sort({ price: 1 })
                if (!validation.isValidRequestBody(products)) return res.status(404).send({ status: false, message: 'No products found' })
                return res.status(200).send({ status: true, message: 'Success', data: products })
            }
            if (priceSort == -1) {
                const products = await productModel.find(filterQuery).sort({ price: -1 })
                if (!validation.isValidRequestBody(products)) return res.status(404).send({ status: false, message: 'No products found' })
                return res.status(200).send({ status: true, message: 'Success', data: products })
            }
        }
        const products = await productModel.find(filterQuery)
        if (!validation.isValidRequestBody(products)) return res.status(404).send({ status: false, message: 'No products found' })
        return res.status(200).send({ status: true, message: "Success", data: products })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ Error: err.message })
    }
}





const getProductById = async (req, res) => {
    try {
        let productId = req.params.productId
        if(!productId){
            return res.status(400).send({status : false , msg : "Invalid productId"})
        }
        if (!validation.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "productId is invalid" })

        let findProduct = await productModel.findOne({ _id :productId , isDeleted : false})
        if (!findProduct) return res.status(400).send({ status: false, message: "No product exist" })

        return res.status(200).send({ status: true, message: "Success", data: findProduct })

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, Error: err.message })
    }
}




const updateProducts = async function(req,res){
    try{
        let productId = req.params.productId
        if (!validation.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "productId is invalid" })

        let data = req.body
   
        const { title , description, price ,currencyId ,currencyFormat,style,availableSizes,installments} = data
        const obj = {}
        const findProduct = await productModel.findById(productId)

        if (!findProduct) {
        return res.status(404).send({ status: false, message: 'product does not exists' }) }
                
        if(findProduct.isDeleted == true){
        return res.status(400).send({ status:false, message: "product is deleted" }) }

        if (Object.keys(data).length == 0) { 
        return res.status(400).send({ status: false, message: "Invalid request Please provide details of an user" })  }
    
               

        if(title){
        if (!validation.isValid(title)) return res.status(400).send({ status: false, message: "please provide valid title" })
        let uniTitle = await productModel.findOne({title : title}) 
        if(uniTitle) return res.status(400).send({status:false , message : "title should be unique"})
        obj['title'] = title}

        if(description){
        if (!validation.isValid(description)) return res.status(400).send({ status: false, message: "Valid description is required" })
        obj['description'] = description }

        if(price){
        if (!validation.isValidNumber(price)) return res.status(400).send({ status: false, message: "Product price should be number" })
        obj['price'] = price}

        if(currencyId){
        if ( data.currencyId !== 'INR'){  return res.status(400).send({ status: false, message: "Invalid currencyId, INR is the valid format" })}
        obj['currencyId'] = currencyId }
        
        if(currencyFormat){
        if ( data.currencyFormat !== '₹') { return res.status(400).send({ status: false, message: "Invalid currencyFormat, ₹ is the valid format" })}
        obj['currencyFormat'] = currencyFormat   }
        

        if(data.isFreeShipping){
            isFreeShipping = JSON.parse(data.isFreeShipping)
            if (!validation.isValidBoolean(isFreeShipping) )
            return res.status(400).send({ status: false, message: "Invalid format of isFreeShipping" })
            // let isFreeShipping = JSON.parse(JSON.stringify(isFreeShipping))
            obj['isFreeShipping'] = isFreeShipping;}
        
            if(style){
            if (!validation.isValid(style) ) 
            return res.status(400).send({ status: false, message: "Invalid style format" })
            obj['style'] = style;}
        
           
     if(req.body.availableSizes){

          if (req.body.availableSizes) {
             if (Array.isArray(validation.isValidSizes(req.body.availableSizes))) {
                req.body.availableSizes = validation.isValidSizes(req.body.availableSizes)
        } else {
            return res.status(400).send({ status: false, message: `size should be one these only "S", "XS", "M", "X", "L", "XXL", "XL" ` })
        }
    }
       obj["availableSizes"] = availableSizes
  }

        if(installments){
            if (!validation.isValidNumber(installments)) 
            return res.status(400).send({ status: false, message: "Please enter valid installments" })
            obj['installments'] = installments; }
        
        // if( files.productImage){
        // let productLink = await aws.uploadFile(files[0]);                       //getting the AWS-S3 link after uploading the user's profileImage
        let files = req.files                                                           //getting the AWS-S3 link after uploading the user's profileImage
        if (files && files.length > 0) {
            let updatedFileUrl = await aws.uploadFile(files[0])
            data.profileImage = updatedFileUrl
            obj['productImage'] = updatedFileUrl;}    

        
       
      
        let upCheck = await productModel.findOneAndUpdate({_id : productId } , obj , {new : true})    
        if(!upCheck == null) return res.status(404).send({status : false , message : "Product not found"})
        return res.status(200).send({status : true, message : "Product updated successfully" , data : upCheck})
    }
    catch (err){
        console.log(err)
        res.status(500).send({status : false , err : err.message})
    }
}





const deleteProduct = async (req, res) => {
    try {
        let ProductId = req.params.productId;
        if (!validation.isValidObjectId(ProductId)) {
            return res.status(400).send({ status: false, message: "productId is  Invalid" })
        }
        let data = await productModel.findOne({ _id: ProductId, isDeleted: false }).lean();
        if (!data) {
            return res.status(404).send({ status: false, message: "This Product Data is already deleted Or Doesn't Exist" });
        }
        let deleteproduct = await productModel.findOneAndUpdate({ _id: ProductId }, { isDeleted: true, deletedAt: Date() }, { new: true });
        return res.status(200).send({ status: true, message: 'Success', data: deleteproduct });

    } catch (err) {
        console.log(err)
        return res.status(500).send({ message: err.message });
    }
};





module.exports.createProduct = createProduct
module.exports.getProducts = getProducts
module.exports.getProductById = getProductById
module.exports.updateProducts =  updateProducts
module.exports.deleteProduct = deleteProduct







