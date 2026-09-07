# Architectural Overhaul: Authentic GitHub GraphQL Ranking Engine & Dynamic Platform

## 1. Problem & Architecture Review
Commity previously relied on scraping `committers.top` HTML pages via regular expressions and invented fake statistics:
```javascript
// Previous fake estimates:
totalCommits: Math.round(item.contributions * 0.8)
totalPullRequests: Math.round(item.contributions * 0.15)
totalIssues: Math.round(item.contributions * 0.05)
```
In addition, hardcoded constants (`160760`, `69`) and hardcoded demo developers (`POPULAR_DEVELOPERS`, `topThree` fallback state) were embedded in both backend services and the frontend homepage.

### The New Architecture
Rather than scraping someone else's HTML or guessing commit counts with multipliers, Commity will implement the **authentic committers.top engineering architecture** directly against the GitHub API:
1. **Candidate Discovery**: Query GitHub API for individual developers in a region (`location:"${region}" type:user`), ordered by `followers` (because GitHub's Search API does not support sorting users by contribution count).
2. **GraphQL Field Retrieval**: Query GitHub GraphQL for the authentic, verified fields:
   - `contributionCalendar.totalContributions`
   - `restrictedContributionsCount`
   - `totalCommitContributions`
   - `totalPullRequestContributions`
   - `totalIssueContributions`
   - `totalPullRequestReviewContributions`
   - `followers`
3. **Regional Ranking & Snapshots**: Sort candidates by real `totalContributions` (`public + restricted`), assign regional ranks (Top 256), and save both individual verified `User` records and an immutable `RankingSnapshot` in MongoDB.
4. **Data-Driven Dynamic Frontend**: Replace static/hardcoded developer lists and hero counts in `frontend/app/page.js` with live data from new backend endpoints (`/api/platform/stats`, `/api/regions`, `/api/leaderboard/featured`).
5. **Methodological Transparency**: Disclose the candidate discovery process openly in the UI (followers discovery candidate pool -> contribution ranking).

```mermaid
graph TD
    A[SyncWorker / Cron / API] --> B[GitHubRankingService]
    B -->|Step 1: Search Candidates| C[GitHub Search API: location:Region type:user sort:followers]
    C -->|Step 2: Fetch Verified Metrics| D[GitHub GraphQL: calendar + commits + PRs + issues + reviews]
    D -->|Step 3: Authentic Sort| E[Sort Candidates by verified totalContributions]
    E -->|Step 4: Rank Top 256| F[Assign Regional Rank #1..256]
    F -->|Step 5: Persist| G[(MongoDB: User + RankingSnapshot)]
    G --> H[Commity API Endpoints]
    H -->|/api/platform/stats| I[Frontend Hero Statistics]
    H -->|/api/regions| J[Frontend Country Explorer]
    H -->|/api/leaderboard/featured| K[Frontend Featured Developers]
