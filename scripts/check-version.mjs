// In a release, the git tag (v1.2.3) must match manifest.json's version (1.2.3).
import { readManifest, fail } from "./lib.mjs";

const tag = process.env.GITHUB_REF_NAME || process.argv[2];
if (!tag) fail("No tag given. Usage: node scripts/check-version.mjs v1.2.3");
const version = readManifest().version;
if (tag.replace(/^v/, "") !== version) {
  fail(`Tag ${tag} does not match manifest.json version ${version}. Update the version in manifest.json, commit, and tag again.`);
}
console.log(`Tag ${tag} matches manifest version ${version}.`);
