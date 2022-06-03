const mongoose = require('mongoose')


const isValid = function (value) {
    if (typeof value === "undefined" || value === null ) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidString= function (value) {
    const noNumber =/^[^0-9]+$/g               ////^[a-zA-Z]{3}/-/d{6}$/                 // /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/                                    ///^[^0-9]+$/g   
    if (typeof value !== 'string') return false
    if(noNumber.test(value) === false) return false
    return true
}

const isValidBoolean = function(value){
    if(!(typeof value === "boolean")) return false
    return true
}

const isValidNumber=  function(n) {
    // if(n > 4 && n< 7)
    return !isNaN(parseFloat(n)) && isFinite(n);
  }



const isValidRequestBody = function (requestbody) {
    return Object.keys(requestbody).length > 0;
}

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const isValidPrice = function(value) {
    if(!/^[0-9]+$/.test(value.trim())){
        return false
    }
    return true
}
const isValidremoveProduct = function(value) {
    return [0,1].indexOf(value) !== -1
}

const isValidStatus = function(status) {
    return ['pending', 'completed', 'cancelled'].indexOf(status) !== -1
};

const pattern1 =function (value){            
    const test1 = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/ 
    if (typeof value !== 'string') return false
    if(test1.test(value) === false) return false
    return true
}                        

const pattern2 =function (value){            
    const test2 = /^(\+91[\-\s]?)?[0]?(91)?[6-9]\d{9}$/  
    if (typeof value !== 'string') return false
    if(test2.test(value) === false) return false
    return true
} 

const pattern3 =function (value){            
    const test3 = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/ 
    if (typeof value !== 'string') return false
    if(test3.test(value) === false) return false
    return true
} 

const pattern4 = function(value) {
    if(!(/^[1-9][0-9]{5}$/.test(value.trim()))) {
        return false
    }
    return true
}
const isvalidCurrencyId = function (currencyId) {
    return ["INR"].indexOf(currencyId) !== -1
}
const isvalidCurrencyFormat = function (currencyFormat) {
    return ["₹"].indexOf(currencyFormat) !== -1
}
const isValidSize = (sizes) => {
    return ["S", "XS","M","X", "L","XXL", "XL"].includes(sizes);
  }

  
  const isValidSizes = (size)=> {
   
    const validSize = size.split(",").map(x => x.toUpperCase().trim())
   
    let givenSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]
  
    for (let i = 0; i < validSize.length; i++) {
      if (!givenSizes.includes(validSize[i])) {
        return false
      }
    }
    return validSize
  }
  

// let pattern2 = /^(\+91[\-\s]?)?[0]?(91)?[6-9]\d{9}$/                                            // phone
// let pattern3 = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/        // password
// let pattern4 = /^(\d{4}|\d{6})$/                                                              // pincode

module.exports = { isValid , isValidString, isValidNumber, isValidRequestBody,isValidBoolean,
     isValidObjectId ,isValidPrice, isValidremoveProduct,isValidStatus,pattern1, pattern2, pattern3,
      pattern4,isvalidCurrencyId,isvalidCurrencyFormat,isValidSize,isValidSizes }

