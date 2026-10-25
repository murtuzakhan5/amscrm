import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { CompanySettings } from '../models/CompanySettings.js';

export const seedSuperAdmin = async () => {
  try {
    const adminEmail = env.initialAdminEmail.toLowerCase().trim();
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`ℹ️ Admin user (${adminEmail}) already exists. Skipping super admin creation.`);
      return existingAdmin;
    }

    console.log(`🚀 Creating Initial Super Admin account for ${adminEmail}...`);

    const user = new User({
      email: adminEmail,
      password: env.initialAdminPassword,
      role: 'admin',
      isActive: true,
    });
    await user.save();

    const employee = new Employee({
      employeeId: 'AMS-ADM-0001',
      user: user._id,
      fullName: env.initialAdminName,
      email: adminEmail,
      phoneNumber: env.initialAdminPhone,
      department: 'Executive & Management',
      designation: 'Managing Director & Super Admin',
      role: 'admin',
      employmentStatus: 'active',
      joiningDate: new Date('2023-01-01'),
    });
    await employee.save();

    user.employee = employee._id;
    await user.save();

    // Ensure company settings exist
    const settings = await CompanySettings.findOne();
    if (!settings) {
      await CompanySettings.create({
        companyName: 'AMS Crafters',
        companyEmail: 'contact@amscrafters.com',
        companyPhone: '+92 300 1234567',
        workStartTime: '09:00',
        workEndTime: '18:00',
        lateGracePeriodMinutes: 15,
        timezone: env.defaultTimezone,
        currency: env.defaultCurrency,
      });
      console.log('✅ Company settings initialized.');
    }

    console.log('✅ Super Admin created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log('   Role:  Super Admin');
    return user;
  } catch (error) {
    console.error('❌ Failed to seed Super Admin:', error);
    throw error;
  }
};

// If run directly from CLI
if (process.argv[1]?.endsWith('seedSuperAdmin.js')) {
  (async () => {
    await connectDB();
    await seedSuperAdmin();
    await disconnectDB();
    process.exit(0);
  })();
}
