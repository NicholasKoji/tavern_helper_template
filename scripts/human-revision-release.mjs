import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stageRoot = join(root, 'deploy', '.human-revision-pages');
const wranglerVersion = '4.125.0';
const basePath = '/human-revision';

const assets = [
  {
    source: 'dist/人间修订中/界面/世界配置/index.html',
    target: 'human-revision/world-config/index.html',
    marker: 'human-revision-opening-v3',
    contentType: 'text/html; charset=UTF-8',
  },
  {
    source: 'dist/人间修订中/界面/状态栏/index.html',
    target: 'human-revision/status/index.html',
    marker: 'human-revision-status-v2',
    contentType: 'text/html; charset=UTF-8',
  },
  {
    source: 'dist/人间修订中/脚本/变量结构/index.js',
    target: 'human-revision/schema/index.js',
    marker: 'registerMvuSchema',
    contentType: 'application/javascript; charset=UTF-8',
  },
];

const headersFile = `/${basePath.slice(1)}/*
  Cache-Control: no-cache, must-revalidate
  Access-Control-Allow-Origin: *

${assets
  .map(
    asset => `/${asset.target}
  Content-Type: ${asset.contentType}`,
  )
  .join('\n\n')}
`;

function assertInsideRoot(target) {
  const relativePath = relative(root, resolve(target));
  if (relativePath.startsWith('..') || relativePath.includes(`..${resolve('/')}`)) {
    throw new Error(`路径越界: ${target}`);
  }
}

function cleanStage() {
  assertInsideRoot(stageRoot);
  rmSync(stageRoot, { recursive: true, force: true });
  mkdirSync(stageRoot, { recursive: true });
}

function readAsset(asset) {
  const sourcePath = join(root, asset.source);
  if (!existsSync(sourcePath)) throw new Error(`缺少构建产物: ${asset.source}`);
  const content = readFileSync(sourcePath, 'utf8');
  if (!content.includes(asset.marker)) throw new Error(`产物缺少关键标记: ${asset.source}`);
  if (asset.contentType.startsWith('text/html') && /<script\b[^>]*\bsrc\s*=|<link\b[^>]*\bhref\s*=/i.test(content)) {
    throw new Error(`HTML 包含外部 script/link: ${asset.source}`);
  }
  return { sourcePath, content };
}

function stage() {
  cleanStage();
  for (const asset of assets) {
    const { sourcePath } = readAsset(asset);
    const targetPath = join(stageRoot, asset.target);
    assertInsideRoot(targetPath);
    mkdirSync(dirname(targetPath), { recursive: true });
    cpSync(sourcePath, targetPath);
  }
  writeFileSync(join(stageRoot, '_headers'), headersFile, 'utf8');
  const expectedFiles = new Set(['_headers', ...assets.map(asset => asset.target)]);
  const actualFiles = new Set();
  const collectFiles = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) collectFiles(entryPath);
      else actualFiles.add(relative(stageRoot, entryPath).replaceAll('\\', '/'));
    }
  };
  collectFiles(stageRoot);
  if (actualFiles.size !== expectedFiles.size || [...expectedFiles].some(file => !actualFiles.has(file))) {
    throw new Error(`staging 文件范围异常: ${JSON.stringify([...actualFiles].sort())}`);
  }
  console.info(`HUMAN_REVISION_STAGE=${stageRoot}`);
  console.info(`HUMAN_REVISION_ASSETS=${assets.length}`);
  return stageRoot;
}

function normalizeBaseUrl(value) {
  if (!value) throw new Error('缺少 HUMAN_REVISION_PAGES_BASE_URL');
  const url = new URL(value.trim());
  if (url.protocol !== 'https:') throw new Error('HUMAN_REVISION_PAGES_BASE_URL 必须使用 https');
  return url.href.replace(/\/+$/, '');
}

function expectedAsset(pathname) {
  return assets.find(asset => `/${asset.target}` === pathname);
}

function startLocalServer() {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    const asset = expectedAsset(pathname);
    if (!asset || request.method !== 'GET') {
      response.statusCode = 404;
      response.end();
      return;
    }
    const body = readFileSync(join(stageRoot, asset.target));
    const stat = statSync(join(stageRoot, asset.target));
    const etag = `"${body.length.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}"`;
    response.setHeader('Cache-Control', 'no-cache, must-revalidate');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', asset.contentType);
    response.setHeader('ETag', etag);
    if (request.headers['if-none-match'] === etag) {
      response.statusCode = 304;
      response.end();
      return;
    }
    response.statusCode = 200;
    response.end(body);
  });
  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolveServer(server));
  });
}

