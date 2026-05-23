const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['file', 'folder'], default: 'file' },
  content: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  parentId: { type: String, default: null },
  path: { type: String, required: true },
});

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    files: { type: [FileSchema], default: [] },
    packages: { type: [String], default: [] },
    activeFileId: { type: String, default: null },
    template: {
      type: String,
      enum: ['vanilla', 'react', 'vue', 'blank'],
      default: 'vanilla',
    },
    owner: { type: String, default: 'anonymous' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);
