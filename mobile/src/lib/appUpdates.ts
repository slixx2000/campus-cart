import Constants from 'expo-constants';

const GITHUB_OWNER = 'slixx2000';
const GITHUB_REPO = 'campus-cart';
const GITHUB_RELEASE_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

export type AppUpdateInfo = {
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releasePageUrl: string;
  downloadUrl: string;
  publishedAt: string | null;
};

function normalizeVersion(value: string) {
  return value.trim().replace(/^v/i, '');
}

function parseVersionParts(value: string) {
  const normalized = normalizeVersion(value);
  const match = normalized.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;

  return match.slice(1).map((part) => Number.parseInt(part, 10)) as [number, number, number];
}

function compareVersions(a: string, b: string) {
  const left = parseVersionParts(a);
  const right = parseVersionParts(b);

  if (!left || !right) {
    return normalizeVersion(a).localeCompare(normalizeVersion(b), undefined, { numeric: true, sensitivity: 'base' });
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] > right[index]) return 1;
    if (left[index] < right[index]) return -1;
  }

  return 0;
}

function getCurrentVersion() {
  return normalizeVersion(Constants.expoConfig?.version ?? '0.0.0');
}

function getReleaseDownloadUrl(release: any) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const apkAsset = assets.find((asset: any) => {
    const name = typeof asset?.name === 'string' ? asset.name.toLowerCase() : '';
    const downloadUrl = typeof asset?.browser_download_url === 'string' ? asset.browser_download_url : '';
    return Boolean(downloadUrl) && (name.endsWith('.apk') || asset?.content_type === 'application/vnd.android.package-archive');
  });

  if (apkAsset?.browser_download_url) {
    return String(apkAsset.browser_download_url);
  }

  if (typeof release?.html_url === 'string') {
    return release.html_url;
  }

  const tag = typeof release?.tag_name === 'string' ? release.tag_name : 'latest';
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tag/${tag}`;
}

export async function checkForLatestAppUpdate(): Promise<AppUpdateInfo | null> {
  const currentVersion = getCurrentVersion();

  const response = await fetch(GITHUB_RELEASE_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub release check failed with status ${response.status}`);
  }

  const release = await response.json();
  const latestVersion = normalizeVersion(String(release?.tag_name ?? release?.name ?? ''));

  if (!latestVersion) {
    throw new Error('Latest GitHub release did not include a version tag.');
  }

  if (compareVersions(latestVersion, currentVersion) <= 0) {
    return null;
  }

  return {
    currentVersion,
    latestVersion,
    releaseName: String(release?.name ?? release?.tag_name ?? `v${latestVersion}`),
    releasePageUrl: typeof release?.html_url === 'string' ? release.html_url : `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tag/v${latestVersion}`,
    downloadUrl: getReleaseDownloadUrl(release),
    publishedAt: typeof release?.published_at === 'string' ? release.published_at : null,
  };
}