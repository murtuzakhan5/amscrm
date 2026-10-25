import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Lead } from '../models/Lead.js';
import { LeadActivity } from '../models/LeadActivity.js';
import { LeadFollowUp } from '../models/LeadFollowUp.js';
import { Client } from '../models/Client.js';
import { Meeting } from '../models/Meeting.js';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Deal } from '../models/Deal.js';
import { Attendance } from '../models/Attendance.js';
import { Notification } from '../models/Notification.js';
import { seedSuperAdmin } from './seedSuperAdmin.js';

export const seedDemoData = async () => {
  try {
    console.log('🌱 Starting AMS Crafters complete demo data seed...');

    const adminUser = await seedSuperAdmin();
    const adminEmployee = await Employee.findOne({ user: adminUser._id });

    // 1. Seed Managers
    const managersData = [
      {
        fullName: 'Sarah Jenkins',
        email: 'sarah.jenkins@amscrafters.com',
        department: 'Sales & Business Development',
        designation: 'Sales & Client Director',
        phoneNumber: '+92 321 4567890',
      },
      {
        fullName: 'David Vance',
        email: 'david.vance@amscrafters.com',
        department: 'Custom Software Engineering',
        designation: 'Technical Engineering Lead',
        phoneNumber: '+92 333 5678901',
      },
    ];

    const managerEmployees = [];
    for (const m of managersData) {
      let user = await User.findOne({ email: m.email });
      let emp = null;
      if (!user) {
        user = await User.create({
          email: m.email,
          password: 'Password123!',
          role: 'manager',
          isActive: true,
        });
        emp = await Employee.create({
          employeeId: `AMS-MGR-${Math.floor(100 + Math.random() * 900)}`,
          user: user._id,
          fullName: m.fullName,
          email: m.email,
          phoneNumber: m.phoneNumber,
          department: m.department,
          designation: m.designation,
          role: 'manager',
          manager: adminEmployee._id,
        });
        user.employee = emp._id;
        await user.save();
      } else {
        emp = await Employee.findOne({ user: user._id });
      }
      managerEmployees.push(emp);
    }

    const salesManager = managerEmployees[0];
    const techManager = managerEmployees[1];

    // 2. Seed Employees
    const employeesData = [
      {
        fullName: 'Ali Hassan',
        email: 'ali.hassan@amscrafters.com',
        department: 'Sales & Business Development',
        designation: 'Senior CRM Specialist',
        phoneNumber: '+92 301 2345678',
        manager: salesManager._id,
      },
      {
        fullName: 'Zainab Fatima',
        email: 'zainab.fatima@amscrafters.com',
        department: 'Sales & Business Development',
        designation: 'Business Development Executive',
        phoneNumber: '+92 302 3456789',
        manager: salesManager._id,
      },
      {
        fullName: 'Hamza Tariq',
        email: 'hamza.tariq@amscrafters.com',
        department: 'Custom Software Engineering',
        designation: 'Full Stack MERN Developer',
        phoneNumber: '+92 303 4567890',
        manager: techManager._id,
      },
      {
        fullName: 'Ayesha Khan',
        email: 'ayesha.khan@amscrafters.com',
        department: 'UI/UX Design',
        designation: 'Product UI/UX Designer',
        phoneNumber: '+92 304 5678901',
        manager: techManager._id,
      },
    ];

    const regularEmployees = [];
    for (const e of employeesData) {
      let user = await User.findOne({ email: e.email });
      let emp = null;
      if (!user) {
        user = await User.create({
          email: e.email,
          password: 'Password123!',
          role: 'employee',
          isActive: true,
        });
        emp = await Employee.create({
          employeeId: `AMS-EMP-${Math.floor(100 + Math.random() * 900)}`,
          user: user._id,
          fullName: e.fullName,
          email: e.email,
          phoneNumber: e.phoneNumber,
          department: e.department,
          designation: e.designation,
          role: 'employee',
          manager: e.manager,
        });
        user.employee = emp._id;
        await user.save();
      } else {
        emp = await Employee.findOne({ user: user._id });
      }
      regularEmployees.push(emp);
    }

    const ali = regularEmployees[0];
    const zainab = regularEmployees[1];
    const hamza = regularEmployees[2];

    // 3. Seed Realistic Clients
    const clientA = await Client.findOneAndUpdate(
      { email: 'mark.robinson@apexfintech.io' },
      {
        name: 'Mark Robinson',
        companyName: 'Apex FinTech Solutions',
        email: 'mark.robinson@apexfintech.io',
        phoneNumber: '+1 415 890 1234',
        address: { city: 'San Francisco', state: 'CA', country: 'USA' },
        services: ['Custom Software Development', 'Cloud Solutions & DevOps'],
        accountManager: ali._id,
        status: 'active',
        createdBy: adminUser._id,
      },
      { upsert: true, new: true }
    );

    const clientB = await Client.findOneAndUpdate(
      { email: 'elena.rostova@nordiclogistics.eu' },
      {
        name: 'Elena Rostova',
        companyName: 'Nordic Logistics Global',
        email: 'elena.rostova@nordiclogistics.eu',
        phoneNumber: '+44 20 7946 0912',
        address: { city: 'London', country: 'United Kingdom' },
        services: ['Enterprise CRM & ERP Systems'],
        accountManager: zainab._id,
        status: 'active',
        createdBy: adminUser._id,
      },
      { upsert: true, new: true }
    );

    // 4. Seed Leads across all 9 Pipeline Statuses
    const leadsSeed = [
      {
        leadId: 'AMS-LEAD-1001',
        clientName: 'Alexander Hayes',
        companyName: 'Quantum Dynamics Corp',
        email: 'alex.hayes@quantumcorp.com',
        phoneNumber: '+1 617 555 0192',
        whatsappNumber: '+1 617 555 0192',
        leadSource: 'LinkedIn',
        interestedService: 'Custom Software Development',
        projectRequirements: 'Enterprise real-time inventory and high-frequency trading analytics dashboard.',
        estimatedBudget: 45000,
        currency: 'USD',
        priority: 'urgent',
        status: 'negotiation',
        assignedTo: ali._id,
      },
      {
        leadId: 'AMS-LEAD-1002',
        clientName: 'Sophia Chen',
        companyName: 'MedPulse Health Systems',
        email: 'schen@medpulse.health',
        phoneNumber: '+1 206 555 0148',
        whatsappNumber: '+1 206 555 0148',
        leadSource: 'Website Form',
        interestedService: 'Web Application Development',
        projectRequirements: 'HIPAA compliant patient portal with automated appointment booking and telemedicine video integration.',
        estimatedBudget: 32000,
        currency: 'USD',
        priority: 'high',
        status: 'proposal_sent',
        assignedTo: zainab._id,
      },
      {
        leadId: 'AMS-LEAD-1003',
        clientName: 'Liam O’Connor',
        companyName: 'Dublin SaaS Labs',
        email: 'liam@dublinsaas.ie',
        phoneNumber: '+353 1 496 0123',
        leadSource: 'Referral',
        interestedService: 'Mobile App Development (iOS & Android)',
        projectRequirements: 'Cross-platform mobile application for B2B procurement workflow.',
        estimatedBudget: 28000,
        currency: 'USD',
        priority: 'medium',
        status: 'meeting_scheduled',
        assignedTo: ali._id,
      },
      {
        leadId: 'AMS-LEAD-1004',
        clientName: 'Marcus Sterling',
        companyName: 'Sterling Real Estate Group',
        email: 'marcus@sterlingrealty.co.uk',
        phoneNumber: '+44 161 496 0234',
        leadSource: 'Google Ads',
        interestedService: 'Enterprise CRM & ERP Systems',
        projectRequirements: 'Custom real estate brokerage CRM with property listing sync and lead nurturing pipelines.',
        estimatedBudget: 55000,
        currency: 'USD',
        priority: 'high',
        status: 'follow_up_required',
        assignedTo: zainab._id,
      },
      {
        leadId: 'AMS-LEAD-1005',
        clientName: 'Nadia Petrova',
        companyName: 'Apex FinTech Solutions',
        email: 'nadia.p@apexfintech.io',
        phoneNumber: '+1 415 890 5678',
        leadSource: 'Upwork',
        interestedService: 'Custom Software Development',
        projectRequirements: 'Payment gateway integration and microservice refactoring.',
        estimatedBudget: 60000,
        currency: 'USD',
        priority: 'urgent',
        status: 'won',
        assignedTo: ali._id,
        convertedClient: clientA._id,
      },
      {
        leadId: 'AMS-LEAD-1006',
        clientName: 'Tariq Al-Mansoor',
        companyName: 'Gulf Retail Ventures',
        email: 'tariq@gulfretail.ae',
        phoneNumber: '+971 4 312 9000',
        leadSource: 'Inbound Call',
        interestedService: 'Web Application Development',
        projectRequirements: 'Multivendor e-commerce marketplace for luxury retail brands in UAE.',
        estimatedBudget: 15000,
        currency: 'USD',
        priority: 'low',
        status: 'lost',
        lostReason: 'Budget was below AMS minimum project scope threshold.',
        assignedTo: zainab._id,
      },
      {
        leadId: 'AMS-LEAD-1007',
        clientName: 'Chloe Bennett',
        companyName: 'Bennett Media House',
        email: 'chloe@bennettmedia.com',
        phoneNumber: '+1 312 555 8923',
        leadSource: 'Website Form',
        interestedService: 'UI/UX Design & Prototyping',
        projectRequirements: 'Complete UX overhaul and Figma design system for media streaming application.',
        estimatedBudget: 18000,
        currency: 'USD',
        priority: 'medium',
        status: 'new_lead',
        assignedTo: null,
      },
    ];

    for (const leadData of leadsSeed) {
      const existing = await Lead.findOne({ leadId: leadData.leadId });
      let lead = existing;
      if (!existing) {
        lead = await Lead.create({
          ...leadData,
          createdBy: adminUser._id,
        });

        await LeadActivity.create({
          lead: lead._id,
          activityType: 'created',
          title: 'Lead Created',
          description: `Created via ${leadData.leadSource}`,
          performedBy: adminUser._id,
        });

        if (leadData.assignedTo) {
          await LeadActivity.create({
            lead: lead._id,
            activityType: 'assigned',
            title: 'Lead Assigned',
            description: `Assigned to team member for initial outreach`,
            performedBy: adminUser._id,
          });
        }
      }
    }

    // 5. Seed Deals in Pipeline
    const dealsSeed = [
      {
        title: 'Apex FinTech Core Engine',
        client: clientA._id,
        value: 60000,
        currency: 'USD',
        owner: ali._id,
        stage: 'won',
        status: 'won',
        paymentStatus: 'partially_paid',
        actualRevenueReceived: 30000,
        expectedCloseDate: new Date('2026-11-15'),
        probability: 100,
      },
      {
        title: 'Nordic Logistics ERP System',
        client: clientB._id,
        value: 48000,
        currency: 'USD',
        owner: zainab._id,
        stage: 'negotiation',
        status: 'open',
        paymentStatus: 'unpaid',
        actualRevenueReceived: 0,
        expectedCloseDate: new Date('2026-11-30'),
        probability: 80,
      },
      {
        title: 'Quantum Corp High Frequency Analytics',
        value: 45000,
        currency: 'USD',
        owner: ali._id,
        stage: 'proposal_sent',
        status: 'open',
        paymentStatus: 'unpaid',
        actualRevenueReceived: 0,
        expectedCloseDate: new Date('2026-12-10'),
        probability: 60,
      },
    ];

    for (const d of dealsSeed) {
      const exists = await Deal.findOne({ title: d.title });
      if (!exists) {
        await Deal.create({ ...d, createdBy: adminUser._id });
      }
    }

    // 6. Seed Meetings
    const today = new Date();
    const meeting1Start = new Date(today);
    meeting1Start.setHours(15, 0, 0, 0);
    const meeting1End = new Date(today);
    meeting1End.setHours(16, 0, 0, 0);

    const meeting2Start = new Date(today);
    meeting2Start.setDate(meeting2Start.getDate() + 1);
    meeting2Start.setHours(11, 0, 0, 0);
    const meeting2End = new Date(meeting2Start);
    meeting2End.setHours(12, 0, 0, 0);

    const meetingsData = [
      {
        meetingId: 'AMS-MTG-1001',
        title: 'Quantum Dynamics Technical Discovery Call',
        meetingType: 'online_meeting',
        startTimeUTC: meeting1Start,
        endTimeUTC: meeting1End,
        timezone: 'Asia/Karachi',
        meetingLink: 'https://meet.google.com/ams-qnt-disc',
        assignedEmployee: ali._id,
        agenda: 'Review backend latency requirements, architectural diagrams, and estimated timeline.',
        status: 'scheduled',
      },
      {
        meetingId: 'AMS-MTG-1002',
        title: 'Apex FinTech Sprint Milestone Review',
        meetingType: 'online_meeting',
        startTimeUTC: meeting2Start,
        endTimeUTC: meeting2End,
        timezone: 'Asia/Karachi',
        meetingLink: 'https://meet.google.com/ams-apx-revw',
        assignedEmployee: ali._id,
        relatedClient: clientA._id,
        agenda: 'Demo user authentication and wallet API prototypes to client executives.',
        status: 'scheduled',
      },
    ];

    for (const m of meetingsData) {
      const exists = await Meeting.findOne({ meetingId: m.meetingId });
      if (!exists) {
        await Meeting.create({ ...m, createdBy: adminUser._id });
      }
    }

    // 7. Seed Tasks
    const taskDue1 = new Date(today);
    taskDue1.setDate(taskDue1.getDate() + 2);

    const tasksSeed = [
      {
        taskId: 'AMS-TSK-1001',
        title: 'Prepare Quotation and Scope of Work for Quantum Dynamics',
        description: 'Detail cloud architecture, monthly server estimates, and delivery milestones.',
        assignedTo: ali._id,
        assignedBy: adminUser._id,
        priority: 'urgent',
        status: 'in_progress',
        dueDate: taskDue1,
      },
      {
        taskId: 'AMS-TSK-1002',
        title: 'Conduct MedPulse Health Telemedicine Demo',
        description: 'Walkthrough video consultation room and automated appointment booking engine.',
        assignedTo: zainab._id,
        assignedBy: adminUser._id,
        priority: 'high',
        status: 'todo',
        dueDate: taskDue1,
      },
      {
        taskId: 'AMS-TSK-1003',
        title: 'Finalize Database Schema for Nordic Logistics ERP',
        description: 'Complete Mongoose models for fleet tracking, warehouse inventory, and invoice reconciliation.',
        assignedTo: hamza._id,
        assignedBy: techManager.user,
        priority: 'high',
        status: 'in_review',
        dueDate: taskDue1,
      },
    ];

    for (const t of tasksSeed) {
      const exists = await Task.findOne({ taskId: t.taskId });
      if (!exists) {
        await Task.create(t);
      }
    }

    // 8. Seed Projects
    const projectA = await Project.findOneAndUpdate(
      { projectName: 'Apex FinTech Core Engine' },
      {
        projectName: 'Apex FinTech Core Engine',
        client: clientA._id,
        description: 'High-performance microservices architecture and real-time ledger settlement engine.',
        assignedTeam: [ali._id, hamza._id],
        projectManager: techManager._id,
        startDate: new Date('2026-08-01'),
        deadline: new Date('2026-12-15'),
        budget: 60000,
        currency: 'USD',
        status: 'in_progress',
        progressPercentage: 65,
        deliverables: [
          { title: 'Auth & Multi-factor security service', isCompleted: true },
          { title: 'Ledger database schema & transactions', isCompleted: true },
          { title: 'Real-time WebSocket market feed', isCompleted: false },
          { title: 'End-to-End Penetration Test & Audit', isCompleted: false },
        ],
        createdBy: adminUser._id,
      },
      { upsert: true, new: true }
    );

    // 9. Seed Attendance for today
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const checkinTime = new Date(today);
    checkinTime.setHours(9, 10, 0, 0); // 9:10 AM - on time

    await Attendance.findOneAndUpdate(
      { employee: ali._id, date: todayStr },
      {
        employee: ali._id,
        date: todayStr,
        checkInTime: checkinTime,
        status: 'present',
        lateMinutes: 0,
      },
      { upsert: true }
    );

    // 10. Seed In-App Notifications
    const aliUser = await User.findById(ali.user);
    if (aliUser) {
      await Notification.create({
        recipient: aliUser._id,
        title: 'New High Priority Lead Assigned',
        message: 'Lead AMS-LEAD-1001 (Quantum Dynamics Corp) has been assigned to you.',
        type: 'lead_assigned',
        link: '/leads',
      });
    }

    console.log('✅ Demo data seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Credentials Summary:');
    console.log('   Admin:    admin@amscrafters.com      | AdminPassword123!');
    console.log('   Manager:  sarah.jenkins@amscrafters.com | Password123!');
    console.log('   Employee: ali.hassan@amscrafters.com   | Password123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Failed to seed demo data:', error);
    throw error;
  }
};

// If run directly from CLI
if (process.argv[1]?.endsWith('seedDemoData.js')) {
  (async () => {
    await connectDB();
    await seedDemoData();
    await disconnectDB();
    process.exit(0);
  })();
}
