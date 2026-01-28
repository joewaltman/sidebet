# Side Bet - Sports Betting with Friends

A peer-to-peer betting application for creating and accepting bets on NFL and NBA games with friends. Built with Next.js 14+, TypeScript, SQLite, and Tailwind CSS.

## Features

- **Phone-based authentication** using localStorage (no passwords required)
- **ESPN API integration** for live NFL and NBA game data including:
  - Game schedules and matchups
  - Real-time point spreads from ESPN's betting partners (Caesars, William Hill, etc.)
  - Live scores and game status
- **Point spread betting** with automatic winner determination
- **Multi-acceptor support** - unlimited friends can accept each bet
- **Privacy-focused** - acceptors don't see other acceptances
- **Automated results** from ESPN API with spread calculations
- **IOU tracking** - clear display of who owes whom after settlement
- **Shareable bet links** for easy sharing with friends
- **My Bets page** - view all bets you've created and accepted, with win/loss status

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS
- **Phone Validation**: libphonenumber-js
- **APIs**: ESPN Public API (includes betting odds from Caesars, William Hill, etc.)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- **No API keys required!** ESPN's unofficial API provides everything needed

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set up environment variables for The Odds API fallback:
   - Edit `.env.local` if you want to use The Odds API as a backup:
     ```
     ODDS_API_KEY=your_api_key_here
     ```
   - This is optional - ESPN provides spreads directly from their betting partners

3. Initialize the database:
   ```bash
   node db/init.js
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## Project Structure

```
side-bet/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Home page with game list
│   │   ├── create/page.tsx     # Create bet page
│   │   ├── bet/[id]/page.tsx   # Shareable bet page
│   │   ├── my-bets/page.tsx    # My Bets page
│   │   └── api/                # API routes
│   │       ├── games/          # GET games from ESPN + spreads
│   │       ├── bets/           # Bet CRUD operations
│   │       ├── my-bets/        # GET user's bets
│   │       └── session/        # Session validation
│   ├── components/             # React components
│   │   ├── GameList.tsx        # Game browsing
│   │   ├── GameCard.tsx        # Individual game
│   │   ├── BetForm.tsx         # Create bet form
│   │   ├── BetDetails.tsx      # Bet information
│   │   ├── AcceptBetForm.tsx   # Accept bet form
│   │   ├── BetStatus.tsx       # Settlement results
│   │   ├── MyBetCard.tsx       # Bet list item
│   │   └── PhoneNumberInput.tsx # Auth form
│   ├── lib/                    # Core utilities
│   │   ├── db.ts               # Database queries
│   │   ├── phone.ts            # Phone normalization
│   │   ├── espn.ts             # ESPN API client
│   │   ├── odds.ts             # The Odds API client
│   │   └── session.ts          # Session management
│   ├── types/                  # TypeScript types
│   └── context/                # React context (UserContext)
├── db/
│   ├── schema.sql              # Database schema
│   ├── init.js                 # DB initialization script
│   └── dev.db                  # SQLite database file
└── README.md
```

## How It Works

### 1. Create a Bet

1. Visit the home page and enter your phone number + name (stored in localStorage)
2. Browse upcoming NFL and NBA games with real-time spreads
3. Click "Bet on this game"
4. Select your team - the point spread is automatically populated from ESPN's betting partners
   - **Official spreads are locked** (cannot be edited) to ensure fair betting
   - If no official spread is available, you can enter your own
5. Set the max bet amount per person
6. Submit to create a shareable link

### 2. Accept a Bet

1. Friend receives your shareable link
2. They view bet details (game, team, spread, max amount)
3. Enter their phone number + name
4. Choose how much to bet (up to the max)
5. Submit to accept the bet
6. Bet is automatically on the opposite side with opposite spread

### 3. Automated Settlement

- After the game completes, the ESPN API is checked for final scores
- Point spread is applied to determine the winner:
  - **Negative spread (favorite)**: Team must win by MORE than the spread
  - **Positive spread (underdog)**: Team can lose by LESS than the spread
- Bet is automatically settled with winner/loser determined
- IOUs are calculated and displayed

### 4. View My Bets

1. Click "My Bets" link in the header (when signed in)
2. View two tabs:
   - **Bets I Created**: All bets you've created with friends
   - **Bets I Accepted**: All bets you've accepted from others
3. Each bet shows:
   - Game name and date/time
   - Your pick and point spread
   - Amount wagered
   - Status (Open, In Progress, or Settled)
   - For settled bets: final score and whether you won or lost
4. Click any bet card to view full details

## Point Spread Examples

### Example 1: Favorite Covers
- Bet: Lakers -7.5 (Lakers must win by more than 7.5 points)
- Final Score: Lakers 110, Warriors 102
- Point differential: 8
- Result: Lakers covered the spread ✓ (won by 8, needed 7.5+)

### Example 2: Favorite Doesn't Cover
- Bet: Lakers -7.5
- Final Score: Lakers 108, Warriors 103
- Point differential: 5
- Result: Lakers didn't cover the spread ✗ (won by 5, needed 7.5+)

### Example 3: Underdog Covers
- Bet: Warriors +7.5 (Warriors can lose by up to 7.5 points)
- Final Score: Lakers 108, Warriors 103
- Point differential: -5 (Warriors lost by 5)
- Result: Warriors covered the spread ✓ (lost by 5, could lose by 7.5)

## Point Spread Data Sources

### ESPN API (Primary)
ESPN's unofficial API includes betting odds from their partners (Caesars, William Hill, etc.):
- **Advantages**:
  - No API key required
  - Automatically matched to games
  - Single API call for games + spreads
  - Updated in real-time
- **Source**: `https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard`
- **Note**: This is an unofficial, reverse-engineered API and may change without notice

### The Odds API (Optional Fallback)
If you want additional coverage or backup spreads:
- **Setup**: Get a free API key from https://the-odds-api.com (500 requests/month)
- **Add to `.env.local`**: `ODDS_API_KEY=your_key_here`
- **Behavior**: Will only be used as fallback if ESPN doesn't provide spreads for a game

## Testing

The application is currently running at http://localhost:3001

### Manual Testing Checklist

- [ ] Phone number normalization works with various formats
- [ ] localStorage persists phone and name across page reloads
- [ ] Can't accept same bet twice with same phone
- [ ] Can't accept bet for more than max amount
- [ ] Copy-to-clipboard works for shareable links
- [ ] ESPN API successfully fetches upcoming NFL and NBA games
- [ ] Point spread display works correctly
- [ ] Bet creation flow completes successfully
- [ ] Shareable link works in different browser/incognito
- [ ] Bet acceptance validates correctly
- [ ] UI displays bet details clearly

## Deployment

### Railway / Fly.io

1. Push code to GitHub
2. Create new project on Railway/Fly.io
3. Configure environment variables:
   - `NODE_ENV=production`
   - `DATABASE_PATH=/app/db/prod.db`
   - `ODDS_API_KEY=your_api_key`
4. Set up persistent volume for `/app/db`
5. Deploy

### Background Job for Auto-Settlement

Set up a cron job to check for completed games every 15 minutes:
```bash
curl -X POST http://your-domain.com/api/bets/[id]/settle
```

## Future Enhancements

- [ ] User profiles and bet history
- [ ] Push notifications for acceptances/results
- [ ] Bet expiration/time limits
- [ ] Friend lists
- [ ] More sports and bet types (over/under, moneyline)
- [ ] Email/SMS notifications
- [ ] Mobile app
- [ ] Real money integration

## License

MIT

---

**Note**: This is a fun project for friendly betting. No real money is exchanged. Please gamble responsibly.
