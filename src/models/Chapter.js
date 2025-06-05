const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true, 'Chapter title is required'],
        trim: true,
        maxlength:[ 200, 'Title cannot exceed 200 characters']
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
        enum: {
          values: ['6', '7', '8', '9', '10', '11', '12'],
          message: 'Class must be between 6 and 12'
        }
      },
      
      unit: {
        type: Number,
        required: [true, 'Unit number is required'],
        min: [1, 'Unit must be at least 1'],
        max: [20, 'Unit cannot exceed 20']
      },
      
      subject: {
        type: String,
        required: [true, 'Subject is required'],
        enum: {
          values: ['Mathematics', 'Physics', 'Chemistry', 'Science', 'English', 'Hindi', 'Social Studies', 'Biology', 'History', 'Geography', 'Economics', 'Political Science'],
          message: 'Invalid subject'
        }
      },
      
      status: {
        type: String,
        required: [true, 'Status is required'],
        enum: {
          values: ['completed', 'in-progress', 'not-started', 'under-review'],
          message: 'Status must be one of: completed, in-progress, not-started, under-review'
        },
        default: 'not-started'
      },
      
      difficulty: {
        type: String,
        enum: {
          values: ['easy', 'medium', 'hard'],
          message: 'Difficulty must be one of: easy, medium, hard'
        },
        default: 'medium'
      },
      
      weakChapters: {
        type: Boolean,
        default: false,
        index: true
      },
      
      description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
      },
      
      topics: [{
        type: String,
        trim: true
      }],
      
      estimatedDuration: {
        type: Number, // in minutes
        min: [1, 'Duration must be at least 1 minute'],
        max: [600, 'Duration cannot exceed 600 minutes']
      },
      
      completionPercentage: {
        type: Number,
        min: [0, 'Completion percentage cannot be negative'],
        max: [100, 'Completion percentage cannot exceed 100'],
        default: 0
      },
      
      lastAccessed: {
        type: Date,
        default: Date.now
      },
      
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      
      metadata: {
        totalQuestions: {
          type: Number,
          default: 0,
          min: 0
        },
        correctAnswers: {
          type: Number,
          default: 0,
          min: 0
        },
        averageScore: {
          type: Number,
          default: 0,
          min: 0,
          max: 100
        },
        yearWiseQuestionCount: {
          type: Map,
          of: Number,
          default: {}
        }
    }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

//indexing for quick search
// speed up queries
chapterSchema.index({class: 1, subject:1});
chapterSchema.index({status: 1});
chapterSchema.index({weakChapters:1})
chapterSchema.index({unit:1});
chapterSchema.index({createdAt: -1});
chapterSchema.index({title:'text', description:'text'});

chapterSchema.virtual('accuracy').get(function() {
    if (this.metadata.totalQuestions === 0) return 0;
    return Math.round((this.metadata.correctAnswers / this.metadata.totalQuestions) * 100);
  });

  chapterSchema.pre('save', function(next) {
    if (this.completionPercentage === 100) {
      this.status = 'completed';
    } else if (this.completionPercentage > 0) {
      this.status = 'in-progress';
    }
    next();
  });

  chapterSchema.statics.getFilteredChapters = function(filters, options = {}) {
    const query = {};
    
    // Apply filters
    if (filters.class) query.class = filters.class;
    if (filters.unit) query.unit = parseInt(filters.unit);
    if (filters.status) query.status = filters.status;
    if (filters.subject) query.subject = filters.subject;
    if (filters.weakChapters !== undefined) {
      query.weakChapters = filters.weakChapters === 'true';
    }
    if (filters.difficulty) query.difficulty = filters.difficulty;
    
    // Text search
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    
    return this.find(query, null, options).populate('createdBy', 'name email');
  };

  chapterSchema.methods.markAsWeak = function(isWeak = true) {
    this.weakChapters = isWeak;
    return this.save();
  };
  
  // Instance method to update progress
  chapterSchema.methods.updateProgress = function(percentage) {
    this.completionPercentage = Math.min(100, Math.max(0, percentage));
    this.lastAccessed = new Date();
    return this.save();
  };
  
  module.exports = mongoose.model('Chapter', chapterSchema);