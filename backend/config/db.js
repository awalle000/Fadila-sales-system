import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Debug logging
    console.log('🔍 Connecting to MongoDB...');
    console.log('📍 MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI is not defined in .env file');
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    
    // Create default CEO account after connection is established
    setTimeout(() => {
      createDefaultCEO();
    }, 1000);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createDefaultCEO = async () => {
  try {
    const User = (await import('../models/User.js')).default;
    
    const email = process.env.DEFAULT_CEO_EMAIL || 'ceo@soapshop.com';
    
    // Check if CEO already exists
    const existing = await User.findOne({ email });
    
    if (!existing) {
      const password = process.env.DEFAULT_CEO_PASSWORD || 'Admin@123';
      
      // Create user - let the pre-save hook handle password hashing
      const ceo = new User({
        name: 'CEO',
        email,
        password: password,  // Plain text password - will be hashed by pre-save hook
        role: 'ceo'
      });
      
      await ceo.save();
      
      console.log('\n✅ Default CEO account created');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log('   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!\n');
    } else {
      console.log('\n✅ CEO account already exists\n');
    }
  } catch (error) {
    console.error('❌ Error creating default CEO:', error.message);
    console.error('Full error:', error);
  }
};