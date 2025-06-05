const User = require('../models/User');
const Chapter = require('../models/Chapter');
const fs = require('fs');
const path = require('path');

// Create default admin user
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@dashboard.com' });
    
    if (!adminExists) {
      const admin = new User({
        name: 'Admin User',
        email: 'admin@dashboard.com',
        password: 'admin123',
        role: 'admin'
      });
      
      await admin.save();
      console.log('Default admin user created');
      return admin;
    }
    
    return adminExists;
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Load real chapter data
const loadRealChapterData = async (adminUser) => {
  try {
    const chapterCount = await Chapter.countDocuments();
    
    if (chapterCount === 0) {
      // Try to load transformed data
      let chaptersData;
      
      try {
        const dataPath = path.join(__dirname, '../../transformed-chapters.json');
        chaptersData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      } catch (fileError) {
        console.log('Transformed data not found, using sample data...');
        chaptersData = getSampleChapters();
      }
      
      // Add createdBy to each chapter
      const chaptersWithCreator = chaptersData.map(chapter => ({
        ...chapter,
        createdBy: adminUser._id
      }));
      
      await Chapter.insertMany(chaptersWithCreator);
      console.log(`✅ ${chaptersWithCreator.length} chapters loaded successfully`);
      
      // Log statistics
      const stats = {
        physics: chaptersWithCreator.filter(c => c.subject === 'Physics').length,
        chemistry: chaptersWithCreator.filter(c => c.subject === 'Chemistry').length,
        mathematics: chaptersWithCreator.filter(c => c.subject === 'Mathematics').length,
        class11: chaptersWithCreator.filter(c => c.class === '11').length,
        class12: chaptersWithCreator.filter(c => c.class === '12').length,
        weakChapters: chaptersWithCreator.filter(c => c.weakChapters).length,
        completed: chaptersWithCreator.filter(c => c.status === 'completed').length
      };
      
      console.log('📊 Chapter Statistics:');
      console.log(`   Physics: ${stats.physics}, Chemistry: ${stats.chemistry}, Mathematics: ${stats.mathematics}`);
      console.log(`   Class 11: ${stats.class11}, Class 12: ${stats.class12}`);
      console.log(`   Weak Chapters: ${stats.weakChapters}, Completed: ${stats.completed}`);
    }
  } catch (error) {
    console.error('Error loading chapter data:', error);
  }
};

// Fallback sample data
const getSampleChapters = () => {
  return [
    {
      title: 'Introduction to Algebra',
      class: '8',
      unit: 1,
      subject: 'Mathematics',
      status: 'completed',
      difficulty: 'easy',
      weakChapters: false,
      description: 'Basic concepts of algebra including variables and expressions',
      topics: ['Variables', 'Expressions', 'Equations'],
      estimatedDuration: 90,
      completionPercentage: 100,
      metadata: {
        totalQuestions: 20,
        correctAnswers: 18,
        averageScore: 90
      }
    },
    {
      title: 'Chemical Reactions',
      class: '10',
      unit: 2,
      subject: 'Chemistry',
      status: 'in-progress',
      difficulty: 'medium',
      weakChapters: true,
      description: 'Understanding different types of chemical reactions',
      topics: ['Combination', 'Decomposition', 'Displacement'],
      estimatedDuration: 120,
      completionPercentage: 65,
      metadata: {
        totalQuestions: 15,
        correctAnswers: 8,
        averageScore: 53
      }
    }
  ];
};

// Main seeder function
const runSeeders = async () => {
  try {
    console.log('🌱 Running database seeders...');
    const adminUser = await createAdminUser();
    await loadRealChapterData(adminUser);
    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  }
};

module.exports = {
  runSeeders,
  createAdminUser,
  loadRealChapterData
};