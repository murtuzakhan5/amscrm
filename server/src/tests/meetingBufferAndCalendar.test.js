import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDemoData } from '../scripts/seedDemoData.js';
import { Employee } from '../models/Employee.js';
import { Lead } from '../models/Lead.js';

let app;

beforeAll(async () => {
  await connectDB();
  await seedDemoData();
  app = createApp();
}, 120000);

afterAll(async () => {
  await disconnectDB();
});

describe('New Features: 2-Hour Meeting Gap & Client Calendar & Future Leads', () => {
  let adminCookies = [];
  let testEmployeeId = '';
  let testLeadId = '';

  it('Super Admin logs in', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@amscrafters.com',
        password: 'AdminPassword123!',
      });

    expect(res.status).toBe(200);
    adminCookies = res.headers['set-cookie'];

    const emp = await Employee.findOne();
    expect(emp).toBeDefined();
    testEmployeeId = emp._id.toString();

    const lead = await Lead.findOne();
    expect(lead).toBeDefined();
    testLeadId = lead._id.toString();
  });

  it('Schedules first meeting successfully (10:00 - 11:00)', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/meetings')
      .set('Cookie', adminCookies)
      .send({
        title: 'Strategy Discovery Call',
        startTimeUTC: `${dateStr}T10:00:00.000Z`,
        endTimeUTC: `${dateStr}T11:00:00.000Z`,
        assignedEmployee: testEmployeeId,
        meetingType: 'online_meeting',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.meeting.title).toBe('Strategy Discovery Call');
  });

  it('Rejects second meeting within 2-hour buffer window (11:30 - 12:30) with 409 Conflict', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/meetings')
      .set('Cookie', adminCookies)
      .send({
        title: 'Follow-up Pricing Discussion',
        startTimeUTC: `${dateStr}T11:30:00.000Z`,
        endTimeUTC: `${dateStr}T12:30:00.000Z`,
        assignedEmployee: testEmployeeId,
        meetingType: 'online_meeting',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Schedule Conflict');
    expect(res.body.message).toContain('2-hour preparation gap');
  });

  it('Allows second meeting scheduled after 2-hour buffer (13:00 - 14:00)', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/meetings')
      .set('Cookie', adminCookies)
      .send({
        title: 'Afternoon Architecture Review',
        startTimeUTC: `${dateStr}T13:00:00.000Z`,
        endTimeUTC: `${dateStr}T14:00:00.000Z`,
        assignedEmployee: testEmployeeId,
        meetingType: 'online_meeting',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.meeting.title).toBe('Afternoon Architecture Review');
  });

  it('GET /api/clients/calendar returns aggregated onboardings grouped by date', async () => {
    const res = await request(app)
      .get('/api/clients/calendar')
      .set('Cookie', adminCookies);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.totalClients).toBeGreaterThanOrEqual(1);

    if (res.body.data.length > 0) {
      const event = res.body.data[0];
      expect(event.start).toBeDefined();
      expect(event.extendedProps.count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(event.extendedProps.clients)).toBe(true);
    }
  });

  it('Updates lead status to in_future_interested with futureFollowUpDate and futureReason', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);

    const res = await request(app)
      .patch(`/api/leads/${testLeadId}/status`)
      .set('Cookie', adminCookies)
      .send({
        status: 'in_future_interested',
        futureFollowUpDate: futureDate.toISOString(),
        futureReason: 'Budget currently allocated for next quarter',
        notes: 'Client confirmed strong interest, will review budget in Nov.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lead.status).toBe('in_future_interested');
    expect(res.body.data.lead.futureReason).toBe('Budget currently allocated for next quarter');
  });

  it('Filters leads by category=future returns only in_future_interested leads', async () => {
    const res = await request(app)
      .get('/api/leads?category=future')
      .set('Cookie', adminCookies);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((l) => l.status === 'in_future_interested')).toBe(true);
  });
});
