// [Commity Core Phase 1: Setup] githubService.js
const { createGitHubClient, createGraphQLClient, GITHUB_CONFIG } = require('../config/github');
const logger = require('../utils/logger');
const CacheManager = require('../utils/cache');
const Helpers = require('../utils/helpers');
const { CACHE_KEYS, TIME } = require('../config/constants');
const { ErrorFactory } = require('../middleware/errorHandler');

class GitHubService {
  constructor() {
    this.octokit = createGitHubClient();
    this.graphql = createGraphQLClient();
  }

  /**
   * Get user profile information from GitHub
   * @param {string} username - GitHub username
   * @returns {Promise<object>} User profile data
   */
  async getUserProfile(username) {
    const cacheKey = CacheManager.generateKey('user_profile', username);
    
    return await CacheManager.getOrSet(
      CACHE_KEYS.USER_PROFILE,
      cacheKey,
      async () => {
        try {
          logger.info(`Fetching GitHub profile for: ${username}`);
          const { data } = await this.octokit.rest.users.getByUsername({
            username,
          });

          const profile = {
            githubId: data.id,
            username: data.login,
            name: data.name,
            email: data.email,
            bio: data.bio,
            avatarUrl: data.avatar_url,
            htmlUrl: data.html_url,
            company: data.company,
            location: data.location,
            blog: data.blog,
            twitterUsername: data.twitter_username,
            publicRepos: data.public_repos,
            publicGists: data.public_gists,
            followers: data.followers,
            following: data.following,
            githubCreatedAt: new Date(data.created_at),
            githubUpdatedAt: new Date(data.updated_at),
          };

          logger.info(`Successfully fetched profile for: ${username}`);
          return profile;
        } catch (error) {
          if (error.status === 404) {
            throw ErrorFactory.notFound(`GitHub user '${username}' not found`);
          }
          throw ErrorFactory.githubAPI(`Failed to fetch user profile: ${error.message}`, error.status);
        }
      },
      5 * 60 // 5 minutes cache
    );
  }

  /**
   * Get user's repositories
   * @param {string} username - GitHub username
   * @param {object} options - Query options
   * @returns {Promise<Array>} Array of repositories
   */
  async getUserRepositories(username, options = {}) {
    const cacheKey = CacheManager.generateKey('user_repos', username, JSON.stringify(options));
    
    return await CacheManager.getOrSet(
      CACHE_KEYS.USER_REPOS,
      cacheKey,
      async () => {
        try {
          logger.info(`Fetching repositories for: ${username}`);
          
          const params = {
            username,
            type: options.type || 'owner', // owner, all, member
            sort: options.sort || 'updated',
            direction: options.direction || 'desc',
            per_page: options.per_page || 100,
            page: options.page || 1,
          };

          const { data } = await this.octokit.rest.repos.listForUser(params);

          const repositories = data.map(repo => ({
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            private: repo.private,
            fork: repo.fork,
            homepage: repo.homepage,
            language: repo.language,
            stargazersCount: repo.stargazers_count,
            forksCount: repo.forks_count,
            watchersCount: repo.watchers_count,
            size: repo.size,
            defaultBranch: repo.default_branch,
            openIssuesCount: repo.open_issues_count,
            topics: repo.topics || [],
            hasIssues: repo.has_issues,
            hasProjects: repo.has_projects,
            hasWiki: repo.has_wiki,
            hasPages: repo.has_pages,
            hasDownloads: repo.has_downloads,
            archived: repo.archived,
            disabled: repo.disabled,
            pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
            createdAt: new Date(repo.created_at),
            updatedAt: new Date(repo.updated_at),
            htmlUrl: repo.html_url,
          }));

          logger.info(`Successfully fetched ${repositories.length} repositories for: ${username}`);
          return repositories;
        } catch (error) {
          if (error.status === 404) {
            throw ErrorFactory.notFound(`GitHub user '${username}' not found`);
          }
          throw ErrorFactory.githubAPI(`Failed to fetch repositories: ${error.message}`, error.status);
        }
      },
      10 * 60 // 10 minutes cache
    );
  }

  /**
   * Get user's public events (activity)
   * @param {string} username - GitHub username
   * @param {object} options - Query options
   * @returns {Promise<Array>} Array of events
   */
  async getUserEvents(username, options = {}) {
    const cacheKey = CacheManager.generateKey('user_events', username, JSON.stringify(options));
    
    return await CacheManager.getOrSet(
      CACHE_KEYS.USER_EVENTS,
      cacheKey,
      async () => {
        try {
          logger.info(`Fetching events for: ${username}`);
          
          const params = {
            username,
            per_page: options.per_page || 100,
            page: options.page || 1,
          };

          const { data } = await this.octokit.rest.activity.listPublicEventsForUser(params);

          const events = data.map(event => ({
            id: event.id,
            type: event.type,
            actor: {
              id: event.actor.id,
              login: event.actor.login,
              avatarUrl: event.actor.avatar_url,
            },
            repo: {
              id: event.repo.id,
              name: event.repo.name,
              url: event.repo.url,
            },
            payload: this._processEventPayload(event.type, event.payload),
            public: event.public,
            createdAt: new Date(event.created_at),
          }));

          logger.info(`Successfully fetched ${events.length} events for: ${username}`);
          return events;
        } catch (error) {
          if (error.status === 404) {
            throw ErrorFactory.notFound(`GitHub user '${username}' not found`);
          }
          throw ErrorFactory.githubAPI(`Failed to fetch events: ${error.message}`, error.status);
        }
      },
      2 * 60 // 2 minutes cache (events are more dynamic)
    );
  }

