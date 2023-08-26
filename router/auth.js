const express = require('express');
const router = express.Router();

// for taking values front frontend js
const body_parser = require('body-parser');

// for creation of authentication 
const jwt = require("jsonwebtoken")

//creation of a secret key
const secretKey = "secretkey_plotline" ;

// creation of session keys 
const session = require('express-session');

//middleware for serving static file
router.use(express.static('public'));

//Set up EJS as template engine
//router.set('view engine', 'ejs');

// importing cookies library
const cookieParser = require("cookie-parser");
router.use(cookieParser()) ;

const mongoose = require('mongoose');

//Set up of Session Middleware
router.use(session({
    secret : "This_project_is_made_for_plotline" ,
    resave : false,
    saveUninitialized : true ,
    cookie : {secure : false}
})) 

require('../db/conn');
const User = require("../model/userSchema");
const Item = require("../model/itemSchema");
const Order = require("../model/ordersSchema");

const { hash } = require('bcrypt');

//creating a scheme for phone number validiation
const validatePhoneNumber = require('validate-phone-number-node-js');

//Creating a scheme for password validiation 
var passwordValidator = require('password-validator');
var schema = new passwordValidator();

//calling encryption for passwords
const bcrypt = require("bcrypt")

// Add properties to it
schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits(1)                                // Must have at least 1 digits
.is().not().oneOf(['Passw0rd', 'Password123']);

//adding of users to the database 
router.post('/post/add_user',async(req,res)=>{
    
    //calling out the parameters from the post reqenst from postman
    const User_ID = (req.body.User_ID).toLowerCase()
    const User_Name = (req.body.User_Name).toLowerCase()
    const User_Password = req.body.User_Password
    const User_Mobile_Number = req.body.User_Mobile_Number
    const User_Email = req.body.User_Email

    // check if user id is not null
    if (User_ID === ""){
        return res.send("Error 501 : User Id cannot be null")
    }
    //check is the user name is not null
    else if (User_Name === ""){
        return res.send("Error 502 : User Name cannot be null")
    }
    //check is the password is not null
    else if (User_Password === ""){
        return res.send("Error 503 : User Password cannot be null")
    }
    //check is the mobile number is not null
    else if (User_Mobile_Number === ""){
        return res.send("Error 504 : User Mobile Number cannot be null")
    }
    //check is the user email is not null
    else if (User_Email === ""){
        return res.send("Error 505 : User User Email cannot be null")
    }

    //checking if the user email and user id are unique
    User.findOne({$or:[{user_email:User_Email} , {user_id : User_ID}]})
        .then((userExist)=>{
            // error if same user id or user name
            if(userExist){
                return res.status(422).json({error : "Email/ID already exist"});
            }
            //checking for password pattern
            if(!schema.validate(User_Password)){
                return res.status(422).json({error : "Password pattern does not match"});
            }
            //checking for password pattern 
            const result = validatePhoneNumber.validate(User_Mobile_Number);
            if(!result){
                return res.status(422).json({error : "Phone Number pattern does not match"});
            }

            //encrypting the password and storing it in database
            bcrypt.genSalt(10, function await(err, Salt) {
                // The bcrypt is used for encrypting password.
                bcrypt.hash(User_Password, Salt, function (err, hash) {
                    if (err) {
                        return res.status(422).json({error : "Cannot encrypt"});
                    }
                    //saving of user data 
                    const user = new User({user_id:User_ID,user_name:User_Name,user_password:hash,mobile_number:User_Mobile_Number,user_email:User_Email});
                        user.save().then(() =>{
                            res.status(201).json({message:"User Registered Successfully"}) ;
                        }).catch((err) => res.status(500).json({error:err})) ;
                });
            });
        }).catch(err=>{console.log(err);});
});

