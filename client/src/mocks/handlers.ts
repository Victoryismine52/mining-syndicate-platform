import { rest } from 'msw';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

interface Lead {
  id: number;
  name: string;
  email: string;
}

interface Company {
  id: number;
  name: string;
}

const adminUser = {
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
};

let tasks: Task[] = [
  { id: 1, title: 'Initial task', completed: false },
];

let leads: Lead[] = [
  { id: 1, name: 'Jane Doe', email: 'jane@example.com' },
];

const companies: Company[] = [
  { id: 1, name: 'Acme Mining' },
  { id: 2, name: 'Globex Corp' },
];

export const handlers = [
  rest.get('/api/auth/me', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(adminUser));
  }),
  rest.get('/api/auth/user', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(adminUser));
  }),
  rest.post('/api/logout', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  }),
  rest.get('/api/tasks', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(tasks));
  }),
  rest.post('/api/tasks', async (req, res, ctx) => {
    const body = await req.json();
    const newTask: Task = { id: tasks.length + 1, completed: false, ...body };
    tasks.push(newTask);
    return res(ctx.status(201), ctx.json(newTask));
  }),
  rest.get('/api/leads', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(leads));
  }),
  rest.post('/api/leads', async (req, res, ctx) => {
    const body = await req.json();
    const newLead: Lead = { id: leads.length + 1, ...body };
    leads.push(newLead);
    return res(ctx.status(201), ctx.json(newLead));
  }),
  rest.get('/api/companies', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(companies));
  }),
];
