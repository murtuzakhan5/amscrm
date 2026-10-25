import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDemoData } from '../scripts/seedDemoData.js';
import { Employee } from '../models/Employee.js';

let app;

beforeAll(async () => {
  await connectDB();
  await seedDemoData();
  app = createApp();
}, 120000);

afterAll(async () => {
  await disconnectDB();
});

describe('Employee Client Access & 1-Month Call-Back Automation Tests', () => {
  let employeeCookies = [];
  let testEmployee = null;
  let createdClientId = '';
  let scheduledFollowUpId = '';

  it('Employee logs in successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ali.hassan@amscrafters.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('employee');
    employeeCookies = res.headers['set-cookie'];

    testEmployee = await Employee.findOne({ email: 'ali.hassan@amscrafters.com' });
    expect(testEmployee).toBeDefined();
  });

  it('Employee can directly create a new client (auto-assigned to employee)', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Cookie', employeeCookies)
      .send({
        name: 'Nexus Cloud Technologies',
        companyName: 'Nexus Cloud Group',
        email: 'contact@nexuscloud.tech',
        phoneNumber: '+92 300 1234567',
        services: ['Cloud Architecture', 'DevOps'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.client.name).toBe('Nexus Cloud Technologies');
    expect(res.body.data.client.accountManager._id.toString()).toBe(testEmployee._id.toString());

    createdClientId = res.body.data.client._id;
  });

  it('Employee can schedule a 1-month call-back for the client', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    const dateStr = targetDate.toISOString().split('T')[0];

    const res = await request(app)
      .post(`/api/clients/${createdClientId}/schedule-call`)
      .set('Cookie', employeeCookies)
      .send({
        followUpDate: dateStr,
        reason: 'Client requested call-back after 1 month',
        title: '1-Month Follow-Up Call',
        notes: 'Review proposal budget and timeline requirements.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.client.nextFollowUpDate).toBeDefined();
    expect(res.body.data.client.followUpReason).toBe('Client requested call-back after 1 month');
    expect(res.body.data.client.followUps.length).toBeGreaterThanOrEqual(1);

    const fu = res.body.data.client.followUps[0];
    expect(fu.status).toBe('pending');
    scheduledFollowUpId = fu._id;
  });

  it('Employee can add an interaction note to the client timeline', async () => {
    const res = await request(app)
      .post(`/api/clients/${createdClientId}/notes`)
      .set('Cookie', employeeCookies)
      .send({
        text: 'Spoke with CFO Mark. They will finalize their Q4 software budget by end of month.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.client.clientNotes.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.client.clientNotes[0].text).toContain('Spoke with CFO Mark');
  });

  it('Employee can complete a scheduled follow-up call', async () => {
    const res = await request(app)
      .patch(`/api/clients/${createdClientId}/follow-ups/${scheduledFollowUpId}`)
      .set('Cookie', employeeCookies)
      .send({
        status: 'completed',
        outcomeNotes: 'Client confirmed interest in proceeding with Phase 1.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.client.followUpStatus).toBe('completed');
  });

  it('GET /api/employees/:id returns employee clients and managedClients count', async () => {
    const res = await request(app)
      .get(`/api/employees/${testEmployee._id}`)
      .set('Cookie', employeeCookies);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.clients)).toBe(true);
    expect(res.body.data.clients.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.stats.managedClients).toBeGreaterThanOrEqual(1);
  });
});