//adding of items 
router.post('/post/new_item',(req,res)=>{
    
    // requesting of items from the rest API
    const Item_ID = (req.body.item_id).toLowerCase() 
    const Item_Name = (req.body.item_name).toLowerCase() 
    let Item_Type = (req.body.item_type).toLowerCase()
    const Item_Barcode = req.body.item_barcode
    let Item_Availability = (req.body.item_availability).toLowerCase()
    let Item_Cost = req.body.item_cost
    const Item_Description = req.body.item_description

    //if cost is not specified by default it will be made as zero
    if(Item_Cost === ""){
        Item_Cost = 0 
    }

    //by default a item type will be connsiderd as a product
    if(Item_Type === ""){
        Item_Type = "product"
    }

    //by default the availibility will be no 
    if(Item_Availability === ""){
        Item_Availability = "no"
    }
 
    // every item must have a ID
    if(Item_ID === ""){
        return res.send("Error 200 : Please specify a unique item_id")
    }

    //every item must have a name
    else if(Item_Name==""){
        return res.send("Error 201 : Please specify a unique item_name")
    }

    // checking if availability is either yes or no
    else if(Item_Availability!="no" && Item_Availability!="yes" ){
        return res.send("Error 202 : Availability can be either yes or no")
    }

    // checking if type is either product or service
    else if(Item_Type!="service" && Item_Type!="product" ){
        return res.send("Error 203 : Availability can be either product or service")
    }

    // checking if cost is an integer
    else if(!Number.isInteger(Item_Cost)){
        return res.send("Error 204 : Item Cost must be an integer")
    }    

    // checking if barcode is an integer
    else if(!Number.isInteger(Item_Barcode) && Item_Barcode!="" ){
        return res.send("Error 205 : Item Barcode must be an integer")
    } 

    else{
        Item.findOne({$or:[{item_id:Item_ID} , {item_name : Item_Name}]})
        .then((itemExist)=>{
            // error if same item id or item name
            if(itemExist){
                return res.status(422).json({error : "Item Name/ID already exist"});
            }
            
            // checking if the item has a barcode
            if(Item_Barcode !== "") {
                const item = new Item({item_id:Item_ID,item_name:Item_Name,item_type:Item_Type,item_availability:Item_Availability,item_cost:Item_Cost,item_description:Item_Description});
                    item.save().then(() =>{
                        return res.status(201).json({message:"Item Registered Successfully"}) ;
                    }).catch((err) => res.status(500).json({error:err})) ;
            }

            //if the item does not have a barcode
            else {
                const item = new Item({item_id:Item_ID,item_name:Item_Name,item_type:Item_Type,item_availability:Item_Availability,item_cost:Item_Cost,item_description:Item_Description});
                    item.save().then(() =>{
                        return res.status(201).json({message:"Item Registered Successfully"}) ;
                    }).catch((err) => res.status(500).json({error:err})) ;
            }
        }).catch(err=>{console.log(err);});
    }
});

// create a route to load the products and also creating a new cart if it does not exist 
router.get("/home",async(req,res) => {
    const items = await Item.find();
    const itemJson = items.map(item => item.toJSON());
    return res.json(itemJson);
})

// clear items from the cart 
router.get('/get/clear_cart',verifyToken,(req,res)=>{
    req.session.cart = [] ;
    res.redirect("/home");
})

// add items to the cart
router.post('/post/add_cart',verifyToken,async(req,res)=>{
    
    //console.log(`this is my cookie :${req.cookies.jwtoken}`) ;

    // creating a new cart if not exist
    if(!req.session.cart){
        req.session.cart = []
    }

    // fetching the details of items for the database
    const item_id = (req.body.item_id).toLowerCase() ;

    let item_name
    let item_cost 
    
    // validiating the item_id passed
    const item = await Item.findOne({item_id:item_id});
    if(item){
        item_name = item.item_name ;
        item_cost = item.item_cost ;
        item_type = item.item_type ;
        let count = 0 ;

        // increasing the quantity of item if present in cart
        for(let i =0 ; i<req.session.cart.length ; i++)
        {
            if(req.session.cart[i].item_id === item_id){
                req.session.cart[i].quantity += 1;
                count ++;
            }
        }

        // adding a new item to the cart
        if(count === 0)
        {
            const cart_data = {
                item_id : item_id,
                item_name : item_name,
                item_cost : parseFloat(item_cost),
                item_type : item_type,
                quantity : 1
            };
            req.session.cart.push(cart_data);
        }
        res.redirect("/home") ;
    }
    else{
        res.send("Error 402 : Item_Id does not exist in table")
    }
})

