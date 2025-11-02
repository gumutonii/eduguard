const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const School = require('../models/School');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const RiskFlag = require('../models/RiskFlag');
const Message = require('../models/Message');
const Intervention = require('../models/Intervention');

async function quickPopulate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');
    console.log('🚀 QUICK POPULATION - CREATING ESSENTIAL DATA...\n');

    // Get existing data
    const schools = await School.find();
    const classes = await Class.find();
    const teachers = await User.find({ role: 'TEACHER' });
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });

    if (schools.length === 0) {
      console.log('❌ No schools found');
      return;
    }

    const school = schools[0];
    console.log(`📚 Using school: ${school.name}`);

    // 1. CREATE STUDENTS (Simplified)
    console.log('\n👥 Creating students...');
    const students = [];
    const studentNames = [
      'Jean Baptiste Nkurunziza', 'Marie Claire Mukamana', 'Paul Niyonshuti', 'Grace Uwimana',
      'Eric Nkurunziza', 'Chantal Mukamana', 'Pierre Niyonshuti', 'Ange Uwimana',
      'Jean Claude Nkurunziza', 'Claire Mukamana', 'Paul Niyonshuti', 'Grace Uwimana',
      'Eric Nkurunziza', 'Chantal Mukamana', 'Pierre Niyonshuti', 'Ange Uwimana',
      'Jean Baptiste Nkurunziza', 'Marie Claire Mukamana', 'Paul Niyonshuti', 'Grace Uwimana',
      'Eric Nkurunziza', 'Chantal Mukamana', 'Pierre Niyonshuti', 'Ange Uwimana',
      'Jean Claude Nkurunziza', 'Claire Mukamana', 'Paul Niyonshuti', 'Grace Uwimana',
      'Eric Nkurunziza', 'Chantal Mukamana', 'Pierre Niyonshuti', 'Ange Uwimana',
      'Jean Baptiste Nkurunziza', 'Marie Claire Mukamana', 'Paul Niyonshuti', 'Grace Uwimana',
      'Eric Nkurunziza', 'Chantal Mukamana', 'Pierre Niyonshuti', 'Ange Uwimana',
      'Jean Claude Nkurunziza', 'Claire Mukamana', 'Paul Niyonshuti', 'Grace Uwimana',
      'Eric Nkurunziza', 'Chantal Mukamana', 'Pierre Niyonshuti', 'Ange Uwimana'
    ];

    for (let i = 0; i < studentNames.length; i++) {
      const classIndex = i % classes.length;
      const assignedClass = classes[classIndex];
      const teacher = teachers.find(t => t.assignedClasses.includes(assignedClass._id));

      const nameParts = studentNames[i].split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      const dateOfBirth = new Date(2000 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const age = new Date().getFullYear() - dateOfBirth.getFullYear();

      const student = new Student({
        firstName: firstName,
        lastName: lastName,
        studentId: `STU${String(i + 1).padStart(4, '0')}`,
        dateOfBirth: dateOfBirth,
        age: age,
        gender: Math.random() > 0.5 ? 'M' : 'F',
        address: {
          district: 'Kigali',
          sector: 'Nyarugenge',
          cell: `Cell ${Math.floor(Math.random() * 10) + 1}`,
          village: `Village ${Math.floor(Math.random() * 20) + 1}`
        },
        socioEconomic: {
          ubudeheLevel: Math.floor(Math.random() * 4) + 1,
          hasParents: true,
          parentJob: 'Farmer',
          familyConflict: false,
          numberOfSiblings: Math.floor(Math.random() * 4),
          parentEducationLevel: 'Primary'
        },
        guardianContacts: [{
          name: `Parent of ${firstName}`,
          relation: 'Father',
          phone: `+25078${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
          email: `parent${i + 1}@email.com`,
          job: 'Farmer',
          educationLevel: 'Primary',
          isPrimary: true
        }],
        classId: assignedClass._id,
        schoolId: school._id,
        assignedTeacher: teacher ? teacher._id : superAdmin._id,
        isActive: true,
        enrollmentDate: new Date(2024, 0, Math.floor(Math.random() * 30) + 1),
        riskLevel: 'LOW'
      });

      await student.save();
      students.push(student);
      console.log(`✅ Created student: ${firstName} ${lastName} (${student.studentId})`);
    }

    // 2. CREATE ATTENDANCE (Last 30 days)
    console.log('\n📅 Creating attendance records...');
    let attendanceCount = 0;
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

      for (const student of students) {
        const attendance = new Attendance({
          studentId: student._id,
          classId: student.classId,
          schoolId: student.schoolId,
          date: new Date(d),
          status: Math.random() > 0.15 ? 'PRESENT' : (Math.random() > 0.5 ? 'ABSENT' : 'LATE'),
          remarks: '',
          markedBy: superAdmin._id
        });

        await attendance.save();
        attendanceCount++;
      }
    }
    console.log(`✅ Created ${attendanceCount} attendance records`);

    // 3. CREATE PERFORMANCE (Simplified)
    console.log('\n📊 Creating performance records...');
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'French', 'History', 'Geography'];
    let performanceCount = 0;

    for (const student of students) {
      for (const subject of subjects) {
        const performance = new Performance({
          studentId: student._id,
          classId: student.classId,
          schoolId: student.schoolId,
          subject: subject,
          examType: 'QUARTERLY',
          score: Math.floor(Math.random() * 40) + 40,
          maxScore: 100,
          grade: Math.random() > 0.3 ? 'A' : (Math.random() > 0.6 ? 'B' : 'C'),
          term: 'TERM_1',
          academicYear: '2024-2025',
          remarks: '',
          enteredBy: superAdmin._id
        });

        await performance.save();
        performanceCount++;
      }
    }
    console.log(`✅ Created ${performanceCount} performance records`);

    // 4. CREATE RISK FLAGS (20% of students)
    console.log('\n⚠️ Creating risk flags...');
    const atRiskStudents = students.filter(() => Math.random() < 0.2);
    let riskFlagCount = 0;

    for (const student of atRiskStudents) {
      const riskFlag = new RiskFlag({
        studentId: student._id,
        classId: student.classId,
        schoolId: student.schoolId,
        riskLevel: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
        reason: 'Low academic performance',
        description: 'Student shows signs of academic difficulties',
        title: 'Academic Performance Risk',
        type: 'PERFORMANCE',
        status: 'ACTIVE',
        flaggedBy: superAdmin._id,
        flaggedAt: new Date(),
        createdBy: superAdmin._id
      });

      await riskFlag.save();
      riskFlagCount++;
    }
    console.log(`✅ Created ${riskFlagCount} risk flags`);

    // 5. CREATE MESSAGES (Simplified)
    console.log('\n💬 Creating messages...');
    let messageCount = 0;

    for (let i = 0; i < 30; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const message = new Message({
        studentId: student._id,
        parentPhone: student.guardianContacts[0].phone,
        parentEmail: student.guardianContacts[0].email,
        recipientPhone: student.guardianContacts[0].phone,
        recipientName: student.guardianContacts[0].name,
        type: 'GENERAL',
        channel: 'SMS',
        content: 'Your child was present today. Thank you.',
        status: 'SENT',
        schoolName: school.name,
        schoolDistrict: school.district,
        sentAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        sentBy: superAdmin._id
      });

      await message.save();
      messageCount++;
    }
    console.log(`✅ Created ${messageCount} messages`);

    // 6. CREATE INTERVENTIONS (For at-risk students)
    console.log('\n🛠️ Creating interventions...');
    let interventionCount = 0;

    for (const student of atRiskStudents) {
      const intervention = new Intervention({
        studentId: student._id,
        classId: student.classId,
        schoolId: student.schoolId,
        type: 'TUTORING',
        title: 'Academic Support Program',
        description: 'Providing additional academic support for struggling student',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        startDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assignedTo: superAdmin._id,
        createdBy: superAdmin._id
      });

      await intervention.save();
      interventionCount++;
    }
    console.log(`✅ Created ${interventionCount} interventions`);

    // 7. UPDATE SCHOOL STATISTICS
    console.log('\n📊 Updating school statistics...');
    await School.findByIdAndUpdate(school._id, {
      statistics: {
        totalStudents: students.length,
        activeStudents: students.length,
        atRiskStudents: atRiskStudents.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        averageAttendance: 85.5,
        averagePerformance: 72.3
      }
    });

    console.log('✅ Updated school statistics');

    // 8. FINAL SUMMARY
    console.log('\n🎉 QUICK POPULATION COMPLETE!');
    console.log('📊 SUMMARY:');
    console.log(`👥 Students: ${students.length}`);
    console.log(`📅 Attendance Records: ${attendanceCount}`);
    console.log(`📊 Performance Records: ${performanceCount}`);
    console.log(`⚠️ Risk Flags: ${riskFlagCount}`);
    console.log(`💬 Messages: ${messageCount}`);
    console.log(`🛠️ Interventions: ${interventionCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

quickPopulate();
