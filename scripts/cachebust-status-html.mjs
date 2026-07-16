import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));

const targets = [
  {
    name: '虚拟回响状态栏',
    sourceHtml: join(root, 'dist', '虚拟回响', '界面', '状态栏', 'index.html'),
    characterYaml: join(root, 'src', '虚拟回响', 'index.yaml'),
    cdnBase:
      'https://testingcf.jsdelivr.net/gh/NicholasKoji/tavern_helper_template@codex%2Fvirtual-reviewer-card/dist/虚拟回响/界面/状态栏',
    urlPattern:
      /const status_url = 'https:\/\/[^']+\/dist\/虚拟回响\/界面\/状态栏\/index(?:\.[a-f0-9]{12})?\.html';/,
  },
];

for (const target of targets) {
  if (!existsSync(target.sourceHtml)) {
    throw new Error(`[cachebust-status-html] Missing built HTML for ${target.name}: ${target.sourceHtml}`);
  }

  const html = readFileSync(target.sourceHtml);
  const hash = createHash('sha256').update(html).digest('hex').slice(0, 12);
  const versionedName = `index.${hash}.html`;
  const versionedHtml = join(dirname(target.sourceHtml), versionedName);

  if (!existsSync(versionedHtml) || !readFileSync(versionedHtml).equals(html)) {
    writeFileSync(versionedHtml, html);
  }

  const yaml = readFileSync(target.characterYaml, 'utf8');
  const nextUrl = `${target.cdnBase}/${versionedName}`;
  const nextLine = `const status_url = '${nextUrl}';`;

  if (!target.urlPattern.test(yaml)) {
    throw new Error(`[cachebust-status-html] Could not find status_url in ${target.characterYaml}`);
  }

  const nextYaml = yaml.replace(target.urlPattern, nextLine);
  if (nextYaml !== yaml) {
    writeFileSync(target.characterYaml, nextYaml);
  }

  console.info(`[cachebust-status-html] ${target.name}: ${versionedName}`);
}
