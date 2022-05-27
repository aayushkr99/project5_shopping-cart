const userModel = require("../model/userModel")
const validation = require("../validation/validation")
const aws = require("../aws/aws")
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")



const createUser = async function (req, res) {
    try {
        let data = req.body

        if (!validation.isValidRequestBody(data)) return res.status(400).send({ status: false, msg: "please provide  details" })

        if (!validation.isValidString(data.fname)) return res.status(400).send({ status: false, msg: "Valid First Name is required" })

        if (!validation.isValidString(data.lname)) return res.status(400).send({ status: false, msg: "Valid Second Name is required" })

        if (!validation.pattern1(data.email)) return res.status(400).send({ status: false, msg: "Valid Email is required" })

        let uniqueEmail = await userModel.findOne({ email: data.email });
        if (uniqueEmail) return res.status(400).send({ status: false, msg: "Email Already Exist" });

        if (!validation.pattern2(data.phone)) return res.status(400).send({ status: false, msg: "phone is required" })

        let uniquePhoneNumber = await userModel.findOne({ phone: data.phone });
        if (uniquePhoneNumber) return res.status(400).send({ status: false, msg: "phone Number Already Exist" });   // 400 for duplication

        if (!validation.pattern3(data.password)) return res.status(400).send({ status: false, msg: "password is required" })

        const hashedPassword = await bcrypt.hash(data.password, 10)
        req.body["password"] = hashedPassword;
        console.log(hashedPassword)

        if (!(data.address)) return res.status(400).send({ status: false, message: "Address should be present and must contain shipping and billing addresses" });  //check for  address

        data.address = JSON.parse(data.address)                                            //converting into object

        if (!(data.address.shipping.street)) {
            return res.status(400).send({ status: false, message: "please provide shipping street address" })
        }
        if (!(data.address.shipping.city && validation.isValidString(data.address.shipping.city))) {
            return res.status(400).send({ status: false, message: "please provide valid shipping city address" })
        }
        if (!(data.address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: "please provide Valid shipping pincode address" })
        }
        if (!(data.address.billing.street)) {
            return res.status(400).send({ status: false, message: "please provide billing street address" })
        }
        if (!(data.address.billing.city && validation.isValidString(data.address.billing.city))) {
            return res.status(400).send({ status: false, message: "please provide Valid billing city address" })
        }
        if (!(data.address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "please provide Valid billing pincode address" })
        }

        let files = req.files
        if (files && files.length > 0) {
            let updatedFileUrl = await aws.uploadFile(files[0])
            data.profileImage = updatedFileUrl
        }
        let createData = await userModel.create(data)
        res.status(201).send({ status: true, message: "user created successfully", data: createData })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: "Server Error" })
    }
}




const userLogin = async function (req, res) {
    try {
        let email = req.body.email
        let password = req.body.password

        if (!email) { return res.status(400).send({ status: false, message: "email is required" }) }
        if (!password) { return res.status(400).send({ status: false, message: "password is required" }) }


        let checkData = await userModel.findOne({ email: email })       //.select({_id : 1})
        if (checkData == null) {
            return res.status(500).send({ status: false, message: "Cannot find user" })
        }
        let compare = await bcrypt.compare(password, checkData.password)
        if (!compare) return res.status(404).send({ status: false, message: "Not Allowed" })

        let token = jwt.sign({ userId: checkData._id }, "function1Up", { expiresIn: '1000s' });

        let Data = {
            userId: checkData._id,
            token: token,
        }
        res.status(200).send({ status: true, message: "User login successfully", data: Data })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, err: err.message })

    }
}




const getUser = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!validation.isValidObjectId(userId)) {
            return req.status(400).send({ status: false, message: "Invalid UserId" })
        }
        let check = await userModel.findById({ _id: userId })
        if (!check) return res.status(404).send({ status: false, message: "Not found" })
        res.status(200).send({ status: true, message: "user details", data: check })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, err: err.message })
    }
}





