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

async function populateAllData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');
    console.log('🚀 POPULATING ALL COLLECTIONS WITH COMPREHENSIVE DATA...\n');

    // Get existing data
    const schools = await School.find();
    const classes = await Class.find();
    const teachers = await User.find({ role: 'TEACHER' });
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });

    if (schools.length === 0) {
      console.log('❌ No schools found. Creating schools first...');
      return;
    }

    const school = schools[0];
    console.log(`📚 Using school: ${school.name}`);

    // 1. CREATE COMPREHENSIVE STUDENTS DATA
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

    const allSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'French', 'History', 'Geography', 'Economics', 'Computer Science'];
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
    const genders = ['M', 'F'];

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
        gender: genders[Math.floor(Math.random() * genders.length)],
        address: {
          district: 'Kigali',
          sector: 'Nyarugenge',
          cell: `Cell ${Math.floor(Math.random() * 10) + 1}`,
          village: `Village ${Math.floor(Math.random() * 20) + 1}`
        },
        socioEconomic: {
          ubudeheLevel: Math.floor(Math.random() * 4) + 1,
          hasParents: Math.random() > 0.1, // 90% have parents
          parentJob: ['Farmer', 'Teacher', 'Business Owner', 'Government Employee', 'Driver'][Math.floor(Math.random() * 5)],
          familyConflict: Math.random() < 0.2, // 20% have family conflicts
          numberOfSiblings: Math.floor(Math.random() * 6),
          parentEducationLevel: ['None', 'Primary', 'Secondary', 'University'][Math.floor(Math.random() * 4)]
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
        isActive: Math.random() > 0.1, // 90% active
        enrollmentDate: new Date(2024, 0, Math.floor(Math.random() * 30) + 1),
        riskLevel: 'LOW'
      });

      await student.save();
      students.push(student);
      console.log(`✅ Created student: ${student.firstName} ${student.lastName} (${student.studentId})`);
    }

    // 2. CREATE ATTENDANCE RECORDS
    console.log('\n📅 Creating attendance records...');
    const attendanceRecords = [];
    const startDate = new Date(2024, 0, 1); // January 1, 2024
    const endDate = new Date(); // Today

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      for (const student of students) {
        if (!student.isActive) continue;

        const attendance = new Attendance({
          studentId: student._id,
          classId: student.classId,
          schoolId: student.schoolId,
          date: new Date(d),
          status: Math.random() > 0.15 ? 'PRESENT' : (Math.random() > 0.5 ? 'ABSENT' : 'LATE'),
          remarks: Math.random() > 0.8 ? 'Good attendance' : '',
          markedBy: superAdmin._id
        });

        await attendance.save();
        attendanceRecords.push(attendance);
      }
    }
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    // 3. CREATE PERFORMANCE RECORDS
    console.log('\n📊 Creating performance records...');
    const performanceRecords = [];
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'French', 'History', 'Geography'];

    for (const student of students) {
      if (!student.isActive) continue;

      for (const subject of subjects) {
        const performance = new Performance({
          studentId: student._id,
          classId: student.classId,
          schoolId: student.schoolId,
          subject: subject,
          examType: 'QUARTERLY',
          score: Math.floor(Math.random() * 40) + 40, // 40-80 range
          maxScore: 100,
          grade: Math.random() > 0.3 ? 'A' : (Math.random() > 0.6 ? 'B' : 'C'),
          term: 'FIRST',
          academicYear: '2024-2025',
          remarks: Math.random() > 0.7 ? 'Good performance' : '',
          enteredBy: superAdmin._id
        });

        await performance.save();
        performanceRecords.push(performance);
      }
    }
    console.log(`✅ Created ${performanceRecords.length} performance records`);

    // 4. CREATE RISK FLAGS
    console.log('\n⚠️ Creating risk flags...');
    const riskFlags = [];
    const riskReasons = [
      'Frequent absences',
      'Low academic performance',
      'Behavioral issues',
      'Family problems',
      'Health concerns',
      'Financial difficulties',
      'Peer pressure',
      'Learning difficulties'
    ];

    // Mark 20% of students as at-risk
    const studentsAtRisk = students.filter(() => Math.random() < 0.2);
    
    for (const student of studentsAtRisk) {
      const riskFlag = new RiskFlag({
        studentId: student._id,
        classId: student.classId,
        schoolId: student.schoolId,
        riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        reason: riskReasons[Math.floor(Math.random() * riskReasons.length)],
        description: `Student shows signs of ${riskReasons[Math.floor(Math.random() * riskReasons.length)].toLowerCase()}`,
        status: 'ACTIVE',
        flaggedBy: superAdmin._id,
        flaggedAt: new Date()
      });

      await riskFlag.save();
      riskFlags.push(riskFlag);
      console.log(`✅ Created risk flag for: ${student.name}`);
    }

    // 5. CREATE MESSAGES
    console.log('\n💬 Creating messages...');
    const messages = [];
    const messageTypes = ['SMS', 'EMAIL', 'NOTIFICATION'];
    const messageTemplates = [
      'Your child was absent today. Please contact the school.',
      'Parent meeting scheduled for next week.',
      'Your child performed well in the recent exam.',
      'Please update your contact information.',
      'School holiday notice for next week.',
      'Your child needs additional support in Mathematics.',
      'Congratulations on your child\'s improvement!',
      'Please attend the parent-teacher conference.'
    ];

    for (let i = 0; i < 50; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const message = new Message({
        studentId: student._id,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        messageType: messageTypes[Math.floor(Math.random() * messageTypes.length)],
        content: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
        status: Math.random() > 0.2 ? 'SENT' : 'PENDING',
        sentAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        sentBy: superAdmin._id
      });

      await message.save();
      messages.push(message);
    }
    console.log(`✅ Created ${messages.length} messages`);

    // 6. CREATE INTERVENTIONS
    console.log('\n🛠️ Creating interventions...');
    const interventions = [];
    const interventionTypes = ['COUNSELING', 'ACADEMIC_SUPPORT', 'FAMILY_MEETING', 'PEER_MENTORING', 'EXTRA_CLASSES'];
    const interventionStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

    for (const riskFlag of riskFlags) {
      const intervention = new Intervention({
        studentId: riskFlag.studentId,
        riskFlagId: riskFlag._id,
        classId: riskFlag.classId,
        schoolId: riskFlag.schoolId,
        type: interventionTypes[Math.floor(Math.random() * interventionTypes.length)],
        title: `Intervention for ${interventionTypes[Math.floor(Math.random() * interventionTypes.length)].replace('_', ' ')}`,
        description: `Supporting student with ${riskFlag.reason.toLowerCase()}`,
        status: interventionStatuses[Math.floor(Math.random() * interventionStatuses.length)],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        assignedTo: superAdmin._id,
        createdBy: superAdmin._id
      });

      await intervention.save();
      interventions.push(intervention);
      console.log(`✅ Created intervention for: ${riskFlag.studentId}`);
    }

    // 7. UPDATE SCHOOL STATISTICS
    console.log('\n📊 Updating school statistics...');
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.isActive).length;
    const atRiskStudents = riskFlags.length;
    const totalTeachers = teachers.length;
    const totalClasses = classes.length;

    await School.findByIdAndUpdate(school._id, {
      statistics: {
        totalStudents,
        activeStudents,
        atRiskStudents,
        totalTeachers,
        totalClasses,
        averageAttendance: 85.5,
        averagePerformance: 72.3
      }
    });

    console.log('✅ Updated school statistics');

    // 8. SUMMARY
    console.log('\n🎉 DATA POPULATION COMPLETE!');
    console.log('📊 SUMMARY:');
    console.log(`👥 Students: ${students.length}`);
    console.log(`📅 Attendance Records: ${attendanceRecords.length}`);
    console.log(`📊 Performance Records: ${performanceRecords.length}`);
    console.log(`⚠️ Risk Flags: ${riskFlags.length}`);
    console.log(`💬 Messages: ${messages.length}`);
    console.log(`🛠️ Interventions: ${interventions.length}`);
    console.log(`🏫 Schools: ${schools.length}`);
    console.log(`📚 Classes: ${classes.length}`);
    console.log(`👨‍🏫 Teachers: ${teachers.length}`);

  } catch (error) {
    console.error('❌ Error populating data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

populateAllData();
