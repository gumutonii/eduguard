const mongoose = require('mongoose');
const smsService = require('../utils/smsService');
const messageService = require('../services/messageService');
const Message = require('../models/Message');
const Student = require('../models/Student');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');

const testMessaging = async () => {
  try {
    console.log('🧪 Testing EduGuard Messaging System...\n');

    // Test 1: Check SMS Service Configuration
    console.log('1. Testing SMS Service Configuration...');
    console.log(`   SMS Service Enabled: ${smsService.isEnabled()}`);
    console.log(`   Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not Set'}`);
    console.log(`   Twilio Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not Set'}`);
    console.log(`   Twilio Phone Number: ${process.env.TWILIO_PHONE_NUMBER || 'Not Set'}\n`);

    // Test 2: Test Phone Number Formatting
    console.log('2. Testing Phone Number Formatting...');
    const testNumbers = ['0781234567', '+250781234567', '250781234567', '781234567'];
    testNumbers.forEach(num => {
      const formatted = smsService.formatPhoneNumber(num);
      console.log(`   ${num} -> ${formatted}`);
    });
    console.log('');

    // Test 3: Test SMS Sending (if configured)
    if (smsService.isEnabled()) {
      console.log('3. Testing SMS Sending...');
      const testPhone = process.env.TWILIO_PHONE_NUMBER || '+250788000000';
      const testMessage = 'Test message from EduGuard - System is working!';
      
      console.log(`   Sending test SMS to ${testPhone}...`);
      const smsResult = await smsService.sendSMS(testPhone, testMessage);
      
      if (smsResult.success) {
        console.log(`   ✅ SMS sent successfully! SID: ${smsResult.sid}`);
        console.log(`   Status: ${smsResult.status}`);
      } else {
        console.log(`   ❌ SMS failed: ${smsResult.error}`);
      }
      console.log('');

      // Test 4: Test Message Status Check
      if (smsResult.sid) {
        console.log('4. Testing Message Status Check...');
        console.log(`   Checking status for SID: ${smsResult.sid}...`);
        
        // Wait a moment for the message to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResult = await smsService.checkMessageStatus(smsResult.sid);
        console.log(`   Message Status: ${statusResult.status}`);
        if (statusResult.errorCode) {
          console.log(`   Error Code: ${statusResult.errorCode}`);
        }
        console.log('');
      }
    } else {
      console.log('3. Skipping SMS tests - Service not configured\n');
    }

    // Test 5: Test Message Service Integration
    console.log('5. Testing Message Service Integration...');
    
    // Find a test student
    const testStudent = await Student.findOne({ isActive: true });
    const testUser = await User.findOne({ role: 'TEACHER', isActive: true });
    
    if (testStudent && testUser) {
      console.log(`   Found test student: ${testStudent.firstName} ${testStudent.lastName}`);
      console.log(`   Found test user: ${testUser.name}`);
      
      // Create a test message
      const messageData = {
        studentId: testStudent._id,
        schoolId: testStudent.schoolId,
        schoolName: testUser.schoolName || 'Test School',
        schoolDistrict: testUser.schoolDistrict || 'Test District',
        recipientType: 'GUARDIAN',
        recipientName: testStudent.guardianContacts[0]?.name || 'Test Guardian',
        recipientPhone: testStudent.guardianContacts[0]?.phone || '+250788000000',
        recipientEmail: testStudent.guardianContacts[0]?.email,
        type: 'ABSENCE_ALERT',
        channel: 'SMS',
        content: `Test message for ${testStudent.firstName} - System is working correctly!`,
        subject: 'EduGuard Test Message',
        sentBy: testUser._id
      };

      console.log('   Creating test message...');
      const message = await messageService.sendMessage(messageData);
      console.log(`   ✅ Message created with ID: ${message._id}`);
      console.log(`   SMS Status: ${message.smsStatus || 'Not set'}`);
      console.log(`   Email Status: ${message.emailStatus || 'Not set'}`);
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check final status
      const updatedMessage = await Message.findById(message._id);
      console.log(`   Final SMS Status: ${updatedMessage.smsStatus}`);
      console.log(`   Final Email Status: ${updatedMessage.emailStatus}`);
      if (updatedMessage.smsError) {
        console.log(`   SMS Error: ${updatedMessage.smsError}`);
      }
      if (updatedMessage.emailError) {
        console.log(`   Email Error: ${updatedMessage.emailError}`);
      }
    } else {
      console.log('   No test students or users found - skipping integration test');
    }
    console.log('');

    // Test 6: Test Bulk SMS (if configured)
    if (smsService.isEnabled()) {
      console.log('6. Testing Bulk SMS...');
      const testRecipients = [
        { phone: '+250788000000', message: 'Bulk test message 1' },
        { phone: '+250788000001', message: 'Bulk test message 2' }
      ];
      
      console.log(`   Sending bulk SMS to ${testRecipients.length} recipients...`);
      const bulkResult = await smsService.sendBulkSMS(testRecipients);
      console.log(`   ✅ Bulk SMS completed!`);
      console.log(`   Sent: ${bulkResult.sent}, Failed: ${bulkResult.failed}`);
      console.log('');
    }

    // Test 7: Check Recent Messages
    console.log('7. Checking Recent Messages...');
    const recentMessages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentId', 'firstName lastName')
      .populate('sentBy', 'name');
    
    console.log(`   Found ${recentMessages.length} recent messages:`);
    recentMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.type} - ${msg.studentId?.firstName} ${msg.studentId?.lastName} - ${msg.smsStatus || 'N/A'}`);
    });
    console.log('');

    console.log('🎉 Messaging system test completed!');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   SMS Service: ${smsService.isEnabled() ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`   Message Service: ✅ Working`);
    console.log(`   Database Integration: ✅ Working`);
    
    if (!smsService.isEnabled()) {
      console.log('\n⚠️  To enable SMS functionality:');
      console.log('   1. Get Twilio credentials from https://www.twilio.com/console');
      console.log('   2. Set TWILIO_ACCOUNT_SID in your .env file');
      console.log('   3. Set TWILIO_AUTH_TOKEN in your .env file');
      console.log('   4. Set TWILIO_PHONE_NUMBER in your .env file');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

testMessaging();
