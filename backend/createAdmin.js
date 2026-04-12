const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@apexclinic.pk').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
    const adminName = process.env.ADMIN_NAME || 'Shah Jahan Admin';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      existingUser.name = existingUser.name || adminName;
      existingUser.password = hashedPassword;
      existingUser.role = 'admin';
      existingUser.isActive = true;
      existingUser.updatedAt = new Date();
      await existingUser.save();

      console.log('Existing user promoted/updated as admin successfully!');
      console.log(`Email: ${adminEmail} | Password: ${adminPassword}`);
      process.exit();
    }

    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    await admin.save();
    console.log('Admin account created successfully!');
    console.log(`Email: ${adminEmail} | Password: ${adminPassword}`);
    process.exit();
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();