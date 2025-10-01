# Fishing Competition Management System

A comprehensive web application for managing fishing competitions with real-time scoring, participant management, and results tracking.

## Features

- **Competition Management**: Create competitions with customizable sectors and participant limits
- **Participant Management**: Register participants and assign them to sectors
- **Weigh-In System**: Record catches with timestamps and notes
- **Scoring System**: Automatic sector-based scoring with overall rankings
- **Results Display**: Real-time results with sector and overall rankings
- **Responsive Design**: Modern UI that works on desktop and mobile devices

## Technology Stack

- **Frontend**: Angular 17+ with Angular Material
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Real-time**: Socket.IO (ready for implementation)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

### 1. Install dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE fishing_competition;
```

2. Update the database configuration in `env.example` and rename it to `.env`:
```bash
cp env.example .env
```

3. Edit `.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fishing_competition
DB_USER=your_username
DB_PASSWORD=your_password
```

4. Run the database schema:
```bash
psql -U your_username -d fishing_competition -f database/schema.sql
```

### 3. Start the application

#### Development Mode
```bash
# Start backend server
npm run server

# In another terminal, start frontend
npm run client
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

The application will be available at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

## Usage

### 1. Create a Competition
- Navigate to "New Competition"
- Fill in competition details (name, date, description)
- Set number of sectors and participants per sector
- The system automatically creates sectors (A, B, C, etc.)

### 2. Manage Participants
- Go to the competition details page
- Click "Manage Participants"
- Add participants and assign them to sectors
- Move participants between sectors if needed

### 3. Record Weigh-Ins
- Navigate to "Weigh In" from the competition details
- Select a participant
- Enter the weight in grams
- Add optional notes
- Multiple weigh-ins per participant are supported

### 4. View Results
- Go to "View Results" to see rankings
- **Overall Results**: Final rankings based on sector performance
- **Sector Results**: Individual sector rankings
- Results update automatically as weigh-ins are recorded

## Scoring System

The scoring system works as follows:

1. **Sector Scoring**: Within each sector, participants are ranked by total weight
2. **Points Assignment**: 1st place = 1 point, 2nd place = 2 points, etc.
3. **Overall Ranking**: Participants are ranked by their sector points (lower is better)
4. **Tie Breaking**: In case of equal points, total weight determines the winner

## API Endpoints

### Competitions
- `GET /api/competitions` - List all competitions
- `GET /api/competitions/:id` - Get competition details
- `POST /api/competitions` - Create new competition
- `PUT /api/competitions/:id` - Update competition
- `DELETE /api/competitions/:id` - Delete competition

### Participants
- `GET /api/participants/competition/:id` - Get participants for competition
- `POST /api/participants` - Add participant
- `PUT /api/participants/:id` - Update participant
- `DELETE /api/participants/:id` - Remove participant

### Weigh-Ins
- `GET /api/weigh-ins/competition/:id` - Get weigh-ins for competition
- `POST /api/weigh-ins` - Record weigh-in
- `PUT /api/weigh-ins/:id` - Update weigh-in
- `DELETE /api/weigh-ins/:id` - Delete weigh-in

### Results
- `GET /api/results/competition/:id/sectors` - Get sector results
- `GET /api/results/competition/:id/overall` - Get overall results
- `GET /api/results/competition/:id/summary` - Get competition summary

## Database Schema

The system uses the following main tables:
- `competitions` - Competition information
- `sectors` - Competition sectors
- `participants` - Registered participants
- `weigh_ins` - Individual weigh-in records

## Development

### Project Structure
```
fishing-competition/
├── client/                 # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # Angular components
│   │   │   ├── services/   # API services
│   │   │   └── models/     # TypeScript interfaces
│   │   └── ...
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   └── index.js           # Main server file
├── database/              # Database schema
└── package.json           # Root package.json
```

### Adding New Features

1. **Backend**: Add new routes in `server/routes/`
2. **Frontend**: Create components in `client/src/app/components/`
3. **Services**: Add API calls in `client/src/app/services/`
4. **Models**: Define TypeScript interfaces in `client/src/app/models/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
