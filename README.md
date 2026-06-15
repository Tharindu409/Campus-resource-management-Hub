<!-- prettier-ignore -->
# Smart Campus — Full-Stack Resource Management

An elegant, full-stack Smart Campus platform that helps users and administrators book campus resources, file and manage support tickets, attach files, and receive notifications. Built with a Java Spring Boot backend and a React + Vite frontend.

--

## 🚀 Highlights

- Intuitive resource booking with calendar view
- Ticketing system with attachments and role-based workflows
- Admin and technician panels for management and fixes
- Notification center and real-time updates (where configured)

## 📦 Repo Layout

- `backend/` — Spring Boot APIs and business logic (Maven)
- `frontend/` — React + Vite single-page app
- `uploads/` — persisted file attachments

## 🛠️ Tech Stack

- Backend: Java, Spring Boot, Maven
- Frontend: React, Vite, JavaScript
- Persistence: (see `backend` config — likely H2 / MySQL / Postgres)

## ▶️ Quick Start (Development)

1) Start the backend

```bash
cd backend
./mvnw spring-boot:run    # macOS / Linux
mvnw.cmd spring-boot:run  # Windows
```

Backend default: http://localhost:8080

2) Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default: http://localhost:5173

Tip: Ensure the frontend API base URL points to the backend (see `frontend/src/api/axios.js`).

## ⚙️ Configuration

- Backend properties: `backend/src/main/resources/application.properties`
- Common envs you may need to set:

```env
# Example envs (replace values as needed)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/smartcampus
SPRING_DATASOURCE_USERNAME=youruser
SPRING_DATASOURCE_PASSWORD=yourpass
JWT_SECRET=replace-with-secure-secret
```

## ✅ Testing

- Backend unit tests (Maven):

```bash
cd backend
./mvnw test
```

- Frontend tests (if present):

```bash
cd frontend
npm test
```

## 📦 Production Build

- Frontend: `npm run build` (creates `dist/`)
- Backend: `./mvnw package` then run the generated JAR

You can serve the `dist/` directory via any static server or integrate it into the backend as static resources.

## 🧭 Development Tips

- Use browser devtools and backend logs for API debugging.
- Uploads are saved to the `uploads/` folder — ensure write permissions.
- To change API endpoints, modify `frontend/src/api/axios.js` and backend `application.properties` accordingly.

## 🤝 Contributing

Contributions welcome — please open an issue describing the feature or bug, then submit a pull request.

## 📜 License

Add your license here (e.g., MIT). If unsure, add `LICENSE` file at the repo root.

## 📬 Contact

Project owner / maintainer: update this section with name and email or a link to your GitHub profile.

--

Made with ❤️ for campus efficiency.
