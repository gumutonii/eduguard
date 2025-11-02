const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const jwt = require('jsonwebtoken');

async function testProfileUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');
    console.log('Connected to MongoDB');

    // Find a user to test with
    const user = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!user) {
      console.log('No super admin user found');
      return;
    }

    console.log('Testing profile update for user:', user.name);
    console.log('Current phone:', user.phone);

    // Test updating with phone number that should work
    const updateData = { 
      name: 'Test Profile Update',
      phone: '+250 788 000 000'  // This format should now work
    };
    console.log('Update data:', updateData);

    try {
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

      console.log('✅ Updated user:', updatedUser.name);
      console.log('✅ Updated phone:', updatedUser.phone);
      console.log('✅ Profile update successful!');

      // Test with different phone formats
      const testFormats = [
        '+250788000000',  // No spaces
        '+250 788 000 000',  // With spaces
        '0788000000',  // Starting with 0
        '0 788 000 000'  // Starting with 0 with spaces
      ];

      console.log('\nTesting different phone formats:');
      for (const phoneFormat of testFormats) {
        try {
          await User.findByIdAndUpdate(
            user._id,
            { phone: phoneFormat },
            { new: true, runValidators: true }
          );
          console.log(`✅ ${phoneFormat} - Valid`);
        } catch (error) {
          console.log(`❌ ${phoneFormat} - Invalid: ${error.message}`);
        }
      }

    } catch (validationError) {
      console.error('❌ Validation error:', validationError.message);
      if (validationError.errors) {
        console.error('Field errors:', Object.keys(validationError.errors));
        Object.keys(validationError.errors).forEach(field => {
          console.error(`${field}: ${validationError.errors[field].message}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testProfileUpdate();

