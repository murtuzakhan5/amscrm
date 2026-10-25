import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDemoData } from '../scripts/seedDemoData.js';

let app;

beforeAll(async () => {
  await connectDB();
  await seedDemoData();
  app = createApp();
}, 120000);

afterAll(async () => {
  await disconnectDB();
});

describe('AMS Crafters — Auth & RBAC Integration Tests', () => {
  let adminCookies = [];
  let employeeCookies = [];
  let testLeadId = '';

  it('Health check endpoint returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('Super Admin can log in successfully and receive HttpOnly cookies', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@amscrafters.com',
        password: 'AdminPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.headers['set-cookie']).toBeDefined();

    adminCookies = res.headers['set-cookie'];
  });

  it('Reject login with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@amscrafters.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Employee can log in and receives employee role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ali.hassan@amscrafters.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('employee');
    employeeCookies = res.headers['set-cookie'];
  });

  it('GET /api/auth/me returns authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', adminCookies);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('admin@amscrafters.com');
  });

  it('Admin can view all company leads', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Cookie', adminCookies);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    testLeadId = res.body.data[0]._id;
  });

  it('Admin can create a new lead', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Cookie', adminCookies)
      .send({
        clientName: 'Test Client Corp',
        email: 'contact@testclientcorp.com',
        interestedService: 'Custom Software Development',
        estimatedBudget: 25000,
        priority: 'high',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.lead.clientName).toBe('Test Client Corp');
  });

  it('Admin can access Dashboard Statistics report', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard')
      .set('Cookie', adminCookies);

    expect(res.status).toBe(200);
    expect(res.body.data.cards.totalEmployees).toBeGreaterThan(0);
    expect(res.body.data.cards.totalLeads).toBeGreaterThan(0);
  });

  it('Employee cannot access Admin-only Dashboard report (RBAC enforcement)', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard')
      .set('Cookie', employeeCookies);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Employee can check-in to attendance', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Cookie', employeeCookies);

    // Either 200 (checked in) or 400 (already checked in during seed)
    expect([200, 400]).toContain(res.status);
  });
});
