# TeamSync Next Level

A polished real-time collaborative Kanban workspace built with Next.js, Express, MongoDB, Mongoose and Socket.IO.

## Included features

- Secure JWT signup/login/session handling
- Dashboard with workspace search and portfolio progress
- Real-time Kanban board with drag & drop
- Four default workflow stages: To do, In progress, Review, Done
- Add, rename and delete columns
- Add, edit and delete tasks
- Task descriptions, tags, priorities, due dates and assignees
- Checklists with completion progress
- Search, priority filter, assignee filter and sorting
- Live presence indicators and activity feed
- Invite members by email
- Owner/member access control
- Remove members / leave board
- Owner-only archive/delete controls
- Board statistics and progress analytics
- Responsive mobile/tablet/desktop layouts
- Light/dark mode
- Smooth transitions, glass cards and gradient visual system
- Socket.IO updates across connected users
- Bounded activity history to keep documents healthy

## Run locally

### Backend

```bash
cd backend
npm install
npm run dev
```

Create `backend/.env` from `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/teamsync
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

The frontend defaults to `http://localhost:5000/api`. If your API is deployed elsewhere, create `frontend/.env.local` from `.env.local.example` and set `NEXT_PUBLIC_API_URL` accordingly.

## Important access behavior

Board owners automatically become members when a board is created. Existing boards remain accessible to their owner even if older data did not include the owner in the `members` array. Members can access shared boards; only the owner can invite/remove members and permanently delete the board.
