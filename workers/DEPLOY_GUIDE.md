# D1 마이그레이션 완료 후 실행할 명령어 가이드

## 1단계: Cloudflare 로그인
```powershell
npx wrangler login
```

## 2단계: D1 데이터베이스 생성
```powershell
cd "d:\Antigravity\Sales Receivables Management\workers"
npx wrangler d1 create sales-management-db
```
→ 출력에서 `database_id` 값을 복사하여 `wrangler.toml`의 `PLACEHOLDER_UPDATE_AFTER_CREATE` 부분에 붙여넣기

## 3단계: 스키마 적용 (테이블 생성)
```powershell
npx wrangler d1 execute sales-management-db --file=../workers/schema.sql
```

## 4단계: Workers 배포
```powershell
cd "d:\Antigravity\Sales Receivables Management\workers"
npx wrangler deploy
```
→ 배포 완료 후 `https://sales-management-api.richkikim.workers.dev` 형태의 URL이 출력됨

## 5단계: 프론트엔드 환경변수 업데이트
`.env.local` 파일에 아래 내용 추가:
```
VITE_WORKERS_API_URL=https://sales-management-api.richkikim.workers.dev
```

## 6단계: 프론트엔드 재빌드 및 배포
```powershell
cd "d:\Antigravity\Sales Receivables Management"
npm run build
git add . && git commit -m "feat: migrate from Google Sheets to Cloudflare D1 database" && git push origin main
```

## 확인 명령어
```powershell
# DB 연결 확인
npx wrangler d1 execute sales-management-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# API 동작 확인
curl https://sales-management-api.richkikim.workers.dev/api/batch
```