const updateUser = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!validation.isValidObjectId(userId)) { return req.status(400).send({ status: false, message: "Invalid UserId" }) }

        let data = req.body
        // let data = JSON.parse(req.body.data)
        let files = req.files
        if (!(validation.isValidRequestBody(data) || files.length > 0)) { return res.status(400).send({ status: false, msg: "please provide  details" }) }

        const findUser = await userModel.findById({ _id: userId})
        if(!findUser){
            return res.status(404).send({ status: false, message: "User not found" });
          }
            if (data.fname) {
                if (!validation.isValidString(data.fname)) {
                    return res.status(400).send({ status: false, msg: "Valid First Name is required" })}
            }

            if (data.lname) {
                if (!validation.isValidString(data.lname)) {return res.status(400).send({ status: false, msg: "Valid last Name is required" })}
            }

            if (data.email) {
                if (!validation.pattern1(data.email)) {return res.status(400).send({ status: false, msg: "Valid Email is required" })}
                let uniqueEmail = await userModel.findOne({ email: data.email });
                if (uniqueEmail) return res.status(400).send({ status: false, msg: "Email Already Exist" });
            }

            if (data.phone) {
                if (!validation.pattern2(data.phone)) {return res.status(400).send({ status: false, msg: "phone is required" })}
                let uniquePhoneNumber = await userModel.findOne({ phone: data.phone });
                if (uniquePhoneNumber) return res.status(400).send({ status: false, msg: "phone Number Already Exist" });
            }

            if (data.password) {
                if (!validation.pattern3(data.password)) {return res.status(400).send({ status: false, msg: "password is required" })}
                const hashedPassword = await bcrypt.hash(data.password, 10)
                data["password"] = hashedPassword;
            }

            if( req.files){
            let profileImgUrl = await aws.uploadFile(files[0]);                       //getting the AWS-S3 link after uploading the user's profileImage
            data.profileImage = profileImgUrl;
            }
           
            if (data.address) {
               
                data.address = JSON.parse(data.address)
                let newAddress = JSON.parse(JSON.stringify(findUser.address))
           
                    if(data.address.shipping){

                        if(data.address.shipping.street){ 
                         findUser.address.shipping.street = data.address.shipping.street
                           newAddress.shipping.street = data.address.shipping.street
                              if(!validation.isValid(data.address.shipping.street)){
                                return res.status(400).send({ status : false , message : "please provide shipping street address"})}
                            }

                        if(data.address.shipping.city){ 
                         findUser.address.shipping.city = data.address.shipping.city
                           newAddress.shipping.city = data.address.shipping.city
                              if(!validation.isValid(data.address.shipping.city)){
                                return res.status(400).send({ status : false , message : "please provide shipping city address"})}
                            }

                        if(data.address.shipping.pincode){ 
                         findUser.address.shipping.pincode = data.address.shipping.pincode
                           newAddress.shipping.pincode = data.address.shipping.pincode
                              if(!validation.isValid(data.address.shipping.pincode)){
                                return res.status(400).send({ status : false , message : "please provide shipping pincode address"})}
                            }
                }
                    
                if(data.address.billing){

                    if(data.address.billing.street){ 
                     findUser.address.billing.street = data.address.billing.street
                       newAddress.billing.street = data.address.billing.street
                          if(!validation.isValid(data.address.billing.street)){
                            return res.status(400).send({ status : false , message : "please provide billing street address"})}
                        }

                    if(data.address.billing.city){ 
                     findUser.address.billing.city = data.address.billing.city
                       newAddress.billing.city = data.address.billing.city
                          if(!validation.isValid(data.address.billing.city)){
                            return res.status(400).send({ status : false , message : "please provide billing city address"})}
                        }

                    if(data.address.billing.pincode){ 
                     findUser.address.billing.pincode = data.address.billing.pincode
                       newAddress.billing.pincode = data.address.billing.pincode
                          if(!validation.isValid(data.address.billing.pincode)){
                            return res.status(400).send({ status : false , message : "please provide billing pincode address"})}
                }
            }
            data.address=newAddress
        }
        let updateUser = await userModel.findOneAndUpdate({_id: userId}, data ,{new: true})
        res.status(200).send({ status: true, message: "updated user", data: updateUser })
    }
     catch (err) {
        console.log(err)
        res.status(500).send({ status: false, err: err.message })
    }
}






module.exports.createUser = createUser
module.exports.userLogin = userLogin
module.exports.getUser = getUser
module.exports.updateUser = updateUser
