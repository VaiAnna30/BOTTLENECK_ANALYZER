const mongoose=require('mongoose');

const EdgeSchema=new mongoose.Schema({
    SourceId:{
        type:String,
        required:true
    },
    TargetId:{
        type:String,
        required:true,
    },
    capacity:{
        type:Number,
        required:true,
    }
});

const NodeSchema=new mongoose.Schema({
    id:{
        type:String,
        required:true,
    },
    label:{
        type:String,
        required:true,
    },
    isSource:{
        type:Boolean,
        default:false,
    },
    isSink:{
        type:Boolean,
        default:false,
    },
    xPosition:{
        type:Number,
        required:true,
    },
    yPosition:{
        type:Number,
        required:true,
    }
});

const NetworkSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    nodes:[NodeSchema],
    edges:[EdgeSchema],
    createdAt:{
        type:Date,
        default:Date.now,
    },
});

module.exports=mongoose.model('Network',NetworkSchema);