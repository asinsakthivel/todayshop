TodayShop

TodayShop is a full-stack e-commerce application (buyer, seller, delivery partner, admin) built with Node.js, Express, MongoDB, and React (Vite).

Features
- Role-based access: buyer, seller, delivery partner, admin
- Admin approval workflows for sellers, products and orders
- Delivery partner KYC flow
- Real-time notifications and cart updates
- Product browsing, cart, checkout and order tracking

Tech stack
- Backend: Node.js, Express, Mongoose
- Frontend: React, Vite
- Database: MongoDB
- Notifications: WebSockets / sockets

 Prerequisites
- Node.js >= 16
- npm or yarn
- MongoDB running or Atlas connection

## Setup
1. Clone the repository (replace with your fork):

```bash
git clone https://github.com/asinsakthivel/todayshop.git
cd todayshop
```

2. Install server dependencies:

```bash
cd server
npm install
```

3. Install client dependencies:

```bash
cd ../client/client
npm install
```

## Environment
Create a `.env` in the `server` folder with values similar to `server/.env.example`:

```
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_URL=your_cloudinary_url (optional)
PORT=5000
```

## Admin Dashboard Login
Use the following admin account to sign in to the admin dashboard:

- Email: `getstarttodayshop@gmail.com`
- Password: `asin123456`

If the admin user is not already present in the database, add it manually or seed the database before logging in.

## Running Locally
Open two terminals.

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend:

```bash
cd client/client
npm run dev
```

The frontend runs on Vite (default port 5173) and the backend on port 5000 by default.

## Build
To create production builds:

```bash
# client
cd client/client
npm run build
```

## Notes
- `uploads/` contains example uploaded files; consider excluding it from git if you don't want to push binaries.
- Add any secrets to `.env` and do not commit them.

## Contributing
Fork the repo, create a branch, and open a PR. For questions or issues, open an issue in the GitHub repo.

## License
MIT

---

Repository: https://github.com/asinsakthivel
