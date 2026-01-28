/**
 * Model Storage for Face Recognition
 * Primary: Cache API (browser cache, works without SW)
 * Fallback: IndexedDB (for browsers with limited Cache API support)
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'gurukool-face-models';
const DB_VERSION = 1;
const STORE_NAME = 'models';
const CACHE_NAME = 'face-api-models-v1';

interface ModelDBSchema extends DBSchema {
  models: {
    key: string;
    value: {
      id: string;
      data: ArrayBuffer;
      size: number;
      cachedAt: number;
      version: string;
    };
  };
}

type ModelDB = IDBPDatabase<ModelDBSchema>;

let dbPromise: Promise<ModelDB> | null = null;

/**
 * Model files metadata
 */
const MODEL_FILES = [
  {
    id: 'ssd_mobilenetv1_manifest',
    url: '/models/face-api/ssd_mobilenetv1_model-weights_manifest.json',
  },
  {
    id: 'ssd_mobilenetv1_shard1',
    url: '/models/face-api/ssd_mobilenetv1_model-shard1',
  },
  {
    id: 'ssd_mobilenetv1_shard2',
    url: '/models/face-api/ssd_mobilenetv1_model-shard2',
  },
  {
    id: 'face_landmark_68_manifest',
    url: '/models/face-api/face_landmark_68_model-weights_manifest.json',
  },
  {
    id: 'face_landmark_68_shard1',
    url: '/models/face-api/face_landmark_68_model-shard1',
  },
  {
    id: 'face_recognition_manifest',
    url: '/models/face-api/face_recognition_model-weights_manifest.json',
  },
  {
    id: 'face_recognition_shard1',
    url: '/models/face-api/face_recognition_model-shard1',
  },
  {
    id: 'face_recognition_shard2',
    url: '/models/face-api/face_recognition_model-shard2',
  },
];

