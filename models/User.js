const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  gameStart: { type: Date, default: null, immutable: true },
  gameEnd: { type: Date, default: null },
  betBirr: { type: Number, immutable: true },
  pickedCards: { type: [String], immutable: true },
  onCalls: [String],
  winnerCards: [String],
  luckypassedCards: [String],
  dersh: { type: Number, immutable: true },
  commission: { type: Number, immutable: true },
  by: { type: String, immutable: true },
  time: { type: String, immutable: true },
  shopname: { type: String, immutable: true },
  index: { type: String},
}, { _id: false });

const UserSchema = new mongoose.Schema({
  uuid: { type: String,  unique: true },  // Added uuid here
  name: { type: String, trim: true },
  shopname: { type: String, trim: true },
  username: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
  credit: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  initial_balance: { type: Number, default: 0 },
  lastCreditTime: { type: Date, default: Date.now },
  user_commission: { type: Number, default: 20 },
  owner_commission: { type: Number, default: 20 },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  state: { 
    type: String, 
    enum: ['active', 'suspended'],
    default: 'active'
  },
  games: [GameSchema]
});

const AdminSchema = new mongoose.Schema({
  uuid: { type: String,unique: true },  // Added uuid here
  name: { type: String, trim: true },
  username: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  state: { 
    type: String, 
    enum: ['active', 'suspended'],
    default: 'active'
  },
});

const SubAdminSchema = new mongoose.Schema({
  uuid: { type: String, unique: true },
  name: { type: String, trim: true },
  username: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'subadmin' },
  credit: { type: Number, default: 0 },
  lastCreditTime: { type: Date, default: Date.now },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String },
 state: { 
    type: String, 
    enum: ['active', 'suspended'],
    default: 'active'
  },
  account_history: [{
    amount: Number,
    deposited_user_userName: String,
    date: { type: Date, default: Date.now }
  }]
});

// Create models
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
const SubAdmin = mongoose.models.SubAdmin || mongoose.model("SubAdmin", SubAdminSchema);

module.exports = { User, Admin, SubAdmin };