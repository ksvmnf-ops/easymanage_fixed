# EasyManage Desktop for Windows

هذا الغلاف يفتح نسخة **Google Apps Script Web App** داخل تطبيق Windows مستقل باستخدام Electron. لا ينسخ `index.html` محليًا، لأن الواجهة الحالية تعتمد على `google.script.run` الذي توفره بيئة Google Apps Script.

## الإعداد

1. انشر مشروع Google Apps Script كتطبيق ويب من **Deploy > New deployment > Web app**.
2. انسخ `config.example.json` إلى `config.json`.
3. ضع رابط النشر في `gasWebAppUrl` داخل `config.json`.
4. ثبّت الاعتماديات وشغّل التطبيق:

```bash
npm install
npm start
```

## بناء ملف Windows

من Windows أو بيئة تدعم بناء Windows عبر Electron Builder:

```bash
npm install
npm run build:win
```

ستجد ملف التثبيت ونسخة Portable داخل مجلد `dist/`.

يمكن أيضًا تمرير الرابط دون حفظه في الملف:

```bash
EASYMANAGE_GAS_URL="https://script.google.com/macros/s/DEPLOYMENT_ID/exec" npm start
```

## ملاحظات

- يلزم اتصال بالإنترنت لأن البيانات تبقى في Google Sheets.
- إعدادات الوصول في Google Apps Script يجب أن تسمح للمستخدمين المقصودين بالدخول.
- لا تضع مفاتيح سرية داخل `config.json`; المطلوب هنا رابط النشر فقط.
