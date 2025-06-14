const mongoose = require("mongoose");

// Helper: Today's date in YYYY-MM-DD
function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  shopname: { type: String, trim: true },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: { type: String, required: true },
  credit: { type: Number, default: 0 },
  shouldAddCredit: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
  lastCreditTime: { type: String },
  user_commission: { type: Number, min: 1, max: 100, default: 20 },
  owner_commission: { type: Number, min: 1, max: 100, default: 15 },
  role: { type: String, enum: ['admin', 'user', 'shop'], default: 'user' },
  games: [ /* your GameSchema here */ ],
});

// Pre-save logic to apply credit only if flagged OR on new docs
UserSchema.pre("save", async function (next) {
  // 1) default shopname
  if (!this.shopname) {
    this.shopname = this.name;
  }

  const today = getTodayDate();

  // 2) NEW DOCUMENT: initialize balance = credit
  if (this.isNew) {
    if (this.credit > 0) {
      this.balance = this.credit;
      this.lastCreditTime = today;
    }
    // ensure flag is reset
    this.shouldAddCredit = false;

  // 3) EXISTING DOC + explicit flag
  } else if (this.shouldAddCredit) {
    const existing = await mongoose.models.User.findById(this._id);
    if (existing) {
      if (this.credit > 0) {
        this.balance = (existing.balance || 0) + this.credit;
      } else {
        this.balance = existing.balance || 0;
      }
      this.lastCreditTime = today;
    }
    this.shouldAddCredit = false;
  }

  next();
});

module.exports = mongoose.model("User", UserSchema);
