const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require('../models/listing.js');

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');    
}
main().then((res)=>{
    console.log("Connected to Database");
}).catch((err)=>{
    console.log("Some error occured",err);
})

const initDB = async ()=>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({
        ...obj,owner:'68ce5c3eedc50af8801949d0',
    }))
    await Listing.insertMany(initData.data);// kyuki init ek object hai jahan se humne ye export kra
    console.log("data was initialized");
}

initDB();