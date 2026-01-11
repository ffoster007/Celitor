# Celitor Backend - Bridge Dependency Analyzer

ระบบวิเคราะห์ความสัมพันธ์ของไฟล์ในโปรเจค (Bridge) สร้างด้วย Golang สำหรับความแม่นยำและประสิทธิภาพสูงสุด

## คุณสมบัติ

- วิเคราะห์ imports/exports สำหรับหลายภาษา (TypeScript, JavaScript, Python, Go, Rust)
- คำนวณความสำคัญของไฟล์จาก:
  - จำนวนไฟล์ที่ import ไฟล์นี้
  - จำนวน exports ที่ไฟล์มี
  - ประเภทของไฟล์ (lib/utils มีความสำคัญมากกว่า)
- แสดง dependencies (ไฟล์ที่ถูก import) และ dependents (ไฟล์ที่ import ไฟล์นี้)

## การใช้งาน

### Local Development

```bash
cd backend/bridge
go run main.go
```

Server จะเริ่มที่ port 8080

### Vercel Deployment

ระบบนี้รองรับการ deploy บน Vercel ผ่าน API Routes ของ Next.js (TypeScript fallback) ที่ `/api/bridge/analyze`

## API Endpoints

### POST /api/bridge/analyze

วิเคราะห์ความสัมพันธ์ของไฟล์

**Request Body:**
```json
{
  "filePath": "src/components/explorer/file-explorer.tsx",
  "owner": "username",
  "repo": "repo-name"
}
```

**Response:**
```json
{
  "sourceFile": {
    "path": "src/components/explorer/file-explorer.tsx",
    "name": "file-explorer.tsx",
    "type": "component",
    "importance": 25,
    "dependencies": [...],
    "exports": ["FileExplorer", "default"],
    "language": "typescript"
  },
  "dependencies": [...],
  "dependents": [...],
  "totalNodes": 15,
  "totalEdges": 14
}
```

## ภาษาที่รองรับ

| Language   | Import Detection | Export Detection |
|------------|-----------------|------------------|
| TypeScript | ✅ ES6, Dynamic, Require | ✅ Named, Default, Type |
| JavaScript | ✅ ES6, Dynamic, Require | ✅ Named, Default, module.exports |
| Python     | ✅ from...import, import | ✅ def, class, variables |
| Go         | ✅ import, multi-import | ✅ exported functions/types |
| Rust       | ✅ use, mod | ✅ pub fn/struct/enum/trait |

## ประเภทไฟล์

ระบบจะระบุประเภทไฟล์อัตโนมัติตามโครงสร้างโปรเจค:

- `component` - ไฟล์ใน `/components/`
- `utility` - ไฟล์ใน `/lib/` หรือ `/utils/`
- `type` - ไฟล์ใน `/types/`
- `api` - ไฟล์ใน `/api/`
- `page` - ไฟล์ `page.tsx` ใน `/app/`
- `config` - ไฟล์ `.config.ts` หรือ `.json`
- `style` - ไฟล์ `.css` หรือ `.scss`
- `external` - package ภายนอก (npm, pip, etc.)
