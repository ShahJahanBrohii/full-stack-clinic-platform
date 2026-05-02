const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const getMongoUri = () => process.env.MONGO_URI || process.env.MONGO_URL;

function parseCliArgs(argv) {
  return argv.reduce((acc, entry) => {
    if (!entry.startsWith('--')) return acc;

    const [rawKey, ...rest] = entry.slice(2).split('=');
    const key = rawKey.trim();
    const value = rest.length > 0 ? rest.join('=') : 'true';

    if (key) {
      acc[key] = value;
    }

    return acc;
  }, {});
}

const createAdmin = async () => {
  try {
    const mongoUri = getMongoUri();

    if (!mongoUri) {
      throw new Error('Missing MongoDB connection string. Set MONGO_URI or MONGO_URL.');
    }

    await mongoose.connect(mongoUri);

    const cliArgs = parseCliArgs(process.argv.slice(2));
    const adminEmail = String(cliArgs.email || process.env.ADMIN_EMAIL || 'admin@apexclinic.pk')
      .trim()
      .toLowerCase();
    const adminPassword = String(cliArgs.password || process.env.ADMIN_PASSWORD || 'admin12345');
    const adminName = String(cliArgs.name || process.env.ADMIN_NAME || 'Shah Jahan Admin').trim();

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