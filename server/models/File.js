const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  name: { type: String, required: true },
  content: { type: String, default: '' },
  type: { type: String, enum: ['file', 'folder'], default: 'file' },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);