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
