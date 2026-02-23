// Preconfigured storage helpers for Manus WebDev templates
// Uses local file storage for development

import { ENV } from './_core/env';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  // Use different URLs for development vs production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('Using local file storage for uploads (development)');
    return { 
      baseUrl: 'http://localhost:3001/uploads', 
      apiKey: 'local-storage' 
    };
  } else {
    // For production (Render), use the deployed URL
    const productionUrl = process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'https://life-vault-frontend.onrender.com';
    const baseUrl = productionUrl.replace(/\/$/, '') + '/uploads';
    console.log(`Using production storage: ${baseUrl}`);
    return { 
      baseUrl: baseUrl, 
      apiKey: 'production-storage' 
    };
  }
}

// Ensure uploads directory exists
function ensureUploadsDir() {
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  // For local storage, just return the URL directly
  return `${ensureTrailingSlash(baseUrl)}${normalizeKey(relKey)}`;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const config = getStorageConfig();
  
  // Use local file storage - save directly to uploads folder
  try {
    const uploadsDir = ensureUploadsDir();
    const fileName = key.split('/').pop() || key;
    
    // Add proper file extension based on content type
    let finalFileName = fileName;
    if (contentType === 'image/jpeg') {
      finalFileName = fileName.endsWith('.jpg') ? fileName : `${fileName}.jpg`;
    } else if (contentType === 'video/mp4') {
      finalFileName = fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`;
    } else if (contentType === 'image/png') {
      finalFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    }
    
    const filePath = join(uploadsDir, finalFileName);
    
    // Write file to disk
    const buffer = typeof data === 'string' ? Buffer.from(data, 'base64') : data;
    writeFileSync(filePath, buffer);
    
    // Use dynamic base URL for production compatibility
    const url = `${config.baseUrl}/${finalFileName}`;
    console.log(`File saved locally: ${filePath}`);
    console.log(`Accessible at: ${url}`);
    
    return { key, url };
  } catch (error) {
    console.error('Local storage error:', error);
    throw new Error(`Failed to save file locally: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const key = normalizeKey(relKey);
  const config = getStorageConfig();
  const fileName = key.split('/').pop() || key;
  return {
    key,
    url: `${config.baseUrl}/${fileName}`,
  };
}
