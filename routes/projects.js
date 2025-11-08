const express = require('express');
const router = express.Router();
const axios = require('axios');

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Color palette for project cards
const colors = [
  '667eea,764ba2', // Purple gradient
  '00d4ff,00a8cc', // Cyan gradient
  'f093fb,f5576c', // Pink gradient
  '4facfe,00f2fe', // Blue gradient
  '43e97b,38f9d7', // Green gradient
];

function getProjectImage(repoName, index) {
  const colorPair = colors[index % colors.length];
  // Using a gradient placeholder service
  return `https://via.placeholder.com/400x200/${colorPair}/ffffff?text=${encodeURIComponent(repoName)}`;
}

router.get('/', async (req, res) => {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    const response = await axios.get(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos`,
      {
        params: {
          sort: 'updated',
          per_page: 100,
          type: 'owner'
        },
        headers
      }
    );

    const projects = response.data
      .filter(repo => !repo.fork && !repo.private)
      .map((repo, index) => ({
        id: repo.id,
        title: formatRepoName(repo.name),
        description: repo.description || 'No description available',
        technologies: extractTechnologies(repo),
        image: getProjectImage(repo.name, index), // Custom placeholder
        githubLink: repo.html_url,
        liveLink: repo.homepage || null,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        updatedAt: repo.updated_at,
        createdAt: repo.created_at,
        topics: repo.topics || []
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json(projects);
  } catch (error) {
    console.error('Error fetching GitHub repos:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch projects from GitHub',
      error: error.message 
    });
  }
});

// Helper functions remain the same
function formatRepoName(name) {
  return name
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractTechnologies(repo) {
  const techs = [];
  
  if (repo.language) {
    techs.push(repo.language);
  }
  
  if (repo.topics && repo.topics.length > 0) {
    techs.push(...repo.topics.slice(0, 5));
  }
  
  return [...new Set(techs)];
}

module.exports = router;
