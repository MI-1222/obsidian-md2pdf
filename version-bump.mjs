import { readFileSync, writeFileSync } from "fs";

/**
 * npm version 実行時に manifest.json および versions.json を自動更新するスクリプト。
 */
const targetVersion = process.env.npm_package_version;

if (!targetVersion) {
  console.error("エラー: npm_package_version 環境変数が設定されていません。");
  process.exit(1);
}

const manifestRaw = readFileSync("manifest.json", "utf8");
const manifest = JSON.parse(manifestRaw);
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, 2) + "\n");

const versionsRaw = readFileSync("versions.json", "utf8");
const versions = JSON.parse(versionsRaw);
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, 2) + "\n");

console.log(`manifest.json と versions.json をバージョン ${targetVersion} に更新しました。`);
