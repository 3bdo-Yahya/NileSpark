# BurnCal · NileSpark

Frontend demo: React + TypeScript + Vite + Tailwind CSS v4. Cinematic Earth landing, interactive Explorer and UI foundations.

## التشغيل

Node.js 22.13+ from branch 22, or 24+, and npm 10+.

```powershell
cd O:\NileSpark
npm.cmd install
npm.cmd run dev
```

Open the address printed by Vite, normally http://127.0.0.1:5173.

```powershell
npm.cmd run check
npm.cmd run format:check
npm.cmd run preview
```

Check runs TypeScript, ESLint, 7 tests and a production build.

## الموجود الآن

- Landing بصورة الأرض والنيل وخطوط محلية وحركة تراعي reduced motion.
- Explorer في #/explore، وخريطة فعلية من OpenFreeMap عبر MapLibre.
- تحديد مستطيل بنقطتين، أو إدخال الإحداثيات بالكيبورد، وReset.
- مناطق جاهزة في مصر والبرازيل وأستراليا، واختيار جغرافي مخصص خارجها.
- الفترة والمصدر التجريبي، تقويم شهري وتفاصيل الشهر وتشغيل الشهور وCSV للشهر المحدد.
- loading/cancel/error/retry/empty، ومسح النتائج القديمة عند تغيير الاستعلام.
- الهوية والمكونات في #/foundations ونافذة المصدر والمنهجية والقيود.

## حدود النسخة

الخريطة الجغرافية حقيقية، لكن جميع النقاط والأعداد مولّدة وموسومة SYNTHETIC DEMO. كل صف CSV يصرح بذلك. لا توجد بيانات NASA فعلية أو طلبات تحليل إلى Backend.

الـfixture من 2022 إلى 2025، شاملة يوم البداية والنهاية حسب UTC. وحدة الديمو synthetic records/month، وليست كثافة أو anomaly أو مؤشرًا علميًا معتمدًا. صفر مختلف عن البيانات غير المتاحة. مصدر واحد يعرض في كل مرة؛ VIIRS وMODIS هنا محاكاة للواجهة.

Harmonized يعرض pending ويعطل التحليل لحد ما الفريق يحسم المؤشر والوحدة والمنهجية. الخريطة تحتاج إنترنت وWebGL؛ الإدخال بالإحداثيات والتقويم متاحان عند تعذرها. حدود العرض ±85° latitude، ومن دون مستطيل يعبر خط التاريخ.

## التنظيم والأداء

اتجاه الاعتماد app → features → shared UI. منطق الاستعلام والـfixture منفصلان عن العرض، وMapCanvas يملك محرك الخريطة. AnalysisAdapter للديمو الحالي؛ لا يمثل API contract متفقًا عليه.

Explorer ومحركه والـworker يحملون عند دخوله. الصور WebP متجاوبة والخطوط محلية. حزمة الخريطة كبيرة وتحذيرها موثق في docs/VERIFICATION.md. لم يقس Web Vitals حتى الآن.

راجع docs/ARCHITECTURE.md وdocs/DESIGN_SYSTEM.md وdocs/VERIFICATION.md وdocs/ATTRIBUTION.md.

Figma: https://www.figma.com/design/9gkx5vdSywSJMxdpfB1wdc/

المشروع محلي؛ لم ينشأ Backend أو remote أو commit أو نشر.
