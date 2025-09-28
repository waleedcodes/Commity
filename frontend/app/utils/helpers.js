// Format numbers with appropriate suffixes (K, M, B)
export const formatNumber = (num) => {
  if (num === 0) return '0';
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
};

// Format dates
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  return date.toLocaleDateString('en-US', defaultOptions);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Generate random color for charts
export const generateColor = (index) => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
  ];
  return colors[index % colors.length];
};

// Validate GitHub username
export const isValidGitHubUsername = (username) => {
  const regex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  return regex.test(username);
};

// Format GitHub URL
export const formatGitHubUrl = (username) => {
  return `https://github.com/${username}`;
};

// Format repository URL
export const formatRepoUrl = (owner, repo) => {
  return `https://github.com/${owner}/${repo}`;
};

// Get avatar URL with fallback
export const getAvatarUrl = (avatarUrl, username, size = 40) => {
  if (avatarUrl) return `${avatarUrl}&s=${size}`;
  return `https://github.com/${username}.png?size=${size}`;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Sort array of objects by key
export const sortBy = (array, key, order = 'asc') => {
  return array.sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (order === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
};

// Group array by key
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

// Calculate growth rate
export const calculateGrowthRate = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// Format percentage with sign
export const formatPercentage = (value, showSign = true) => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value}%`;
};

// Get programming language color
export const getLanguageColor = (language) => {
  const languageColors = {
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
    Swift: '#fa7343',
    Kotlin: '#F18E33',
    Dart: '#00B4AB',
    HTML: '#e34c26',
    CSS: '#1572B6',
    Shell: '#89e051',
    Vue: '#4FC08D',
    React: '#61DAFB',
  };
  return languageColors[language] || '#6B7280';
};
