// Offline storage using IndexedDB for PWA
import { openDB } from 'idb';

const DB_NAME = 'fadila-sales-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  OFFLINE_SALES: 'offline-sales',
  PRODUCTS_CACHE: 'products-cache',
  SALES_CACHE: 'sales-cache'
};

// Initialize IndexedDB
export async function initDB() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create offline sales store
        if (!db.objectStoreNames.contains(STORES.OFFLINE_SALES)) {
          const salesStore = db.createObjectStore(STORES.OFFLINE_SALES, {
            keyPath: 'id',
            autoIncrement: true
          });
          salesStore.createIndex('timestamp', 'timestamp');
          salesStore.createIndex('synced', 'synced');
        }

        // Create products cache store
        if (!db.objectStoreNames.contains(STORES.PRODUCTS_CACHE)) {
          const productsStore = db.createObjectStore(STORES.PRODUCTS_CACHE, {
            keyPath: '_id'
          });
          productsStore.createIndex('category', 'category');
          productsStore.createIndex('updatedAt', 'updatedAt');
        }

        // Create sales cache store
        if (!db.objectStoreNames.contains(STORES.SALES_CACHE)) {
          const salesCacheStore = db.createObjectStore(STORES.SALES_CACHE, {
            keyPath: '_id'
          });
          salesCacheStore.createIndex('saleDate', 'saleDate');
        }
      }
    });

    console.log('✅ IndexedDB initialized');
    return db;
  } catch (error) {
    console.error('❌ IndexedDB initialization failed:', error);
    throw error;
  }
}

// ============================================
// OFFLINE SALES OPERATIONS
// ============================================

// Save sale for offline sync
export async function saveOfflineSale(saleData, token) {
  try {
    const db = await initDB();
    const sale = {
      data: saleData,
      token: token,
      timestamp: new Date().toISOString(),
      synced: false
    };

    const id = await db.add(STORES.OFFLINE_SALES, sale);
    console.log('✅ Offline sale saved:', id);
    return id;
  } catch (error) {
    console.error('❌ Failed to save offline sale:', error);
    throw error;
  }
}

// Get all offline sales
export async function getOfflineSales() {
  try {
    const db = await initDB();
    const sales = await db.getAll(STORES.OFFLINE_SALES);
    return sales.filter(sale => !sale.synced);
  } catch (error) {
    console.error('❌ Failed to get offline sales:', error);
    return [];
  }
}

// Mark offline sale as synced
export async function markSaleAsSynced(id) {
  try {
    const db = await initDB();
    const sale = await db.get(STORES.OFFLINE_SALES, id);
    
    if (sale) {
      sale.synced = true;
      sale.syncedAt = new Date().toISOString();
      await db.put(STORES.OFFLINE_SALES, sale);
      console.log('✅ Sale marked as synced:', id);
    }
  } catch (error) {
    console.error('❌ Failed to mark sale as synced:', error);
  }
}

// Delete synced offline sale
export async function deleteOfflineSale(id) {
  try {
    const db = await initDB();
    await db.delete(STORES.OFFLINE_SALES, id);
    console.log('✅ Offline sale deleted:', id);
  } catch (error) {
    console.error('❌ Failed to delete offline sale:', error);
  }
}

// Clear all synced offline sales
export async function clearSyncedSales() {
  try {
    const db = await initDB();
    const tx = db.transaction(STORES.OFFLINE_SALES, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_SALES);
    const sales = await store.getAll();

    for (const sale of sales) {
      if (sale.synced) {
        await store.delete(sale.id);
      }
    }

    await tx.done;
    console.log('✅ Synced sales cleared');
  } catch (error) {
    console.error('❌ Failed to clear synced sales:', error);
  }
}

// ============================================
// PRODUCTS CACHE OPERATIONS
// ============================================

// Cache products for offline access
export async function cacheProducts(products) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORES.PRODUCTS_CACHE, 'readwrite');
    const store = tx.objectStore(STORES.PRODUCTS_CACHE);

    // Clear old cache
    await store.clear();

    // Add new products
    for (const product of products) {
      await store.put({
        ...product,
        cachedAt: new Date().toISOString()
      });
    }

    await tx.done;
    console.log(`✅ ${products.length} products cached`);
  } catch (error) {
    console.error('❌ Failed to cache products:', error);
  }
}

// Get cached products
export async function getCachedProducts() {
  try {
    const db = await initDB();
    const products = await db.getAll(STORES.PRODUCTS_CACHE);
    console.log(`✅ Retrieved ${products.length} cached products`);
    return products;
  } catch (error) {
    console.error('❌ Failed to get cached products:', error);
    return [];
  }
}

// Update single cached product
export async function updateCachedProduct(product) {
  try {
    const db = await initDB();
    await db.put(STORES.PRODUCTS_CACHE, {
      ...product,
      cachedAt: new Date().toISOString()
    });
    console.log('✅ Product cache updated:', product._id);
  } catch (error) {
    console.error('❌ Failed to update cached product:', error);
  }
}

// ============================================
// SALES CACHE OPERATIONS
// ============================================

// Cache sales for offline access
export async function cacheSales(sales) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORES.SALES_CACHE, 'readwrite');
    const store = tx.objectStore(STORES.SALES_CACHE);

    // Clear old cache
    await store.clear();

    // Add new sales
    for (const sale of sales) {
      await store.put({
        ...sale,
        cachedAt: new Date().toISOString()
      });
    }

    await tx.done;
    console.log(`✅ ${sales.length} sales cached`);
  } catch (error) {
    console.error('❌ Failed to cache sales:', error);
  }
}

// Get cached sales
export async function getCachedSales() {
  try {
    const db = await initDB();
    const sales = await db.getAll(STORES.SALES_CACHE);
    console.log(`✅ Retrieved ${sales.length} cached sales`);
    return sales;
  } catch (error) {
    console.error('❌ Failed to get cached sales:', error);
    return [];
  }
}

// ============================================
// GENERAL CACHE OPERATIONS
// ============================================

// Clear all caches
export async function clearAllCaches() {
  try {
    const db = await initDB();
    
    await db.clear(STORES.OFFLINE_SALES);
    await db.clear(STORES.PRODUCTS_CACHE);
    await db.clear(STORES.SALES_CACHE);
    
    console.log('✅ All caches cleared');
  } catch (error) {
    console.error('❌ Failed to clear caches:', error);
  }
}

// Get cache size
export async function getCacheSize() {
  try {
    const db = await initDB();
    
    const offlineSales = await db.count(STORES.OFFLINE_SALES);
    const products = await db.count(STORES.PRODUCTS_CACHE);
    const sales = await db.count(STORES.SALES_CACHE);
    
    return {
      offlineSales,
      products,
      sales,
      total: offlineSales + products + sales
    };
  } catch (error) {
    console.error('❌ Failed to get cache size:', error);
    return { offlineSales: 0, products: 0, sales: 0, total: 0 };
  }
}