// remove items from the cart
router.get('/post/remove_item',verifyToken,(req,res)=>{
    const item_id = req.body.item_id ;

    // removing the given item id from the cart
    for(let i = 0 ; i<req.session.cart.length ; i++)
    {
        if(req.session.cart[i].item_id === item_id)
        {
            req.session.cart.splice(i,1);
        }
    }
    res.redirect("/home") ;
});

//generate the total bill
router.get('/get/total_bill',verifyToken,(req,res)=>{

    //checking if the session cart exists or not
    if(req.session.cart){
        // creatingg a new session for billing
        req.session.bill=[]
        let Total_Price = 0 ;
        for(let i = 0 ; i<req.session.cart.length ; i++)
        {
            // initializing all the values
            let tax_charged = 0 ;
            let bill_data ;
            let cart_detail = req.session.cart[i] ;

            //calculation of taxes for product
            if(cart_detail.item_type ===  "product"){
                // base tax for product
                tax_charged = 200 ;

                // charging the taxes according to the condition
                if(cart_detail.item_cost > 1000 && cart_detail.item_cost<=5000 ){
                    tax_charged = cart_detail.item_cost * (0.12);
                }
                else if (cart_detail.item_cost > 5000 ){
                    tax_charged = cart_detail.item_cost * (0.18);
                };  

                // creating a template for storing the bill data 
                bill_data = {
                    Id : cart_detail.item_id ,
                    Name : cart_detail.item_name ,
                    Price : parseFloat(cart_detail.item_cost) ,
                    Type : "product" ,
                    Tax : tax_charged , 
                    Quantity : cart_detail.quantity ,
                    Total_Price_Item : cart_detail.quantity * (cart_detail.item_cost+tax_charged)
                };
            }

            //calculation of taxes for service 
            else {
                // base tax for service
                tax_charged = 100 ;

                // charging the taxes according to the condition
                if(cart_detail.item_cost > 1000 && cart_detail.item_cost<=8000 ){
                    tax_charged = cart_detail.item_cost * (0.10);
                }
                else if (cart_detail.item_cost > 8000 ){
                    tax_charged = cart_detail.item_cost * (0.15);
                };   

                // creating a template for storing the bill data 
                bill_data = {
                    Id : cart_detail.item_id ,
                    Name : cart_detail.item_name ,
                    Price : parseFloat(cart_detail.item_cost) ,
                    Type : "service" ,
                    Tax : tax_charged , 
                    Quantity : cart_detail.quantity ,
                    Total_Price_Item : cart_detail.quantity * (cart_detail.item_cost+tax_charged)
                };
            }   
            
            // calculating the total price
            Total_Price += cart_detail.quantity * (cart_detail.item_cost+tax_charged) ;
            
            // adding each items billing data to the bill session
            req.session.bill.push(bill_data);
        }

        const total_amount = {
            Total_Amount : Total_Price 
        }
        req.session.bill.push(total_amount);
        res.send(JSON.parse(JSON.stringify(req.session.bill))) ;
    }

    // if the cart has not been created yet
    else {
        res.send("Error 401 : No values added to Cart") ;
        res.redirect("/home") ;
    }
})

//confirm the bill 
// change the database 
router.get('/get/confirm_order',verifyToken,(req,res)=>{
    // checking if the bill session is made or not
    if(req.session.bill){
        // updating the current time and date of the transaction
        let date_transaction = new Date();
        let order ;
        for(let i = 0 ; i<req.session.bill.length-1 ; i++){
            let bill_detail = req.session.bill[i];

            // updating the values in the orders database
            order = new Order({item_id:bill_detail.Id , item_name:bill_detail.Name , item_type:bill_detail.Type , item_cost:bill_detail.Price , item_tax:bill_detail.Tax , item_quantity:bill_detail.Quantity ,item_total_amt:bill_detail.Total_Price_Item,time_purchase:date_transaction});
        }

        order.save().then(() =>{
            return res.status(201).json({message:"Order Confirmed Successfully"}) ;
        }).catch((err) =>{return res.status(500).json({error:err})}) ;
        
        req.session.bill=[]
        req.session.cart = [] ;
    }

    // if the bill session is not made then redirection to /total_bill
    else{
        return res.redirect("/get/total_bill")
    }
})

