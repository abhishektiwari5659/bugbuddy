import validator from "validator"

export const validateSignUpData = (req) => {
    const {firstName, lastName, emailId, password} = req.body
    if(!firstName || !lastName){
        throw new Error("name is not valid")
    }
    else if(firstName.length < 3 || firstName.length > 50){
        throw new Error("Name should be in a range of 3-50")
    }
    else if(!validator.isEmail(emailId)){
        throw new Error("Not a valid email")
    }
    else if(!validator.isStrongPassword(password)){
        throw new Error("weak password")
    }
}


export const validateProfileData = (req) => {
    const allowedEditFields = ["firstName", "lastName", "emailId", "photoUrl", "gender", "age", "about", "skills"];

    const isEditAllowed = Object.keys(req.body).every((field)=>
    allowedEditFields.includes(field)
)
return isEditAllowed;
};
