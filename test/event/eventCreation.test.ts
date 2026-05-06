import request from 'supertest';
import { CreateApp } from '../../src/app';
import { CreateInMemoryEventRepository } from '../../src/event/EventRepository';
import { CreateEventService } from '../../src/event/EventService';
import { CreateEventController } from '../../src/event/EventController';
import { CreateAttendeeService } from '../../src/attendee/AttendeeService';
import { CreateAttendeeController } from '../../src/attendee/AttendeeController';
import { CreateRSVPRepository } from '../../src/rsvp/RSVPRepository';
import { CreateRSVPService } from '../../src/rsvp/RSVPService';
import { CreateRSVPController } from '../../src/rsvp/RSVPController';
import { CreateLoggingService } from '../../src/service/LoggingService';
import { CreateAuthController } from '../../src/auth/AuthController';
import { CreateAuthService } from '../../src/auth/AuthService';
import { CreateInMemoryUserRepository } from '../../src/auth/InMemoryUserRepository';
import { CreatePasswordHasher } from '../../src/auth/PasswordHasher';
import { CreateAdminUserService } from '../../src/auth/AdminUserService';
import { CreateDashboardController } from '../../src/dashboard/DashboardController';
import { CreateDashboardService } from '../../src/dashboard/DashboardService';

function buildApp() {
  const logger = CreateLoggingService();

  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, logger);

  const eventRepository = CreateInMemoryEventRepository();
  const rsvpRepository = CreateRSVPRepository();
  const eventService = CreateEventService(eventRepository);
  const eventController = CreateEventController(eventService, logger, rsvpRepository);
  const rsvpService = CreateRSVPService(rsvpRepository, eventRepository);
  const rsvpController = CreateRSVPController(rsvpService, logger);
  const dashboardService = CreateDashboardService(rsvpRepository, eventRepository);
  const dashboardController = CreateDashboardController(dashboardService, logger);
  const attendeeService = CreateAttendeeService(eventRepository, rsvpRepository);
  const attendeeController = CreateAttendeeController(attendeeService, logger, authUsers);

  return CreateApp(
    eventController,
    authController,
    null,
    logger,
    rsvpController,
    dashboardController,
    attendeeController,
  ).getExpressApp();
}

const validEvent = {
  title: 'Test Event',
  description: 'A test description',
  location: 'UMass Amherst',
  category: 'Social',
  startDatetime: '2030-06-01T10:00',
  endDatetime: '2030-06-01T12:00',
  capacity: '20',
};

describe('Feature 1 — Event Creation', () => {
  let app: any;

  beforeEach(() => {
    app = buildApp();
  });

  async function loginAsStaff(agent: any) {
    await agent.post('/login').type('form')
      .send({ email: 'staff@app.test', password: 'password123' });
  }

  async function loginAsUser(agent: any) {
    await agent.post('/login').type('form')
      .send({ email: 'user@app.test', password: 'password123' });
  }

  it('GET /events/new as staff returns 200', async () => {
    const agent = request.agent(app);
    await loginAsStaff(agent);
    const res = await agent.get('/events/new');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Create New Event');
  });

  it('GET /events/new as user returns 403', async () => {
    const agent = request.agent(app);
    await loginAsUser(agent);
    const res = await agent.get('/events/new');
    expect(res.status).toBe(403);
  });

  it('POST /events with valid data redirects to new event', async () => {
    const agent = request.agent(app);
    await loginAsStaff(agent);
    const res = await agent.post('/events').type('form').send(validEvent);
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/events\/.+/);
  });

  it('POST /events with missing title returns 400', async () => {
    const agent = request.agent(app);
    await loginAsStaff(agent);
    const res = await agent.post('/events').type('form')
      .send({ ...validEvent, title: '' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('Title is required');
  });

  it('POST /events with missing location returns 400', async () => {
    const agent = request.agent(app);
    await loginAsStaff(agent);
    const res = await agent.post('/events').type('form')
      .send({ ...validEvent, location: '' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('Location is required');
  });

  it('POST /events with end before start returns 400', async () => {
    const agent = request.agent(app);
    await loginAsStaff(agent);
    const res = await agent.post('/events').type('form')
      .send({ ...validEvent, endDatetime: '2030-06-01T09:00' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('End time must be after');
  });

  it('POST /events with capacity 0 returns 400', async () => {
    const agent = request.agent(app);
    await loginAsStaff(agent);
    const res = await agent.post('/events').type('form')
      .send({ ...validEvent, capacity: '0' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('Capacity must be at least 1');
  });

  it('POST /events as user role returns 403', async () => {
    const agent = request.agent(app);
    await loginAsUser(agent);
    const res = await agent.post('/events').type('form').send(validEvent);
    expect(res.status).toBe(403);
  });

  it('POST /events with blank capacity succeeds (unlimited)', async () => {
    const agent = request.agent(app);
    await loginAsStaff(agent);
    const res = await agent.post('/events').type('form')
      .send({ ...validEvent, capacity: '' });
    expect(res.status).toBe(302);
  });
});
