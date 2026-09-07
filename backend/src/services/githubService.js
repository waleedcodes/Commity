// [Commity Core Phase 2: Logic] githubService.js
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
            type: data.type || 'User',
            accountType: data.type || 'User',
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
            logger.info(`GitHub login '${username}' is not a User account (likely an Organization). Returning zeroed contribution metrics.`);
            return {
              totalContributions: 0,
              publicContributions: 0,
              privateContributions: 0,
              totalCommits: 0,
              totalIssues: 0,
              totalPullRequests: 0,
              totalReviews: 0,
              totalRepositories: 0,
              contributionStreak: 0,
              longestStreak: 0,
              contributionCalendar: [],
              topRepositories: [],
            };
          }
          logger.warn(`GraphQL contributions fetch failed for ${username}, falling back to defaults: ${error.message}`);
          return {
            totalContributions: 0,
            publicContributions: 0,
            privateContributions: 0,
            totalCommits: 0,
            totalIssues: 0,
            totalPullRequests: 0,
            totalReviews: 0,
            totalRepositories: 0,
            contributionStreak: 0,
            longestStreak: 0,
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
