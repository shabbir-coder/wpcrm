const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: false },
  pushName: {type: String, required: true},
  number: { type: String, required: true },
  param1: { type: String, required: false },
  param2: { type: String, required: false },
  param3: { type: String, required: false },
  isVerified : {type: Boolean, default: false},
  lastMessage: {type: String, default:''},
  lastMessageAt: {type: Date},
  isPinned: {type: Boolean, default: false},
  instanceId: {type: String},
},{timestamps: true});

const listSchema = new mongoose.Schema({
  name: { type: String, required: true }, // List name
  description: { type: String, required: false },
  type: {type: String, default: 'Group'},
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }], // References Contact model
  instanceId: { type: String, required: true }, // Instance identifier
}, { timestamps: true });


const Contact = mongoose.model('Contact', contactSchema);
const List = mongoose.model('List', listSchema);

module.exports =  {List, Contact} ;