const MODEL_VERSION = '1.0.0';

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  try {
    return 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Get or create the database connection
 */
async function getDB(): Promise<ModelDB> {
  if (!isIndexedDBSupported()) {
    throw new Error('IndexedDB is not supported in this browser');
  }

  if (!dbPromise) {
    dbPromise = openDB<ModelDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  return dbPromise;
}

/**
 * Store a model file in IndexedDB
 */
export async function storeModel(id: string, data: ArrayBuffer): Promise<void> {
  const db = await getDB();

  await db.put(STORE_NAME, {
    id,
    data,
    size: data.byteLength,
    cachedAt: Date.now(),
    version: MODEL_VERSION,
  });

  console.log(`[ModelStorage] Stored model: ${id} (${data.byteLength} bytes)`);
}

/**
 * Retrieve a model file from IndexedDB
 */
export async function getModel(id: string): Promise<ArrayBuffer | null> {
  const db = await getDB();
  const entry = await db.get(STORE_NAME, id);

  if (entry && entry.version === MODEL_VERSION) {
    console.log(`[ModelStorage] Retrieved model from cache: ${id}`);
    return entry.data;
  }

  return null;
}

/**
 * Check if a model is cached
 */
export async function isModelCached(id: string): Promise<boolean> {
  const db = await getDB();
  const entry = await db.get(STORE_NAME, id);
  return entry !== undefined && entry.version === MODEL_VERSION;
}

/**
 * Get cache status for all models
 */
export async function getModelCacheStatus(): Promise<{
  totalModels: number;
  cachedModels: number;
  totalSize: number;
  allCached: boolean;
  details: Array<{ id: string; cached: boolean; size: number }>;
}> {
  const db = await getDB();
  const details: Array<{ id: string; cached: boolean; size: number }> = [];
  let totalSize = 0;
  let cachedCount = 0;

  for (const model of MODEL_FILES) {
    const entry = await db.get(STORE_NAME, model.id);
    const cached = entry !== undefined && entry.version === MODEL_VERSION;
    const size = entry?.size ?? 0;

    details.push({ id: model.id, cached, size });

    if (cached) {
      cachedCount++;
      totalSize += size;
    }
  }

  return {
    totalModels: MODEL_FILES.length,
    cachedModels: cachedCount,
    totalSize,
    allCached: cachedCount === MODEL_FILES.length,
    details,
  };
}

/**
 * Download and cache all models
 */
export async function cacheAllModels(
  onProgress?: (progress: number, currentModel: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const total = MODEL_FILES.length;
    let completed = 0;

    for (const model of MODEL_FILES) {
      // Check if already cached
      const cached = await isModelCached(model.id);
      if (cached) {
        completed++;
        onProgress?.(Math.round((completed / total) * 100), model.id);
        continue;
      }

      // Fetch from network
      const response = await fetch(model.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${model.url}: ${response.statusText}`);
      }

      const data = await response.arrayBuffer();
      await storeModel(model.id, data);

      completed++;
      onProgress?.(Math.round((completed / total) * 100), model.id);
    }

    console.log('[ModelStorage] All models cached successfully');
    return { success: true };
  } catch (error) {
    console.error('[ModelStorage] Failed to cache models:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clear all cached models
 */
export async function clearModelCache(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
  console.log('[ModelStorage] Model cache cleared');
}

/**
 * Get a model URL that works with IndexedDB cache
 * Returns blob URL if cached, otherwise returns original URL
 */
export async function getModelUrl(
  id: string,
  originalUrl: string
): Promise<string> {
  const data = await getModel(id);
  if (data) {
    const blob = new Blob([data]);
    return URL.createObjectURL(blob);
  }
  return originalUrl;
}

/**
 * Create model URLs from IndexedDB cache for face-api.js
 * Returns object with blob URLs if cached
 */
export async function createCachedModelUrls(): Promise<{
  useCachedUrls: boolean;
  modelPath: string;
  blobUrls?: Map<string, string>;
}> {
  const status = await getModelCacheStatus();

  if (!status.allCached) {
    return {
      useCachedUrls: false,
      modelPath: '/models/face-api',
    };
  }

  const blobUrls = new Map<string, string>();

  for (const model of MODEL_FILES) {
    const data = await getModel(model.id);
    if (data) {
      const blob = new Blob([data]);
      blobUrls.set(model.url, URL.createObjectURL(blob));
    }
  }

  return {
    useCachedUrls: true,
    modelPath: '/models/face-api',
    blobUrls,
  };
}

/**
 * Revoke blob URLs when done
 */
export function revokeCachedModelUrls(blobUrls: Map<string, string>): void {
  for (const url of blobUrls.values()) {
    URL.revokeObjectURL(url);
  }
}

// ============================================================================
// Cache API Methods (Primary - works without Service Worker)
// ============================================================================

/**
 * Check if Cache API is supported
 */
export function isCacheAPISupported(): boolean {
  return 'caches' in window;
}

/**
 * Cache all face-api models using Cache API
 */
export async function cacheModelsWithCacheAPI(
  onProgress?: (progress: number, currentModel: string) => void
): Promise<{ success: boolean; error?: string }> {
  if (!isCacheAPISupported()) {
    console.log(
      '[ModelStorage] Cache API not supported, falling back to IndexedDB'
    );
    return cacheAllModels(onProgress);
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const total = MODEL_FILES.length;
    let completed = 0;

    for (const model of MODEL_FILES) {
      // Check if already cached
      const cached = await cache.match(model.url);
      if (cached) {
        completed++;
        onProgress?.(Math.round((completed / total) * 100), model.id);
        continue;
      }

      // Fetch and cache
      const response = await fetch(model.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${model.url}: ${response.statusText}`);
      }

      await cache.put(model.url, response);
      completed++;
      onProgress?.(Math.round((completed / total) * 100), model.id);
    }

    console.log('[ModelStorage] All models cached with Cache API');
    return { success: true };
  } catch (error) {
    console.error('[ModelStorage] Cache API caching failed:', error);
    // Fallback to IndexedDB
    return cacheAllModels(onProgress);
  }
}

/**
 * Check if models are cached with Cache API
 */
export async function checkCacheAPIStatus(): Promise<{
  allCached: boolean;
  cachedCount: number;
  totalCount: number;
}> {
  if (!isCacheAPISupported()) {
    const idbStatus = await getModelCacheStatus();
    return {
      allCached: idbStatus.allCached,
      cachedCount: idbStatus.cachedModels,
      totalCount: idbStatus.totalModels,
    };
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    let cachedCount = 0;

    for (const model of MODEL_FILES) {
      const cached = await cache.match(model.url);
      if (cached) {
        cachedCount++;
      }
    }

    return {
      allCached: cachedCount === MODEL_FILES.length,
      cachedCount,
      totalCount: MODEL_FILES.length,
    };
  } catch {
    return {
      allCached: false,
      cachedCount: 0,
      totalCount: MODEL_FILES.length,
    };
  }
}

/**
 * Clear Cache API cache
 */
export async function clearCacheAPICache(): Promise<void> {
  if (isCacheAPISupported()) {
    await caches.delete(CACHE_NAME);
    console.log('[ModelStorage] Cache API cache cleared');
  }
  await clearModelCache();
}

/**
 * Get the best available caching method
 * Prefers Cache API, falls back to IndexedDB
 */
export async function getBestCacheMethod(): Promise<
  'cache-api' | 'indexeddb' | 'none'
> {
  if (isCacheAPISupported()) {
    return 'cache-api';
  }
  if (isIndexedDBSupported()) {
    return 'indexeddb';
  }
  return 'none';
}

/**
 * Cache models using the best available method
 */
export async function cacheModels(
  onProgress?: (progress: number, currentModel: string) => void
): Promise<{ success: boolean; error?: string; method: string }> {
  const method = await getBestCacheMethod();

  if (method === 'cache-api') {
    const result = await cacheModelsWithCacheAPI(onProgress);
    return { ...result, method: 'cache-api' };
  }

  if (method === 'indexeddb') {
    const result = await cacheAllModels(onProgress);
    return { ...result, method: 'indexeddb' };
  }

  return {
    success: false,
    error: 'No caching method available',
    method: 'none',
  };
}

/**
 * Check cache status using the best available method
 */
export async function getCacheStatus(): Promise<{
  allCached: boolean;
  cachedCount: number;
  totalCount: number;
  method: string;
}> {
  const method = await getBestCacheMethod();

  if (method === 'cache-api') {
    const status = await checkCacheAPIStatus();
    return { ...status, method: 'cache-api' };
  }

  if (method === 'indexeddb') {
    const status = await getModelCacheStatus();
    return {
      allCached: status.allCached,
      cachedCount: status.cachedModels,
      totalCount: status.totalModels,
      method: 'indexeddb',
    };
  }

  return {
    allCached: false,
    cachedCount: 0,
    totalCount: MODEL_FILES.length,
    method: 'none',
  };
}
