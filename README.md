# User Registry

Full stack user registry app: **React** front end (Vite) and a **serverless REST API** on Netlify Functions, with data stored in **Netlify Blobs**.

**Live demo:** [tela-cadastro-usuario.netlify.app](https://tela-cadastro-usuario.netlify.app)

![Main screen](docs/cadastro.png)

## Features

- Add, edit and delete users (with a confirmation before deleting)
- Search by name or email
- Validation in the form and on the server, with a message for each field
- Unique email (case-insensitive)
- Loading, empty and connection error states
- Responsive and accessible layout (keyboard navigation, `aria-*` attributes)
- Demo data reset every day by a scheduled function

## API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/usuarios?busca=text` | List (newest first), with optional search |
| `POST` | `/api/usuarios` | Create `{ nome, email, idade }` (name, email, age) |
| `PUT` | `/api/usuarios/:id` | Update |
| `DELETE` | `/api/usuarios/:id` | Delete |

Errors return `{ erro, campos }` (error message and per-field messages) with the right HTTP status (400, 404, 409).

## Structure

```
frontend/                  React + Vite
  src/App.jsx              list, search, edit, delete confirmation
  src/Formulario.jsx       form with validation
  src/api.js               API client
netlify/functions/
  usuarios.mjs             REST API
  repor-demo.mjs           scheduled function (daily demo reset)
netlify/lib/usuarios.mjs   business rules (testable without Netlify)
tests/api.test.mjs         API tests (node:test)
```

## Run locally

```bash
npm install
npm test                      # API tests
npm i -g netlify-cli
netlify dev                   # front end + API at http://localhost:8888
```

## Deploy to Netlify

Connect the repository on Netlify. `netlify.toml` already sets the build command (`npm run build`), the publish folder (`frontend/dist`) and the functions. Netlify Blobs needs no setup.

## History

The first version was built during the DevClub course with Express, Prisma and MongoDB. Version 2 moved the API to serverless and rewrote the front end with validation, editing, search and tests.

## Author

**Anderson Frota Gonçalves** · [Portfolio](https://andersonfrota.netlify.app) · [LinkedIn](https://www.linkedin.com/in/andersongfrota)
