#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const VALID_STATES = new Set(['NOT_STARTED','IN_PROGRESS','PASS','BLOCKED','WAIVED','FAILED']);
const VALID_CONTROLS = new Set(['AUTO_ALLOWED','HUMAN_REVIEW','HUMAN_ACTION']);
const EXPECTED_STAGE_IDS = Array.from({length: 17}, (_, i) => `S${String(i).padStart(2, '0')}`);

function die(message, code = 1) {
  console.error(`FACTORY_ERROR: ${message}`);
  process.exit(code);
}

function loadManifest(file) {
  if (!fs.existsSync(file)) die(`Manifest not found: ${file}`);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    die(`Invalid JSON in ${file}: ${error.message}`);
  }
}

function validate(manifest) {
  const errors = [];
  if (manifest.schema_version !== '0.1') errors.push('schema_version must equal 0.1');
  if (!manifest.project?.id || !manifest.project?.title || !manifest.project?.medium) errors.push('project id/title/medium are required');
  if (!Array.isArray(manifest.stages)) errors.push('stages must be an array');
  if (!Array.isArray(manifest.platforms)) errors.push('platforms must be an array');

  const stages = Array.isArray(manifest.stages) ? manifest.stages : [];
  const ids = stages.map(s => s.id);
  for (const id of EXPECTED_STAGE_IDS) if (!ids.includes(id)) errors.push(`missing required stage ${id}`);
  if (new Set(ids).size !== ids.length) errors.push('duplicate stage ids detected');

  for (const stage of stages) {
    if (!VALID_STATES.has(stage.state)) errors.push(`${stage.id}: invalid state ${stage.state}`);
    if (!VALID_CONTROLS.has(stage.control)) errors.push(`${stage.id}: invalid control ${stage.control}`);
    if (typeof stage.blocking !== 'boolean') errors.push(`${stage.id}: blocking must be boolean`);
    if (!Array.isArray(stage.evidence)) errors.push(`${stage.id}: evidence must be an array`);
    if (!Array.isArray(stage.blockers)) errors.push(`${stage.id}: blockers must be an array`);
    if (stage.state === 'PASS' && stage.evidence.length === 0) errors.push(`${stage.id}: PASS requires evidence`);
    if (stage.state === 'BLOCKED' && stage.blockers.length === 0) errors.push(`${stage.id}: BLOCKED requires at least one blocker`);
  }

  return errors;
}

function summarize(manifest) {
  const stages = manifest.stages;
  const counts = Object.fromEntries([...VALID_STATES].map(s => [s, stages.filter(x => x.state === s).length]));
  const blockingOpen = stages.filter(s => s.blocking && !['PASS','WAIVED'].includes(s.state));
  const human = stages.filter(s => s.control !== 'AUTO_ALLOWED' && !['PASS','WAIVED'].includes(s.state));
  const auto = stages.filter(s => s.control === 'AUTO_ALLOWED' && !['PASS','WAIVED'].includes(s.state));
  const firstOpen = stages.find(s => s.blocking && !['PASS','WAIVED'].includes(s.state));
  const rc = stages.find(s => s.id === 'S13');
  const release = stages.find(s => s.id === 'S14');
  const live = stages.find(s => s.id === 'S16');

  return {
    counts,
    blockingOpen,
    human,
    auto,
    firstOpen,
    rcVerified: rc?.state === 'PASS',
    humanReleaseApproved: release?.state === 'PASS',
    live: live?.state === 'IN_PROGRESS' || manifest.project?.status === 'LIVE'
  };
}

function printTable(manifest, summary) {
  console.log(`\nPRODUCT ENGINE FACTORY STATUS`);
  console.log(`Project: ${manifest.project.title} (${manifest.project.id})`);
  console.log(`Medium: ${manifest.project.medium}`);
  console.log(`Project state: ${manifest.project.status}`);
  console.log(`Price hypothesis: ${manifest.commercial?.price_hypothesis_usd == null ? 'n/a' : `$${manifest.commercial.price_hypothesis_usd.toFixed(2)}`}`);
  console.log(`Price approved: ${manifest.commercial?.price_approved ? 'YES' : 'NO'}`);
  console.log('');
  console.log('ID   STATE         CONTROL        STAGE');
  console.log('----  ------------  -------------  ----------------------------------------');
  for (const s of manifest.stages) {
    console.log(`${s.id.padEnd(4)}  ${s.state.padEnd(12)}  ${s.control.padEnd(13)}  ${s.name}`);
  }
  console.log('');
  console.log(`Blocking gates open: ${summary.blockingOpen.length}`);
  if (summary.firstOpen) console.log(`Current first blocking gate: ${summary.firstOpen.id} ${summary.firstOpen.name}`);
  console.log(`Human-owned open gates: ${summary.human.length}`);
  console.log(`Auto-owned open gates: ${summary.auto.length}`);
  console.log(`RC_VERIFIED: ${summary.rcVerified ? 'YES' : 'NO'}`);
  console.log(`HUMAN_RELEASE_APPROVED: ${summary.humanReleaseApproved ? 'YES' : 'NO'}`);
  console.log(`LIVE: ${summary.live ? 'YES' : 'NO'}`);

  if (summary.human.length) {
    console.log('\nHUMAN QUEUE');
    for (const s of summary.human) console.log(`- ${s.id} ${s.name}: ${s.next_action ?? s.blockers[0] ?? 'Review required'}`);
  }
  if (summary.auto.length) {
    console.log('\nAUTOMATION QUEUE');
    for (const s of summary.auto) console.log(`- ${s.id} ${s.name}: ${s.next_action ?? s.blockers[0] ?? 'Continue work'}`);
  }
}

function asJson(manifest, summary) {
  return {
    project: manifest.project,
    commercial: manifest.commercial,
    counts: summary.counts,
    blocking_open: summary.blockingOpen.map(s => s.id),
    current_blocking_gate: summary.firstOpen?.id ?? null,
    human_queue: summary.human.map(s => ({id:s.id,name:s.name,state:s.state,next_action:s.next_action,blockers:s.blockers})),
    automation_queue: summary.auto.map(s => ({id:s.id,name:s.name,state:s.state,next_action:s.next_action,blockers:s.blockers})),
    release: {
      rc_verified: summary.rcVerified,
      human_release_approved: summary.humanReleaseApproved,
      live: summary.live
    }
  };
}

const args = process.argv.slice(2);
const manifestArg = args.find(a => !a.startsWith('--')) ?? 'factory/projects/critter-flip.json';
const manifestPath = path.resolve(process.cwd(), manifestArg);
const jsonMode = args.includes('--json');
const validateOnly = args.includes('--validate-only');
const requireRc = args.includes('--require-rc');
const requireRelease = args.includes('--require-release');

const manifest = loadManifest(manifestPath);
const errors = validate(manifest);
if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  die(`${errors.length} manifest validation error(s)`);
}

const summary = summarize(manifest);
if (!validateOnly) {
  if (jsonMode) console.log(JSON.stringify(asJson(manifest, summary), null, 2));
  else printTable(manifest, summary);
}

if (requireRc && !summary.rcVerified) die('RC_VERIFIED required but S13 is not PASS', 2);
if (requireRelease && !(summary.rcVerified && summary.humanReleaseApproved)) die('Release authority required but S13/S14 are not both PASS', 3);

if (validateOnly) console.log(`FACTORY_MANIFEST_VALID: ${manifest.project.id}`);
