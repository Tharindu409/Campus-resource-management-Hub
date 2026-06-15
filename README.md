# Smart Campus — Full-Stack Application

A Smart Campus platform providing resource booking, ticketing/support, user management, attachments, and notifications. This repository contains a Java Spring backend and a React + Vite frontend.

## Repository structure

- `backend/` — Java Spring Boot application (Maven)
- `frontend/` — React app scaffolded with Vite
- `uploads/` — uploaded files and attachments

## Key Features

- Resource booking and calendar views
- Ticket creation, assignment, and tracking
- File attachments for tickets and resources
- User management and role-based panels (admin, technician, user)
- Notifications and notification panel

## Requirements

- Java 17+ (or the version specified in `backend/pom.xml`)
- Maven
- Node.js 18+ and npm/yarn

## Backend (Java Spring)

1. Navigate to the backend folder:

```bash
cd backend
```

2. Build and run with Maven:

```bash
./mvnw spring-boot:run    # on Unix/macOS
mvnw.cmd spring-boot:run  # on Windows
```

3. The backend runs by default on `http://localhost:8080` (check `src/main/resources/application.properties`).

## Frontend (React + Vite)

1. Navigate to the frontend folder:

```bash
cd frontend
```

2. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

3. The frontend dev server typically runs on `http://localhost:5173`.

## Environment and Configuration

- Backend configuration is under `backend/src/main/resources/application.properties`.
- Update API base URLs in `frontend/src/api/axios.js` or `frontend/src/api/index.js` if needed.

## Tests

- Backend: use Maven to run tests

```bash
cd backend
./mvnw test
```

- Frontend: run the standard npm test command if tests are present

```bash
cd frontend
npm test
```

## Deployment

- Build the frontend for production with `npm run build` and serve the `dist/` folder via static hosting or integrate into the backend as static resources.
- Build the backend with `./mvnw package` and run the produced JAR.

## Contributing

- Follow repository conventions. Open issues and PRs for enhancements or bug fixes.

## License

Specify your license here (e.g., MIT) or remove this section.

## Contact

Project owner / maintainer: update this section with contact details.
