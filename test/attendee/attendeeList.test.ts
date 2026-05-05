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

describe('Feature 12 — Attendee List', () => {
  let app: any;

  beforeEach(() => { app = buildApp(); });

  async function loginAs(agent: any, email: string) {
    await agent.post('/login').type('form')
      .send({ email, password: 'password123' });
  }

  // Event 1 (id:"1") is organized by user-staff (staff@app.test)
  // Event 2 (id:"2") is organized by user-admin (admin@app.test)

  it('admin can view attendee list → 200', async () => {
    const agent = request.agent(app);
    await loginAs(agent, 'admin@app.test');
    const res = await agent.get('/events/1/attendees');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Attending');
    expect(res.text).toContain('Waitlisted');
  });

  it('admin can view attendee list for event 2 → 200', async () => {
    const agent = request.agent(app);
    await loginAs(agent, 'admin@app.test');
    const res = await agent.get('/events/2/attendees');
    expect(res.status).toBe(200);
  });

  it('regular user cannot view attendee list → 403', async () => {
    const agent = request.agent(app);
    await loginAs(agent, 'user@app.test');
    const res = await agent.get('/events/1/attendees');
    expect(res.status).toBe(403);
  });

  // staff@app.test (user-staff) is NOT organizer of event 2 (organized by user-admin)
  it('staff who is not organizer cannot view → 403', async () => {
    const agent = request.agent(app);
    await loginAs(agent, 'staff@app.test');
    const res = await agent.get('/events/2/attendees');
    expect(res.status).toBe(403);
  });

  it('nonexistent event returns 404', async () => {
    const agent = request.agent(app);
    await loginAs(agent, 'admin@app.test');
    const res = await agent.get('/events/99999/attendees');
    expect(res.status).toBe(404);
  });

  it('unauthenticated request redirects to login → 302', async () => {
    const res = await request(app).get('/events/1/attendees').redirects(0);
    expect(res.status).toBe(302);
  });

  it('empty attendee list renders zero counts', async () => {
    const agent = request.agent(app);
    await loginAs(agent, 'admin@app.test');
    const res = await agent.get('/events/1/attendees');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Attending (0)');
  });
});
