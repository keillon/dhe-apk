import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { getPublicApiBase, getUpdatesRoot } from "./updates-storage";

export interface AppReleaseMeta {
  version: string;
  versionCode: number;
  notes?: string;
  publishedAt: string;
  apkFileName: string;
}

function getAppReleaseDir(): string {
  return path.join(getUpdatesRoot(), "app-release");
}

export function getAppReleaseMetaPath(): string {
  return path.join(getAppReleaseDir(), "release.json");
}

export function getAppReleaseApkPath(fileName = "dhe-hidraulicos.apk"): string {
  return path.join(getAppReleaseDir(), fileName);
}

export async function readAppReleaseMeta(): Promise<AppReleaseMeta | null> {
  try {
    const raw = await fsp.readFile(getAppReleaseMetaPath(), "utf8");
    return JSON.parse(raw) as AppReleaseMeta;
  } catch {
    return null;
  }
}

export async function writeAppRelease(args: {
  version: string;
  versionCode: number;
  notes?: string;
  apkBuffer: Buffer;
}): Promise<AppReleaseMeta> {
  const dir = getAppReleaseDir();
  await fsp.mkdir(dir, { recursive: true });

  const apkFileName = "dhe-hidraulicos.apk";
  const apkPath = getAppReleaseApkPath(apkFileName);
  await fsp.writeFile(apkPath, args.apkBuffer);

  const meta: AppReleaseMeta = {
    version: args.version,
    versionCode: args.versionCode,
    notes: args.notes,
    publishedAt: new Date().toISOString(),
    apkFileName,
  };

  await fsp.writeFile(getAppReleaseMetaPath(), JSON.stringify(meta, null, 2), "utf8");
  return meta;
}

export function buildAppVersionPayload(meta: AppReleaseMeta) {
  return {
    version: meta.version,
    versionCode: meta.versionCode,
    notes: meta.notes,
    publishedAt: meta.publishedAt,
    apkUrl: `${getPublicApiBase()}/api/app/download`,
  };
}

export function appReleaseApkExists(meta: AppReleaseMeta): boolean {
  return fs.existsSync(getAppReleaseApkPath(meta.apkFileName));
}
