const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // The two people in this conversation
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  // The last message sent (shown in the chat list preview)
  lastMessage: {
    text: { type: String, default: '' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  },

  // How many unread messages each participant has
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }

}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
