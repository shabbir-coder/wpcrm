const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String, required: true },
  password: { type: String, required: true },
  numberId: { type: String, required: false },
  number: { type: String, required: false },
  role: { type: String, enum: ['agent', 'admin'], default: 'agent' }
}, {timestamps: true});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', UserSchema);