  /**
   * Get user's contribution activity using GraphQL
   * @param {string} username - GitHub username
   * @returns {Promise<object>} Contribution data
   */
  async getUserContributions(username) {
    const cacheKey = CacheManager.generateKey('user_contributions', username);
    
    return await CacheManager.getOrSet(
      CACHE_KEYS.USER_PROFILE,
      cacheKey,
      async () => {
        try {
          logger.info(`Fetching contributions for: ${username}`);
          
          const query = `
            query userContributionCalendar($username: String!) {
              user(login: $username) {
                contributionsCollection {
                  restrictedContributionsCount
                  contributionCalendar {
                    totalContributions
                    weeks {
                      contributionDays {
                        contributionCount
                        date
                        contributionLevel
                      }
                    }
                  }
                  totalCommitContributions
                  totalIssueContributions
                  totalPullRequestContributions
                  totalPullRequestReviewContributions
                  totalRepositoryContributions
                }
                repositories(first: 100, orderBy: {field: STARGAZERS, direction: DESC}) {
                  nodes {
                    name
                    stargazerCount
                    primaryLanguage {
                      name
                      color
                    }
                  }
                }
              }
            }
          `;

          const { user } = await this.graphql(query, { username });

          if (!user) {
            throw ErrorFactory.notFound(`GitHub user '${username}' not found`);
          }

          const publicContribs = user.contributionsCollection.contributionCalendar?.totalContributions || 0;
          const privateContribs = user.contributionsCollection.restrictedContributionsCount || 0;

            const calendarDays = user.contributionsCollection.contributionCalendar.weeks
              .flatMap(week => week.contributionDays)
              .map(day => ({
                date: new Date(day.date),
                contributionCount: day.contributionCount,
                contributionLevel: day.contributionLevel,
              }));

            // Calculate exact longest and current streaks from verified calendar
            let longestStreak = 0;
            let running = 0;
            for (let i = 0; i < calendarDays.length; i++) {
              if (calendarDays[i].contributionCount > 0) {
                running++;
                if (running > longestStreak) longestStreak = running;
              } else {
                running = 0;
              }
            }

            let currentStreak = 0;
            const lastIdx = calendarDays.length - 1;
            if (lastIdx >= 0) {
              let startIdx = lastIdx;
              if (calendarDays[lastIdx].contributionCount === 0 && lastIdx > 0 && calendarDays[lastIdx - 1].contributionCount > 0) {
                startIdx = lastIdx - 1;
              }
              for (let i = startIdx; i >= 0; i--) {
                if (calendarDays[i].contributionCount > 0) {
                  currentStreak++;
                } else {
                  break;
                }
              }
            }

            const contributionsData = {
              totalContributions: publicContribs + privateContribs,
              publicContributions: publicContribs,
              privateContributions: privateContribs,
              totalCommits: user.contributionsCollection.totalCommitContributions || 0,
              totalIssues: user.contributionsCollection.totalIssueContributions || 0,
              totalPullRequests: user.contributionsCollection.totalPullRequestContributions || 0,
              totalReviews: user.contributionsCollection.totalPullRequestReviewContributions || 0,
              totalRepositories: user.contributionsCollection.totalRepositoryContributions || 0,
              contributionStreak: currentStreak,
              longestStreak: longestStreak,
              contributionCalendar: calendarDays,
              topRepositories: user.repositories.nodes.map(repo => ({
                name: repo.name,
                stars: repo.stargazerCount,
                language: repo.primaryLanguage?.name || null,
                languageColor: repo.primaryLanguage?.color || null,
              })),
            };

          logger.info(`Successfully fetched contributions for: ${username}`);
          return contributionsData;
        } catch (error) {
          if (error.message && error.message.includes('Could not resolve to a User')) {
            throw ErrorFactory.notFound(`GitHub user '${username}' not found`);
          }
          logger.warn(`GraphQL contributions fetch failed for ${username}, falling back to defaults: ${error.message}`);
          return {
            totalContributions: 0,
            totalCommits: 0,
            totalIssues: 0,
            totalPullRequests: 0,
            totalReviews: 0,
            totalRepositories: 0,
            contributionCalendar: [],
            topRepositories: [],
          };
        }
      },
      10 * 60 // 10 minutes cache
    );
  }

