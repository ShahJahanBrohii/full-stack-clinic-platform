const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const adminEmail = 'admin@apexclinic.pk';
    const admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log(`✗ No admin found with email: ${adminEmail}`);
      console.log('\nTo create an admin, run: node createAdmin.js');
      process.exit(1);
    }

    console.log('\n✓ Admin user found:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Active: ${admin.isActive}`);
    console.log(`  Password Hash: ${admin.password.substring(0, 20)}...`);
    console.log('\nCredentials to use for login:');
    console.log(`  Email: admin@apexclinic.pk`);
    console.log(`  Password: admin12345`);
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

checkAdmin();