async function verifyBaseUrl(baseUrl) {
  const results = [];
  for (const asset of assets) {
    const url = `${baseUrl}/${asset.target}`;
    const first = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    const body = await first.text();
    const cacheControl = first.headers.get('cache-control') ?? '';
    const cors = first.headers.get('access-control-allow-origin') ?? '';
    const contentType = first.headers.get('content-type') ?? '';
    const etag = first.headers.get('etag') ?? '';
    if (first.status !== 200) throw new Error(`${url} HTTP ${first.status}`);
    if (!body.includes(asset.marker)) throw new Error(`${url} 缺少关键标记 ${asset.marker}`);
    if (!/no-cache/i.test(cacheControl) || !/must-revalidate/i.test(cacheControl)) {
      throw new Error(`${url} Cache-Control=${cacheControl}`);
    }
    if (cors !== '*') throw new Error(`${url} Access-Control-Allow-Origin=${cors}`);
    if (!contentType.toLowerCase().startsWith(asset.contentType.split(';')[0])) {
      throw new Error(`${url} Content-Type=${contentType}`);
    }
    if (!etag) throw new Error(`${url} 缺少 ETag`);
    const conditional = await fetch(url, { headers: { 'If-None-Match': etag } });
    if (conditional.status !== 304) throw new Error(`${url} 条件请求 HTTP ${conditional.status}，期望 304`);
    results.push(`${asset.target}:200/${contentType}/ETag/304`);
  }
  for (const result of results) console.info(`HUMAN_REVISION_VERIFY=${result}`);
}

async function verifyLocal() {
  stage();
  const stagedHeaders = readFileSync(join(stageRoot, '_headers'), 'utf8');
  for (const requiredHeader of ['Cache-Control: no-cache, must-revalidate', 'Access-Control-Allow-Origin: *']) {
    if (!stagedHeaders.includes(requiredHeader)) throw new Error(`_headers 缺少 ${requiredHeader}`);
  }
  const server = await startLocalServer();
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('本地验证服务未取得端口');
  try {
    await verifyBaseUrl(`http://127.0.0.1:${address.port}`);
    console.info('HUMAN_REVISION_LOCAL_VERIFY=PASS');
  } finally {
    await new Promise(resolveServer => server.close(resolveServer));
  }
}

function runPnpm(args, environment = process.env) {
  const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(executable, args, { cwd: root, env: environment, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`命令失败: pnpm ${args.join(' ')}`);
}

async function deploy() {
  normalizeBaseUrl(process.env.HUMAN_REVISION_PAGES_BASE_URL);
  const project = process.env.HUMAN_REVISION_PAGES_PROJECT;
  if (!project) throw new Error('缺少 HUMAN_REVISION_PAGES_PROJECT');
  if (!process.env.CLOUDFLARE_API_TOKEN) throw new Error('缺少 CLOUDFLARE_API_TOKEN');
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error('缺少 CLOUDFLARE_ACCOUNT_ID');
  runPnpm(['build'], { ...process.env, HUMAN_REVISION_PAGES_ONLY: 'true' });
  const output = stage();
  runPnpm(['dlx', `wrangler@${wranglerVersion}`, 'pages', 'deploy', output, '--project-name', project]);
  await verifyBaseUrl(normalizeBaseUrl(process.env.HUMAN_REVISION_PAGES_BASE_URL));
  console.info(`HUMAN_REVISION_DEPLOY=PASS project=${project}`);
}

const command = process.argv[2] ?? 'verify';
if (command === 'stage') {
  stage();
} else if (command === 'verify') {
  const baseUrlIndex = process.argv.indexOf('--base-url');
  if (baseUrlIndex >= 0) {
    stage();
    await verifyBaseUrl(normalizeBaseUrl(process.argv[baseUrlIndex + 1]));
    console.info('HUMAN_REVISION_REMOTE_VERIFY=PASS');
  } else {
    await verifyLocal();
  }
} else if (command === 'deploy') {
  await deploy();
} else {
  throw new Error(`未知命令: ${command}，可用命令为 stage、verify、deploy`);
}
