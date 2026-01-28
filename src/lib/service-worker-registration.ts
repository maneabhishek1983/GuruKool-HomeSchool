/**
 * Service Worker Registration for Face Recognition Models
 * Registers the service worker and provides utilities for model caching
 */

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  registration?: ServiceWorkerRegistration;
  error?: string;
}

export interface CacheStatus {
  allCached: boolean;
  cachedCount: number;
  totalCount: number;
  error?: string;
}

/**
 * Check if service workers are supported in this browser
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register the face recognition service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerStatus> {
  if (!isServiceWorkerSupported()) {
    return {
      isSupported: false,
      isRegistered: false,
      isActive: false,
      error: 'Service workers not supported in this browser',
    };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    const isActive = registration.active !== null;

    console.log('[SW Registration] Service worker registered:', {
      scope: registration.scope,
      isActive,
    });

    return {
      isSupported: true,
      isRegistered: true,
      isActive,
      registration,
    };
  } catch (error) {
    console.error(
      '[SW Registration] Failed to register service worker:',
      error
    );
    return {
      isSupported: true,
      isRegistered: false,
      isActive: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('[SW Registration] Service worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error(
      '[SW Registration] Failed to unregister service worker:',
      error
    );
    return false;
  }
}

/**
 * Send a message to the service worker and wait for response
 */
async function sendMessageToSW<T>(
  message: Record<string, unknown>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = event => {
      resolve(event.data as T);
    };

    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        registration.active.postMessage(message, [messageChannel.port2]);
      } else {
        reject(new Error('No active service worker'));
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Service worker message timeout'));
    }, 10000);
  });
}

/**
 * Trigger manual caching of face-api models
 */
export async function triggerModelCaching(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isServiceWorkerSupported()) {
    return { success: false, error: 'Service workers not supported' };
  }

  try {
    const result = await sendMessageToSW<{ success: boolean; error?: string }>({
      type: 'CACHE_MODELS',
    });
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if face-api models are cached
 */
export async function checkModelCacheStatus(): Promise<CacheStatus> {
  if (!isServiceWorkerSupported()) {
    return {
      allCached: false,
      cachedCount: 0,
      totalCount: 8,
      error: 'Service workers not supported',
    };
  }

  try {
    const status = await sendMessageToSW<CacheStatus>({
      type: 'CHECK_CACHE_STATUS',
    });
    return status;
  } catch (error) {
    return {
      allCached: false,
      cachedCount: 0,
      totalCount: 8,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Force update the service worker
 */
export async function updateServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('[SW Registration] Service worker update triggered');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[SW Registration] Failed to update service worker:', error);
    return false;
  }
}
