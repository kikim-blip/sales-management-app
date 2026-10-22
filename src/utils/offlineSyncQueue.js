// src/utils/offlineSyncQueue.js
/**
 * 네트워크 불안정 시 D1 DB 업데이트 실패 건을 LocalStorage에 안전하게 보존하고,
 * 온라인 상태 복구 시 자동으로 재시도(Retry)하는 오프라인 트랜잭션 큐
 */

const QUEUE_KEY = 'd1_offline_sync_queue';

export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('오프라인 큐 로드 오류:', e);
    return [];
  }
}

export function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('오프라인 큐 저장 오류:', e);
  }
}

export function enqueueOfflineOperation({ type, entityId, payload, title = '' }) {
  const queue = getOfflineQueue();
  const id = `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  
  // 동일 대상(entityId)의 이전 대기 작업이 있다면 최신 페이로드로 대체(Deduplicate)
  const filtered = queue.filter(
    (item) => !(item.type === type && item.entityId === entityId)
  );

  const newOp = {
    id,
    type, // 'UPDATE_JOB_ORDER' | 'UPDATE_SALE'
    entityId,
    payload,
    title: title || payload.title || entityId,
    enqueuedAt: Date.now(),
    retryCount: 0,
  };

  const updatedQueue = [...filtered, newOp];
  saveOfflineQueue(updatedQueue);
  return newOp;
}

export function removeOfflineOperation(opId) {
  const queue = getOfflineQueue();
  const updated = queue.filter((item) => item.id !== opId);
  saveOfflineQueue(updated);
  return updated;
}

let isFlushing = false;

/**
 * 대기 중인 오프라인 큐를 순차적으로 서버에 전송합니다.
 */
export async function flushOfflineSyncQueue({
  updateJobOrderApi,
  updateSaleApi,
  onSyncedItem,
  onError,
}) {
  if (isFlushing) return 0;
  if (!navigator.onLine) return 0;

  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  isFlushing = true;
  let successCount = 0;

  try {
    for (const item of queue) {
      try {
        if (item.type === 'UPDATE_JOB_ORDER' && updateJobOrderApi) {
          await updateJobOrderApi(item.entityId, item.payload);
        } else if (item.type === 'UPDATE_SALE' && updateSaleApi) {
          await updateSaleApi(item.entityId, item.payload);
        }

        // 성공 시 큐에서 제거
        removeOfflineOperation(item.id);
        successCount += 1;
        if (onSyncedItem) onSyncedItem(item);
      } catch (err) {
        console.warn(`[오프라인 큐 재시도 실패: ${item.entityId}]`, err);
        // 재시도 횟수 증가
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = err.message;
        saveOfflineQueue(getOfflineQueue().map(q => q.id === item.id ? item : q));
        if (onError) onError(err, item);
        // 네트워크 에러면 루프 중단 (다음 주기 또는 온라인 이벤트 시 재시도)
        break;
      }
    }
  } finally {
    isFlushing = false;
  }

  return successCount;
}
