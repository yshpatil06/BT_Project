const express = require('express');
const router = express.Router();
const https = require('https');

// Validate package exists on npm registry
const checkNpmPackage = (packageName) => {
  return new Promise((resolve, reject) => {
    const name = packageName.split('@')[0];
    const req = https.get(`https://registry.npmjs.org/${name}/latest`, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const pkg = JSON.parse(data);
            resolve({ name: pkg.name, version: pkg.version, description: pkg.description });
          } catch {
            resolve({ name, version: 'latest' });
          }
        } else {
          reject(new Error(`Package "${name}" not found on npm`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// POST /api/packages/install
router.post('/install', async (req, res) => {
  const { packageName, projectId } = req.body;
  if (!packageName) return res.status(400).json({ error: 'Package name required' });

  const cleanName = packageName.trim().toLowerCase().replace(/[^a-z0-9@/._-]/g, '');
  if (!cleanName) return res.status(400).json({ error: 'Invalid package name' });

  try {
    // Validate on npm first
    const pkgInfo = await checkNpmPackage(cleanName);

    // Return CDN URLs for browser usage
    const cdnUrls = {
      unpkg: `https://unpkg.com/${pkgInfo.name}`,
      esm: `https://esm.sh/${pkgInfo.name}`,
      skypack: `https://cdn.skypack.dev/${pkgInfo.name}`,
    };

    res.json({
      success: true,
      package: pkgInfo,
      cdnUrls,
      importStatement: `import ${sanitizeImportName(pkgInfo.name)} from 'https://esm.sh/${pkgInfo.name}';`,
      message: `✓ ${pkgInfo.name}@${pkgInfo.version} installed via CDN`,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/packages/search?q=react
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query required' });

  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=5`;
  
  https.get(url, (response) => {
    let data = '';
    response.on('data', chunk => (data += chunk));
    response.on('end', () => {
      try {
        const results = JSON.parse(data);
        const packages = results.objects?.map(o => ({
          name: o.package.name,
          version: o.package.version,
          description: o.package.description,
        })) || [];
        res.json(packages);
      } catch {
        res.status(500).json({ error: 'Failed to parse response' });
      }
    });
  }).on('error', err => res.status(500).json({ error: err.message }));
});

function sanitizeImportName(pkg) {
  return pkg.replace(/^@[^/]+\//, '').replace(/[-/]/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
}

module.exports = router;
