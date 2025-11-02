const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const School = require('../models/School');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const RiskFlag = require('../models/RiskFlag');
const Intervention = require('../models/Intervention');
const Message = require('../models/Message');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduguard');

const generateSampleData = async () => {
  try {
    console.log('🌱 Starting comprehensive sample data generation...');

    // Clear existing data
    await User.deleteMany({});
    await School.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});
    await Attendance.deleteMany({});
    await Performance.deleteMany({});
    await RiskFlag.deleteMany({});
    await Intervention.deleteMany({});
    await Message.deleteMany({});

    console.log('✅ Cleared existing data');

    // Create Super Admin
    const superAdmin = new User({
      email: 'superadmin@eduguard.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'EduGuard Super Admin',
      role: 'SUPER_ADMIN',
      phone: '+250788000000',
      schoolName: 'EduGuard System',
      schoolDistrict: 'Kigali City',
      schoolSector: 'Nyarugenge',
      isApproved: true,
      isActive: true,
      emailVerified: true
    });
    await superAdmin.save();
    console.log('✅ Super Admin created');

    // Create Schools
    const schools = [
      {
        name: 'Ecole Secondaire de Kigali',
        district: 'Kigali City',
        sector: 'Nyarugenge',
        schoolType: 'SECONDARY',
        phone: '+250788111111',
        email: 'info@esk.edu.rw',
        address: 'KG 123 St, Nyarugenge, Kigali',
        principal: {
          name: 'Dr. Jean Baptiste Nkurunziza',
          phone: '+250788222222',
          email: 'principal@esk.edu.rw'
        },
        createdBy: superAdmin._id
      },
      {
        name: 'Ecole Primaire de Butare',
        district: 'Huye',
        sector: 'Butare',
        schoolType: 'PRIMARY',
        phone: '+250788333333',
        email: 'info@epb.edu.rw',
        address: 'Huye District, Butare Sector',
        principal: {
          name: 'Mrs. Marie Claire Mukamana',
          phone: '+250788444444',
          email: 'principal@epb.edu.rw'
        },
        createdBy: superAdmin._id
      },
      {
        name: 'Ecole Primaire et Secondaire de Musanze',
        district: 'Musanze',
        sector: 'Musanze',
        schoolType: 'PRIMARY_AND_SECONDARY',
        phone: '+250788555555',
        email: 'info@epsm.edu.rw',
        address: 'Musanze District, Musanze Sector',
        principal: {
          name: 'Mr. Paul Nkurunziza',
          phone: '+250788666666',
          email: 'principal@epsm.edu.rw'
        },
        createdBy: superAdmin._id
      }
    ];

    const createdSchools = [];
    for (const schoolData of schools) {
      const school = new School(schoolData);
      await school.save();
      createdSchools.push(school);
      console.log(`✅ School ${schoolData.name} created`);
    }

    // Create Admin Users
    const admins = [
      {
        email: 'admin@esk.edu.rw',
        password: await bcrypt.hash('admin123', 10),
        name: 'Dr. Jean Baptiste Nkurunziza',
        role: 'ADMIN',
        phone: '+250788222222',
        schoolName: 'Ecole Secondaire de Kigali',
        schoolDistrict: 'Kigali City',
        schoolSector: 'Nyarugenge',
        schoolId: createdSchools[0]._id,
        isApproved: true,
        isActive: true
      },
      {
        email: 'admin@epb.edu.rw',
        password: await bcrypt.hash('admin123', 10),
        name: 'Mrs. Marie Claire Mukamana',
        role: 'ADMIN',
        phone: '+250788444444',
        schoolName: 'Ecole Primaire de Butare',
        schoolDistrict: 'Huye',
        schoolSector: 'Butare',
        schoolId: createdSchools[1]._id,
        isApproved: true,
        isActive: true
      },
      {
        email: 'admin@epsm.edu.rw',
        password: await bcrypt.hash('admin123', 10),
        name: 'Mr. Paul Nkurunziza',
        role: 'ADMIN',
        phone: '+250788666666',
        schoolName: 'Ecole Primaire et Secondaire de Musanze',
        schoolDistrict: 'Musanze',
        schoolSector: 'Musanze',
        schoolId: createdSchools[2]._id,
        isApproved: true,
        isActive: true
      }
    ];

    const createdAdmins = [];
    for (const adminData of admins) {
      const admin = new User(adminData);
      await admin.save();
      createdAdmins.push(admin);
      console.log(`✅ Admin ${adminData.name} created`);
    }

    // Create Teacher Users
    const teachers = [
      // School 1 - Secondary
      {
        email: 'teacher1@esk.edu.rw',
        password: await bcrypt.hash('teacher123', 10),
        name: 'Mr. Paul Nkurunziza',
        role: 'TEACHER',
        phone: '+250788777777',
        schoolName: 'Ecole Secondaire de Kigali',
        schoolDistrict: 'Kigali City',
        schoolSector: 'Nyarugenge',
        schoolId: createdSchools[0]._id,
        className: 'S6 PCB',
        classGrade: 'S6',
        classSection: 'PCB',
        isApproved: true,
        isActive: true
      },
      {
        email: 'teacher2@esk.edu.rw',
        password: await bcrypt.hash('teacher123', 10),
        name: 'Ms. Grace Mukamana',
        role: 'TEACHER',
        phone: '+250788888888',
        schoolName: 'Ecole Secondaire de Kigali',
        schoolDistrict: 'Kigali City',
        schoolSector: 'Nyarugenge',
        schoolId: createdSchools[0]._id,
        className: 'S5 MEG',
        classGrade: 'S5',
        classSection: 'MEG',
        isApproved: true,
        isActive: true
      },
      {
        email: 'teacher3@esk.edu.rw',
        password: await bcrypt.hash('teacher123', 10),
        name: 'Mr. Jean Claude Niyonshuti',
        role: 'TEACHER',
        phone: '+250788999999',
        schoolName: 'Ecole Secondaire de Kigali',
        schoolDistrict: 'Kigali City',
        schoolSector: 'Nyarugenge',
        schoolId: createdSchools[0]._id,
        className: 'S4 A',
        classGrade: 'S4',
        classSection: 'A',
        isApproved: true,
        isActive: true
      },
      // School 2 - Primary
      {
        email: 'teacher1@epb.edu.rw',
        password: await bcrypt.hash('teacher123', 10),
        name: 'Mrs. Immaculee Uwimana',
        role: 'TEACHER',
        phone: '+250788101010',
        schoolName: 'Ecole Primaire de Butare',
        schoolDistrict: 'Huye',
        schoolSector: 'Butare',
        schoolId: createdSchools[1]._id,
        className: 'P6 A',
        classGrade: 'P6',
        classSection: 'A',
        isApproved: true,
        isActive: true
      },
      {
        email: 'teacher2@epb.edu.rw',
        password: await bcrypt.hash('teacher123', 10),
        name: 'Mr. Emmanuel Nkurunziza',
        role: 'TEACHER',
        phone: '+250788111111',
        schoolName: 'Ecole Primaire de Butare',
        schoolDistrict: 'Huye',
        schoolSector: 'Butare',
        schoolId: createdSchools[1]._id,
        className: 'P5 B',
        classGrade: 'P5',
        classSection: 'B',
        isApproved: true,
        isActive: true
      },
      // School 3 - Primary and Secondary
      {
        email: 'teacher1@epsm.edu.rw',
        password: await bcrypt.hash('teacher123', 10),
        name: 'Ms. Chantal Mukamana',
        role: 'TEACHER',
        phone: '+250788121212',
        schoolName: 'Ecole Primaire et Secondaire de Musanze',
        schoolDistrict: 'Musanze',
        schoolSector: 'Musanze',
        schoolId: createdSchools[2]._id,
        className: 'P6 A',
        classGrade: 'P6',
        classSection: 'A',
        isApproved: true,
        isActive: true
      },
      {
        email: 'teacher2@epsm.edu.rw',
        password: await bcrypt.hash('teacher123', 10),
        name: 'Mr. Jean Paul Nkurunziza',
        role: 'TEACHER',
        phone: '+250788131313',
        schoolName: 'Ecole Primaire et Secondaire de Musanze',
        schoolDistrict: 'Musanze',
        schoolSector: 'Musanze',
        schoolId: createdSchools[2]._id,
        className: 'S3 A',
        classGrade: 'S3',
        classSection: 'A',
        isApproved: true,
        isActive: true
      }
    ];

    const createdTeachers = [];
    for (const teacherData of teachers) {
      const teacher = new User(teacherData);
      await teacher.save();
      createdTeachers.push(teacher);
      console.log(`✅ Teacher ${teacherData.name} created`);
    }

    // Create Classes
    const classes = [
      // School 1 - Secondary
      {
        className: 'S6 PCB',
        schoolId: createdSchools[0]._id,
        assignedTeacher: createdTeachers[0]._id,
        createdBy: createdAdmins[0]._id,
        isActive: true
      },
      {
        className: 'S5 MEG',
        schoolId: createdSchools[0]._id,
        assignedTeacher: createdTeachers[1]._id,
        createdBy: createdAdmins[0]._id,
        isActive: true
      },
      {
        className: 'S4 A',
        schoolId: createdSchools[0]._id,
        assignedTeacher: createdTeachers[2]._id,
        createdBy: createdAdmins[0]._id,
        isActive: true
      },
      // School 2 - Primary
      {
        className: 'P6 A',
        schoolId: createdSchools[1]._id,
        assignedTeacher: createdTeachers[3]._id,
        createdBy: createdAdmins[1]._id,
        isActive: true
      },
      {
        className: 'P5 B',
        schoolId: createdSchools[1]._id,
        assignedTeacher: createdTeachers[4]._id,
        createdBy: createdAdmins[1]._id,
        isActive: true
      },
      // School 3 - Primary and Secondary
      {
        className: 'P6 A',
        schoolId: createdSchools[2]._id,
        assignedTeacher: createdTeachers[5]._id,
        createdBy: createdAdmins[2]._id,
        isActive: true
      },
      {
        className: 'S3 A',
        schoolId: createdSchools[2]._id,
        assignedTeacher: createdTeachers[6]._id,
        createdBy: createdAdmins[2]._id,
        isActive: true
      }
    ];

    const createdClasses = [];
    for (const classData of classes) {
      const classObj = new Class(classData);
      await classObj.save();
      createdClasses.push(classObj);
      console.log(`✅ Class ${classData.name} created`);
    }

    // Generate Students
    const firstNames = ['Jean', 'Marie', 'Paul', 'Grace', 'Emmanuel', 'Chantal', 'Jean Paul', 'Immaculee', 'Claude', 'Uwimana', 'Nkurunziza', 'Mukamana', 'Niyonshuti', 'Uwimana', 'Nkurunziza'];
    const lastNames = ['Nkurunziza', 'Mukamana', 'Niyonshuti', 'Uwimana', 'Nkurunziza', 'Mukamana', 'Niyonshuti', 'Uwimana', 'Nkurunziza', 'Mukamana', 'Niyonshuti', 'Uwimana', 'Nkurunziza', 'Mukamana', 'Niyonshuti'];
    const districts = ['Kigali City', 'Huye', 'Musanze', 'Rubavu', 'Nyagatare'];
    const sectors = ['Nyarugenge', 'Butare', 'Musanze', 'Rubavu', 'Nyagatare'];
    const cells = ['Cell 1', 'Cell 2', 'Cell 3', 'Cell 4', 'Cell 5'];
    const villages = ['Village A', 'Village B', 'Village C', 'Village D', 'Village E'];
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const genders = ['M', 'F'];

    const students = [];
    let studentIdCounter = 1;

    for (let i = 0; i < createdClasses.length; i++) {
      const classObj = createdClasses[i];
      const studentCount = Math.floor(Math.random() * 25) + 15; // 15-40 students per class
      
      for (let j = 0; j < studentCount; j++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const gender = genders[Math.floor(Math.random() * genders.length)];
        const age = classObj.className.startsWith('P') ? 
          (parseInt(classObj.className.substring(1)) + 5) : 
          (parseInt(classObj.className.substring(1)) + 11);
        
        const student = new Student({
          firstName,
          lastName,
          studentId: `STU${String(studentIdCounter).padStart(6, '0')}`,
          schoolId: classObj.schoolId,
          classId: classObj._id,
          assignedTeacher: classObj.assignedTeacher,
          gender,
          dateOfBirth: new Date(new Date().getFullYear() - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          age,
          address: {
            district: i < 3 ? 'Kigali City' : i < 5 ? 'Huye' : 'Musanze',
            sector: i < 3 ? 'Nyarugenge' : i < 5 ? 'Butare' : 'Musanze',
            cell: cells[Math.floor(Math.random() * cells.length)],
            village: villages[Math.floor(Math.random() * villages.length)]
          },
          socioEconomic: {
            ubudeheLevel: Math.floor(Math.random() * 4) + 1,
            hasParents: Math.random() > 0.1, // 90% have parents
            parentJob: ['Farmer', 'Teacher', 'Business', 'Government', 'Unemployed'][Math.floor(Math.random() * 5)],
            familyConflict: Math.random() > 0.8, // 20% have family conflict
            numberOfSiblings: Math.floor(Math.random() * 6),
            parentEducationLevel: ['None', 'Primary', 'Secondary', 'University'][Math.floor(Math.random() * 4)]
          },
          guardianContacts: [{
            name: `${firstName} ${lastName} Parent`,
            relation: 'Father',
            phone: `+250788${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
            email: `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@email.com`,
            job: 'Farmer',
            educationLevel: 'Primary',
            isPrimary: true
          }],
          isActive: true,
          enrollmentDate: new Date(2024, 0, Math.floor(Math.random() * 365)),
          riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
          riskFlags: []
        });

        await student.save();
        students.push(student);
        studentIdCounter++;
      }
      console.log(`✅ Generated ${studentCount} students for class ${classObj.name}`);
    }

    // Generate Risk Flags for some students
    const riskFlagTypes = ['ATTENDANCE', 'PERFORMANCE', 'BEHAVIOR', 'FAMILY', 'OTHER'];
    const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const riskDescriptions = {
      'ATTENDANCE': ['Frequent absences', 'Late arrivals', 'Early departures', 'Pattern of absenteeism'],
      'PERFORMANCE': ['Low test scores', 'Failing grades', 'Declining performance', 'Missing assignments'],
      'BEHAVIOR': ['Disruptive behavior', 'Fighting', 'Disrespectful attitude', 'Classroom disruption'],
      'FAMILY': ['Family problems', 'Economic hardship', 'Parent separation', 'Domestic issues'],
      'OTHER': ['Health issues', 'Transportation problems', 'Peer pressure', 'Personal difficulties']
    };

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const flagCount = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0; // 30% chance of having risk flags
      
      for (let j = 0; j < flagCount; j++) {
        const type = riskFlagTypes[Math.floor(Math.random() * riskFlagTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const descriptions = riskDescriptions[type];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        // Map FAMILY to SOCIOECONOMIC for RiskFlag model
        const riskFlagType = type === 'FAMILY' ? 'SOCIOECONOMIC' : type;
        
        const riskFlag = new RiskFlag({
          studentId: student._id,
          schoolId: student.schoolId,
          type: riskFlagType,
          severity,
          title: `${type} Risk: ${description}`,
          description: `Student ${student.firstName} ${student.lastName} shows signs of ${description.toLowerCase()}.`,
          isActive: true,
          createdBy: student.assignedTeacher,
          autoGenerated: true
        });
        
        await riskFlag.save();
        student.riskFlags.push({
          type,
          description,
          severity,
          createdAt: new Date(),
          isResolved: false
        });
      }
      
      await student.save();
    }

    console.log('✅ Generated risk flags for students');

    // Generate Attendance Records
    const attendanceRecords = [];
    for (let i = 0; i < 30; i++) { // Last 30 days
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (const student of students) {
        const isPresent = Math.random() > 0.1; // 90% attendance rate
        const isExcused = !isPresent && Math.random() > 0.3; // 70% of absences are excused
        
        const attendance = new Attendance({
          studentId: student._id,
          schoolId: student.schoolId,
          date: date,
          status: isPresent ? 'PRESENT' : (isExcused ? 'EXCUSED' : 'ABSENT'),
          markedBy: student.assignedTeacher,
          notes: !isPresent ? (isExcused ? 'Excused absence' : 'Unexcused absence') : null
        });
        
        await attendance.save();
        attendanceRecords.push(attendance);
      }
    }

    console.log('✅ Generated attendance records');

    // Generate Performance Records
    const subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'French', 'Kinyarwanda', 'Physics', 'Chemistry', 'Biology'];
    const grades = ['A', 'B', 'C', 'D', 'F'];
    const performanceRecords = [];

    for (const student of students) {
      const recordCount = Math.floor(Math.random() * 10) + 5; // 5-15 performance records per student
      
      for (let i = 0; i < recordCount; i++) {
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const score = Math.floor(Math.random() * 40) + 60; // 60-100 score
        const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
        
        const performance = new Performance({
          studentId: student._id,
          schoolId: student.schoolId,
          classId: student.classId,
          subject,
          score,
          academicYear: '2024/2025',
          term: ['TERM_1', 'TERM_2', 'TERM_3'][Math.floor(Math.random() * 3)],
          assessmentType: ['EXAM', 'TEST', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'FINAL'][Math.floor(Math.random() * 6)],
          enteredBy: student.assignedTeacher
        });
        
        await performance.save();
        performanceRecords.push(performance);
      }
    }

    console.log('✅ Generated performance records');

    // Generate Interventions
    const interventionTypes = ['COUNSELING', 'TUTORING', 'PARENT_MEETING', 'BEHAVIOR_PLAN', 'ACADEMIC_SUPPORT'];
    const statuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const interventions = [];

    for (let i = 0; i < 50; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const type = interventionTypes[Math.floor(Math.random() * interventionTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const intervention = new Intervention({
        studentId: student._id,
        schoolId: student.schoolId,
        type,
        title: `${type.replace('_', ' ')} for ${student.firstName} ${student.lastName}`,
        description: `Intervention plan to address ${student.riskFlags[0]?.description || 'academic concerns'}`,
        status,
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)],
        assignedTo: student.assignedTeacher,
        createdBy: student.assignedTeacher,
        startDate: new Date(),
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Next 30 days
        isActive: true
      });
      
      await intervention.save();
      interventions.push(intervention);
    }

    console.log('✅ Generated interventions');

    // Generate Messages
    const messageTemplates = [
      'Your child {studentName} was absent today. Please contact the school.',
      'Academic performance alert: {studentName} needs attention in {subject}.',
      'Parent meeting scheduled for {studentName} on {date}.',
      'Congratulations! {studentName} has improved in {subject}.',
      'Behavior concern: {studentName} needs parental guidance.'
    ];

    for (let i = 0; i < 100; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const template = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
      const content = template
        .replace('{studentName}', `${student.firstName} ${student.lastName}`)
        .replace('{subject}', subjects[Math.floor(Math.random() * subjects.length)])
        .replace('{date}', new Date().toLocaleDateString());
      
      const message = new Message({
        studentId: student._id,
        schoolId: student.schoolId,
        recipient: student.guardianContacts[0].phone,
        channel: 'SMS',
        content,
        status: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'][Math.floor(Math.random() * 4)],
        sentBy: student.assignedTeacher,
        sentAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
      });
      
      await message.save();
    }

    console.log('✅ Generated messages');

    // Update school statistics
    for (const school of createdSchools) {
      await school.updateStatistics();
    }

    console.log('✅ Updated school statistics');

    console.log('\n🎉 Comprehensive sample data generation completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - 1 Super Admin`);
    console.log(`   - ${createdAdmins.length} School Admins`);
    console.log(`   - ${createdTeachers.length} Teachers`);
    console.log(`   - ${createdSchools.length} Schools`);
    console.log(`   - ${createdClasses.length} Classes`);
    console.log(`   - ${students.length} Students`);
    console.log(`   - ${attendanceRecords.length} Attendance Records`);
    console.log(`   - ${performanceRecords.length} Performance Records`);
    console.log(`   - ${interventions.length} Interventions`);
    console.log(`   - 100 Messages`);

  } catch (error) {
    console.error('❌ Error generating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

generateSampleData();
