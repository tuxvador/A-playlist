# 🎵 African Music Map

A collaborative platform to discover and share African music across the continent. Users can explore playlists from different African countries and contribute their favorite artists and songs.

## ✨ Features

- 🗺️ **Interactive Country Map** - Browse music from African countries
- 🎶 **Dual Data Sources** - Pre-loaded playlists + community contributions
- 🌍 **Multi-language Support** - English, French, German, and Spanish
- 👥 **User Authentication** - Register and contribute to your country's playlist
- 📊 **Real-time Statistics** - Track total countries, tracks, and community entries
- 🔐 **Role-based Access** - Users can only add songs to their own country (admins have full access)

## 🚀 Tech Stack

- **Framework**: Next.js 14.2.5
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Styling**: CSS (globals.css)

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PLAYLISTS
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
```

4. Initialize the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. (Optional) Parse playlist files:
```bash
npm run parse-playlists
```

## 🏃 Running the Application

### Development mode:
```bash
npm run dev
```

### Production build:
```bash
npm run build
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page component
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── countries.ts      # African countries data
│   ├── countryPlaylists.ts # Pre-loaded playlists
│   ├── i18n.ts           # Internationalization
│   ├── loadEnv.ts        # Environment loader
│   └── prisma.ts         # Prisma client
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── dev.db            # SQLite database
├── public/
│   ├── files-playlist/   # PDF playlist files
│   └── favicon.svg       # App icon
└── scripts/
    └── parse-playlists.mjs # Playlist parser script
```

## 🗄️ Database Schema

### User
- `id`: Auto-increment ID
- `username`: Unique username
- `password`: Hashed password
- `country`: User's country
- `createdAt`: Registration timestamp

### Entry
- `id`: Auto-increment ID
- `artist`: Artist name
- `song`: Song title
- `releaseYear`: Year of release
- `status`: Entry status
- `decade`: Decade classification
- `yearsSinceRelease`: Calculated years
- `country`: Country code
- `userId`: Foreign key to User

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Countries & Entries
- `GET /api/countries` - Get all countries with entries
- `POST /api/countries/:slug/entries` - Add new entry to country

## 🎨 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run parse-playlists` - Parse PDF playlists

## 🌍 Supported Languages

- 🇬🇧 English (en)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇪🇸 Spanish (es)

## 🤝 Contributing

1. Register an account on the platform
2. Select your country during registration
3. Add your favorite African artists and songs
4. Only add songs from your own country (unless you're an admin)

## 📝 License

Private project

## 👨‍💻 Author

Built with ❤️ for African music lovers
