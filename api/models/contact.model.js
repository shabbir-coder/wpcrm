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
  instanceId: {type: String},
},{timestamps: true});

const listSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  type: {type: String, default: 'Group'},
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  instanceId: { type: String, required: true },
}, { timestamps: true });

const ContactAgentSchema = new mongoose.Schema({
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instanceId: {type: String},
  role: { type: String, enum: ['agent', 'admin'], default: 'agent' },
  isPinned: {type: Boolean, default: false},
}, { timestamps: true });

const ContactAgent = mongoose.model('ContactAgent', ContactAgentSchema);
const Contact = mongoose.model('Contact', contactSchema);
const List = mongoose.model('List', listSchema);

module.exports =  {List, Contact, ContactAgent} ;
