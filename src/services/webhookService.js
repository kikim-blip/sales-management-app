// src/services/webhookService.js
const WEBHOOK_URL = import.meta.env.VITE_APPS_SCRIPT_WEBHOOK_URL;

export async function sendWebhookEvent(payload) {
  if (!WEBHOOK_URL) {
    console.log('Webhook URL이 설정되지 않아 연동 전송을 스킵합니다.');
    return;
  }

  try {
    // mode: 'no-cors'로 앱스스크립트 리다이렉트 처리
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });
    console.log('Apps Script Webhook 전송 완료');
  } catch (err) {
    console.error('Webhook 전송 에러:', err);
  }
}