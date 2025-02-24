const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  number: { type: String },
  fromMe: {type: Boolean},
  instanceId: {type: String},
  messageStatus: [{
    status: {type: String},
    time: {type: Date}
  }],  
  message: { type: String},
  type: {type: String},
  mediaUrl: {type: String},
  messageId: {type: String},
  timeStamp: {type: String},
}, { timestamps: true }
);

const Message = mongoose.model('message', chatSchema);

module.exports = Message;