  /**
   * Get user's language statistics
   * @param {string} username - GitHub username
   * @returns {Promise<Array>} Language statistics
   */
  async getUserLanguages(username) {
    const cacheKey = CacheManager.generateKey('user_languages', username);
    
    return await CacheManager.getOrSet(
      CACHE_KEYS.USER_PROFILE,
      cacheKey,
      async () => {
        try {
          logger.info(`Fetching language statistics for: ${username}`);
          
          const repositories = await this.getUserRepositories(username, { type: 'owner' });
          const languageStats = {};
          let totalBytes = 0;

          // Fetch top 12 repositories concurrently to optimize speed and stay within rate limits
          const topRepos = (repositories || []).slice(0, 12);
          const langResults = await Promise.all(
            topRepos.map(repo => 
              this.octokit.rest.repos.listLanguages({
                owner: username,
                repo: repo.name,
              }).then(res => res.data).catch(() => ({}))
            )
          );

          for (const languages of langResults) {
            Object.entries(languages).forEach(([language, bytes]) => {
              languageStats[language] = (languageStats[language] || 0) + bytes;
              totalBytes += bytes;
            });
          }

          // Convert to percentage-based statistics
          const languageArray = Object.entries(languageStats)
            .map(([name, bytes]) => ({
              name,
              bytes,
              percentage: Helpers.calculatePercentage(bytes, totalBytes),
              color: this._getLanguageColor(name),
            }))
            .sort((a, b) => b.bytes - a.bytes);

          logger.info(`Successfully calculated language statistics for: ${username}`);
          return languageArray;
        } catch (error) {
          throw ErrorFactory.githubAPI(`Failed to fetch language statistics: ${error.message}`);
        }
      },
      30 * 60 // 30 minutes cache
    );
  }

  /**
   * Search users on GitHub
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<object>} Search results
   */
  async searchUsers(query, options = {}) {
    try {
      logger.info(`Searching GitHub users: ${query}`);
      
      const params = {
        q: query,
        sort: options.sort || 'followers',
        order: options.order || 'desc',
        per_page: options.per_page || 30,
        page: options.page || 1,
      };

      const { data } = await this.octokit.rest.search.users(params);

      const results = {
        totalCount: data.total_count,
        incompleteResults: data.incomplete_results,
        users: data.items.map(user => ({
          githubId: user.id,
          username: user.login,
          avatarUrl: user.avatar_url,
          htmlUrl: user.html_url,
          type: user.type,
          score: user.score,
        })),
      };

      logger.info(`Found ${results.totalCount} users for query: ${query}`);
      return results;
    } catch (error) {
      throw ErrorFactory.githubAPI(`Search failed: ${error.message}`, error.status);
    }
  }

  /**
   * Get GitHub rate limit status
   * @returns {Promise<object>} Rate limit information
   */
  async getRateLimit() {
    const cacheKey = 'github_rate_limit';
    
    return await CacheManager.getOrSet(
      CACHE_KEYS.RATE_LIMIT,
      cacheKey,
      async () => {
        try {
          const { data } = await this.octokit.rest.rateLimit.get();
          return data.rate;
        } catch (error) {
          throw ErrorFactory.githubAPI(`Failed to get rate limit: ${error.message}`);
        }
      },
      60 // 1 minute cache
    );
  }

  /**
   * Process event payload based on event type
   * @private
   */
  _processEventPayload(eventType, payload) {
    switch (eventType) {
      case 'PushEvent':
        return {
          ref: payload.ref,
          size: payload.size,
          commits: payload.commits?.length || 0,
        };
      case 'PullRequestEvent':
        return {
          action: payload.action,
          number: payload.number,
          title: payload.pull_request?.title,
        };
      case 'IssuesEvent':
        return {
          action: payload.action,
          number: payload.issue?.number,
          title: payload.issue?.title,
        };
      case 'CreateEvent':
        return {
          refType: payload.ref_type,
          ref: payload.ref,
        };
      case 'ForkEvent':
        return {
          forkee: payload.forkee?.full_name,
        };
      default:
        return payload;
    }
  }

  /**
   * Get language color (simplified mapping)
   * @private
   */
  _getLanguageColor(language) {
    const colors = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      C: '#555555',
      'C#': '#239120',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      Rust: '#dea584',
      Swift: '#ffac45',
      Kotlin: '#F18E33',
      Scala: '#c22d40',
      R: '#198CE7',
      MATLAB: '#e16737',
      Shell: '#89e051',
      HTML: '#e34c26',
      CSS: '#1572B6',
      Vue: '#2c3e50',
      React: '#61dafb',
    };
    
    return colors[language] || Helpers.generateColorFromString(language);
  }
}

module.exports = GitHubService;