// this is a function for admin to srerch the results via date
router.post('/admin/search_by_date',async(req,res)=>{
    const selectedDate = new Date(req.body.date_from); // the date from which the user wants the dats
    const no_of_days = req.body.days_after ; // the no of days thereafter user wants the data
    const nextDay = new Date(selectedDate); 
    nextDay.setDate(nextDay.getDate() + no_of_days); 

    try {
        const events = await Order.find({
            time_purchase: {
                $gte: selectedDate,
                $lt: nextDay
            }
        });

        req.session.admin = [] ;
        let total_tax = 0 ;
        let total_product_cost = 0 ;


        const totalCost = events.reduce((sum, event) => {
            let count = 0 ;
            for(let i =0 ; i<req.session.admin.length ; i++)
            {
                if(req.session.admin[i].item_name === event.item_name){
                    req.session.admin[i].quantity += event.item_quantity;
                    count ++;
                }
            }
            // adding a new item to the cart
            if(count === 0)
            {
                const cart_data = {
                    item_id : event.item_id,
                    item_name : event.item_name,
                    item_cost : parseFloat(event.item_cost),
                    item_type : event.item_type,
                    quantity : event.item_quantity
                };
                req.session.admin.push(cart_data);
            }
            const cost = event.item_total_amt ;
            total_tax += event.item_tax*event.item_quantity ;
            total_product_cost += event.item_cost*event.item_quantity ;
            return sum + cost;
        }, 0); 

        const total_cost ={
            Total_Cost_Items : total_product_cost 
        }
        const total_tax_data = {
            Total_Tax : total_tax
        }
        const total_amount = {
            Total_Collection : totalCost 
        }

        req.session.admin.push(total_cost);
        req.session.admin.push(total_tax_data);
        req.session.admin.push(total_amount);
        res.send(JSON.parse(JSON.stringify(req.session.admin))) ;
        
    } catch (error) {
        console.error('Error fetching events :', error);
        res.status(500).json({ error: 'Date must be of the format YYYY-MM-DD' });
    }

})




//view the cart 
router.get('/post/view_cart',verifyToken,(req,res)=>{
    res.send(JSON.parse(JSON.stringify(req.session.cart))) ;        
})  

//for logging in the user
router.post("/login", async(req,res)=>{
    // collecting the username and password using restapi
    const user_email = (req.body.user_email).toLowerCase() ;
    const user_pass = req.body.user_pass ;
    let user_db_password ; // refers to password saved in the database
    let user_db_id ; // refers to the id saved in the database

    // checking if the email id is correct
    const user = await User.findOne({user_email:user_email});
    if(user){
        //getting the passwords
        user_db_password = user.user_password ;
        user_db_id = user.user_id ;

        //checking if the password is correct
        const isMatch = await bcrypt.compare(user_pass,user_db_password);
        if(!isMatch) {
            return res.status(400).json({error: "Invalid Password"}) ;
        }

        // creating a token for access of the application , time limit 5min
        else {
            jwt.sign({ user_db_id },secretKey,{expiresIn:'300s'},async(err1,token)=>{
                if(err1){
                    console.log(err1)
                }else{
                    res.cookie("jwtoken",token,{
                        expires: new Date(Date.now() + 300000),
                        httpOnly:true
                    });
                    res.json({message : "User Login Successfully"});
                }
            })
        }
    }
})

//function to verify the token
function verifyToken(req,res,next){
    const token = req.cookies.jwtoken ;
    if(typeof token !== "undefined"){
        const verifyUser = jwt.verify(token,secretKey) ;
        console.log(verifyUser);
        next() ;
    }else{
        res.send("Error 2 : Token is not valid")
    }
}

module.exports = router ;