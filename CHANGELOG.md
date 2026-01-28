# Changelog

## Recent Updates

### Team Logos Added (2026-01-28)

**Visual Enhancement:**
- ✅ Team logos now display next to team names throughout the app
- ✅ Logos shown in game cards on home page
- ✅ Logos shown in team selection when creating bets
- ✅ Automatically sourced from ESPN's CDN
- ✅ High-quality team branding for better user experience

**Implementation:**
- Logos extracted from ESPN API response
- Next.js Image component for optimized loading
- Configured ESPN CDN as trusted image source

### Spreads Are Now Read-Only (2026-01-28)

**Security/Fairness Enhancement:**
- Point spreads from ESPN's betting partners are now **locked and cannot be edited**
- Shows "Official Spread" badge when spread comes from ESPN
- Prevents users from creating unfair bets with arbitrary spreads
- Manual entry only allowed when no official spread is available

**User Experience:**
- ✅ Select your team and the spread auto-populates
- ✅ Clear indicator showing spread is from official source
- ✅ Helpful message explaining spread cannot be modified
- ✅ If no official spread: can enter your own

### Point Spreads Now from ESPN API (2026-01-28)

**What Changed:**
- Point spreads now come directly from ESPN's API (from betting partners like DraftKings, Caesars, William Hill)
- The Odds API is now **optional** - only used as fallback if ESPN doesn't have spreads
- **No API key required** for basic functionality

**Benefits:**
- ✅ No setup required - works immediately after `npm install`
- ✅ Spreads automatically matched to games
- ✅ Single API call (faster, simpler)
- ✅ Real-time odds from ESPN's betting partners
- ✅ More reliable than matching between two APIs

**Technical Details:**
- Updated `src/lib/espn.ts` to extract `odds` array from ESPN response
- ESPN provides spread value and indicates which team is favored
- Prefers Caesars (ID: 38) or consensus odds, falls back to first available provider
- Updated `src/app/api/games/route.ts` to use ESPN spreads primarily

**The Odds API (Optional):**
- Still supported as fallback for games without ESPN spreads
- Add `ODDS_API_KEY` to `.env.local` if you want this fallback
- Will only be called if API key is configured

### My Bets Feature (2026-01-28)

**New Feature:**
- Added "My Bets" page accessible from header navigation
- View all bets you've created and accepted
- Two tabs: "Bets I Created" and "Bets I Accepted"
- Shows win/loss status for settled bets
- Click any bet to view full details

**New Files:**
- `src/app/my-bets/page.tsx` - My Bets page
- `src/app/api/my-bets/route.ts` - API endpoint
- `src/components/MyBetCard.tsx` - Bet card component

**Database Queries Added:**
- `getBetsCreatedByUser()` - Fetch user's created bets
- `getBetsAcceptedByUser()` - Fetch user's accepted bets

## Testing

Run the development server:
```bash
npm run dev
```

Visit http://localhost:3001 to test:
1. Browse games with spreads from ESPN
2. Create a bet (spreads auto-populate)
3. Click "My Bets" to view your bets
4. Open bet link in incognito to accept as different user

## Migration Notes

If you previously set up The Odds API key:
- It will still work as a fallback
- You can remove it from `.env.local` if you want to rely solely on ESPN
- No other changes needed

## Known Limitations

- ESPN's API is unofficial and may change without notice
- Not all games may have spreads available (depends on ESPN's betting partners)
- The Odds API fallback helps cover gaps but requires API key setup
