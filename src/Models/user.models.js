import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new Schema({
    username: {
        type :String,
        required : true,
        uique : true,
        lowercase : true,
        trim : true,
        index : true
    },
    email: {
        type :String,
        required : true,
        uique : true,
        lowercase : true,
        trim : true,
    },
    fullName: {
        type :String,
        required : true,
        trim : true,
        index : true
    },
    avatar : {
        type :String,
        required : true,
    },
    coverImage : {
        type : String,
    },
    watchhistory : [
        {
            type : Schema.Types.ObjectId,
            ref: "video"
        }
    ],
    password : {
        type : String,
        required : [true,"Password is required"],
    },
    refreshToken : {
        type :String,
    }
},{timestamps : true})


//crate hook called pre save that encryot password before save

userSchema.pre("save", async function (next) {
     if(!this.isModified("password")) return next();

      this.password = bcrypt.hash(this.password, 10)
      next()
})

//create userdefined methods for check passwor is modified or not before saving

userSchema.methods.isPasswordCorrect = async function 
(password){
   return await  bcrypt.compare(password,this.password);
}

//create access and refresh tokens

userSchema.methods.generatraccessToken = function () {
     return jwt.sign(
        {
        _id : tis._id,
        username : this.username,
        email : this.email,
        fullName : this.fullName,
     },
     process.env.ACCESS_TOKEN_SECRET,
     {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
     }
    )
}

userSchema.methods.generaterefreshToken = function (){
      return jwt.sign(
        {
        _id : tis._id,
      
        },
     process.env.REFRESH_TOKEN_SECRET,
     {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
     }
    )
}

export const User = mongoose.model("User",userSchema);