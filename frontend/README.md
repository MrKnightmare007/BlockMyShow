# ProofPass Frontend

React-based frontend for the ProofPass NFT ticketing platform built with Vite.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── AddEvent.jsx
│   ├── Admin.jsx
│   ├── BuyTicket.jsx
│   ├── CreateEvent.jsx
│   ├── EditEvent.jsx
│   ├── EventCard.jsx
│   ├── EventDetails.jsx
│   ├── Events.jsx
│   ├── Footer.jsx
│   ├── Header.jsx
│   ├── Home.jsx
│   ├── MyTickets.jsx
│   ├── Navbar.jsx
│   ├── Navigation.jsx
│   ├── TicketDetails.jsx
│   ├── TicketVerification.jsx
│   └── TicketView.jsx
├── pages/               # Page components
│   ├── AdminPage.jsx
│   ├── EventDetailsPage.jsx
│   ├── HomePage.jsx
│   └── MyTicketsPage.jsx
├── contexts/            # React contexts
│   └── ThemeContext.jsx
├── contracts/           # Smart contract ABI
│   └── TicketABI.json
├── styles/              # CSS styles
│   ├── animations.css
│   ├── bookMyShowStyles.css
│   └── darkMode.css
├── config.js            # Configuration
└── App.jsx              # Main app component
```

## Features

- Event browsing and booking
- Ticket purchase with Razorpay
- Identity-based ticket verification
- Organizer dashboard
- Gate verification interface
- Dark mode support
- Responsive design

## Configuration

Update `src/config.js` with your:
- Smart contract address
- Backend API URL
- Web3 provider settings
