/**
 * EasyManage — Bootstrap v1
 * إنشاء أوراق Google Sheets والعناوين والإعدادات الأساسية تلقائيًا.
 *
 * طريقة التشغيل:
 * 1) افتح Google Sheet جديدًا.
 * 2) افتح Extensions > Apps Script.
 * 3) أنشئ ملفًا باسم EasyManage_Bootstrap.gs والصق هذا الملف.
 * 4) شغّل setupEasyManage مرة واحدة ووافق على الصلاحيات.
 *
 * ملاحظات:
 * - الدالة قابلة لإعادة التشغيل ولا تمسح السجلات الموجودة.
 * - إذا وجدت ورقة موجودة بعناوين مختلفة، تتوقف العملية برسالة واضحة.
 * - هذه المرحلة تنشئ البنية فقط ولا تنفذ المحاسبة أو حركات المخزون.
 */

const EM_VERSION = '1.0.0';
const EM_DATE_FORMAT = 'yyyy-MM-dd';
const EM_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/**
 * مخطط الأوراق. ترتيب الحقول هو ترتيب الأعمدة في Google Sheets.
 */
const EM_SHEETS = {
  Settings: [
    'id', 'key', 'value', 'valueType', 'scope', 'active',
    'updatedAt', 'updatedBy'
  ],
  Branches: [
    'id', 'branchCode', 'name', 'address', 'phone', 'email', 'logoUrl',
    'barcodeName', 'barcodeCurrency', 'active', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy'
  ],
  Warehouses: [
    'id', 'warehouseCode', 'branchId', 'name', 'address',
    'managerEmployeeId', 'active', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy'
  ],
  Users_Roles: [
    'id', 'username', 'employeeId', 'roleCode', 'permissionsJson',
    'passwordSalt', 'passwordHash', 'active', 'maxDevices', 'lastLoginAt',
    'createdAt', 'updatedAt', 'createdBy', 'updatedBy'
  ],
  Employees: [
    'id', 'employeeCode', 'branchId', 'name', 'birthDate', 'nationalId',
    'maritalStatus', 'qualification', 'jobTitle', 'address', 'phone',
    'mobile', 'commissionRate', 'insuranceStatus', 'notes', 'active',
    'createdAt', 'updatedAt', 'createdBy', 'updatedBy'
  ],
  Customers: [
    'id', 'customerCode', 'name', 'address', 'phone', 'mobile', 'email',
    'discountRate', 'barcode', 'barcodePrintMode', 'managerEmployeeId',
    'vatNumber', 'active', 'notes', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy'
  ],
  Suppliers: [
    'id', 'supplierCode', 'name', 'address', 'phone', 'mobile', 'email',
    'managerEmployeeId', 'vatNumber', 'active', 'notes', 'createdAt',
    'updatedAt', 'createdBy', 'updatedBy'
  ],
  Groups: [
    'id', 'groupCode', 'name', 'parentGroupId', 'active', 'createdAt',
    'updatedAt', 'createdBy', 'updatedBy'
  ],
  Units: [
    'id', 'unitCode', 'name', 'symbol', 'active', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy'
  ],
  Items: [
    'id', 'itemCode', 'barcode', 'name', 'supplierId', 'groupId', 'unitId',
    'reorderLevel', 'purchasePrice', 'salePrice', 'salePriceAfterDiscount',
    'wholesalePrice', 'discountRate', 'imageUrl', 'color', 'size', 'active',
    'notes', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'
  ],
  Sales_Invoices: [
    'id', 'invoiceNumber', 'invoiceDate', 'branchId', 'warehouseId',
    'customerId', 'sellerEmployeeId', 'status', 'paymentType',
    'subtotalGross', 'discountAmount', 'netBeforeVat', 'vatAmount',
    'totalGross', 'currency', 'notes', 'source', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy', 'approvedAt', 'approvedBy', 'cancelledAt',
    'cancelledBy', 'cancelReason'
  ],
  Sales_Lines: [
    'id', 'salesInvoiceId', 'lineNo', 'itemId', 'itemCodeSnapshot',
    'itemNameSnapshot', 'unitId', 'unitNameSnapshot', 'quantity',
    'unitPriceGross', 'grossAmount', 'discountRate', 'discountAmount',
    'netAmountGross', 'imageUrlSnapshot', 'notes'
  ],
  Sales_Returns: [
    'id', 'returnNumber', 'returnDate', 'salesInvoiceId',
    'salesInvoiceNumberSnapshot', 'branchId', 'warehouseId', 'customerId',
    'status', 'subtotalGross', 'discountAmount', 'netBeforeVat', 'vatAmount',
    'totalGross', 'currency', 'reason', 'notes', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy', 'approvedAt', 'approvedBy', 'cancelledAt',
    'cancelledBy', 'cancelReason'
  ],
  Sales_Return_Lines: [
    'id', 'salesReturnId', 'originalSalesLineId', 'lineNo', 'itemId',
    'itemCodeSnapshot', 'itemNameSnapshot', 'unitId', 'unitNameSnapshot',
    'quantity', 'unitPriceGross', 'grossAmount', 'discountAmount',
    'netAmountGross', 'notes'
  ],
  Purchase_Invoices: [
    'id', 'purchaseNumber', 'supplierInvoiceNumber', 'purchaseDate',
    'branchId', 'warehouseId', 'supplierId', 'status', 'paymentType',
    'subtotalGross', 'discountAmount', 'netBeforeVat', 'vatAmount',
    'totalGross', 'currency', 'notes', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy', 'approvedAt', 'approvedBy', 'cancelledAt',
    'cancelledBy', 'cancelReason'
  ],
  Purchase_Lines: [
    'id', 'purchaseInvoiceId', 'lineNo', 'itemId', 'itemCodeSnapshot',
    'itemNameSnapshot', 'unitId', 'unitNameSnapshot', 'quantity',
    'unitPriceGross', 'grossAmount', 'discountRate', 'discountAmount',
    'netAmountGross', 'notes'
  ],
  Purchase_Returns: [
    'id', 'returnNumber', 'returnDate', 'purchaseInvoiceId',
    'purchaseNumberSnapshot', 'branchId', 'warehouseId', 'supplierId',
    'status', 'subtotalGross', 'discountAmount', 'netBeforeVat', 'vatAmount',
    'totalGross', 'currency', 'reason', 'notes', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy', 'approvedAt', 'approvedBy', 'cancelledAt',
    'cancelledBy', 'cancelReason'
  ],
  Purchase_Return_Lines: [
    'id', 'purchaseReturnId', 'originalPurchaseLineId', 'lineNo', 'itemId',
    'itemCodeSnapshot', 'itemNameSnapshot', 'unitId', 'unitNameSnapshot',
    'quantity', 'unitPriceGross', 'grossAmount', 'discountAmount',
    'netAmountGross', 'notes'
  ],
  Audit_Log: [
    'id', 'timestamp', 'userId', 'username', 'action', 'entityType',
    'entityId', 'entityNumber', 'beforeJson', 'afterJson', 'reason',
    'ipOrDevice'
  ],
  Sequences: [
    'id', 'documentType', 'prefix', 'nextNumber', 'padding', 'active',
    'updatedAt', 'updatedBy'
  ],
  Import_Staging: [
    'id', 'importBatchId', 'importType', 'rowNumber', 'rawJson',
    'normalizedJson', 'validationStatus', 'validationErrors', 'createdAt',
    'createdBy', 'processedAt'
  ]
};

const EM_STATUS_VALUES = ['draft', 'approved', 'cancelled'];
const EM_ACTIVE_VALUES = ['on', 'off'];
const EM_PAYMENT_VALUES = ['cash', 'card', 'credit', 'mixed'];
const EM_VALUE_TYPES = ['text', 'number', 'boolean', 'json'];
const EM_SCOPES = ['global', 'branch', 'user'];

/**
 * نقطة التشغيل الرئيسية.
 */
function setupEasyManage() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('افتح Google Sheet مرتبطًا بهذا المشروع أولًا.');

    Object.keys(EM_SHEETS).forEach(function(name) {
      ensureSheet_(ss, name, EM_SHEETS[name]);
    });

    configureSheets_(ss);
    seedSettings_(ss);
    seedSequences_(ss);
    seedSystemMetadata_(ss);
    createNamedRanges_(ss);

    SpreadsheetApp.flush();
    Logger.log('EasyManage setup completed: ' + EM_VERSION);
    return {
      ok: true,
      version: EM_VERSION,
      spreadsheetId: ss.getId(),
      sheets: Object.keys(EM_SHEETS)
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * إنشاء قائمة في واجهة Google Sheets.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('EasyManage')
    .addItem('تهيئة النظام / تحديث الأوراق', 'setupEasyManage')
    .addItem('فحص بنية الأوراق', 'validateEasyManageSchema')
    .addToUi();
}

/**
 * إنشاء ورقة جديدة أو التحقق من ورقة موجودة.
 */
function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  if (sh.getMaxColumns() < headers.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  }

  const current = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasAnyHeader = current.some(function(value) {
    return String(value || '').trim() !== '';
  });

  if (hasAnyHeader && !sameArray_(current, headers)) {
    throw new Error(
      'عناوين الورقة "' + name + '" مختلفة عن المخطط. ' +
      'راجع الصف الأول يدويًا قبل المتابعة.'
    );
  }

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#0f766e')
    .setHorizontalAlignment('center');
  sh.setTabColor('#0f766e');
  sh.getRange(1, 1, sh.getMaxRows(), headers.length)
    .setVerticalAlignment('middle');
  sh.autoResizeColumns(1, headers.length);
}

function sameArray_(a, b) {
  if (a.length !== b.length) return false;
  return a.every(function(value, index) {
    return String(value || '').trim() === String(b[index]).trim();
  });
}

/**
 * تنسيقات عامة وقيود إدخال أساسية.
 */
function configureSheets_(ss) {
  Object.keys(EM_SHEETS).forEach(function(name) {
    const sh = ss.getSheetByName(name);
    const headers = EM_SHEETS[name];
    const maxRows = Math.max(sh.getMaxRows(), 2);
    const range = sh.getRange(2, 1, maxRows - 1, headers.length);

    // إبقاء المفاتيح والتواريخ كنصوص حتى لا تتغير الأصفار أو الصيغ.
    range.setNumberFormat('@');

    applyValidationByHeader_(sh, headers, 'status', EM_STATUS_VALUES);
    applyValidationByHeader_(sh, headers, 'active', EM_ACTIVE_VALUES);
    applyValidationByHeader_(sh, headers, 'paymentType', EM_PAYMENT_VALUES);
    applyValidationByHeader_(sh, headers, 'valueType', EM_VALUE_TYPES);
    applyValidationByHeader_(sh, headers, 'scope', EM_SCOPES);

    applyDateFormat_(sh, headers, [
      'invoiceDate', 'returnDate', 'purchaseDate', 'birthDate'
    ], EM_DATE_FORMAT);
    applyDateFormat_(sh, headers, [
      'createdAt', 'updatedAt', 'approvedAt', 'cancelledAt',
      'lastLoginAt', 'timestamp', 'processedAt'
    ], EM_DATETIME_FORMAT);

    applyNumberFormat_(sh, headers, [
      'commissionRate', 'discountRate', 'reorderLevel', 'purchasePrice',
      'salePrice', 'salePriceAfterDiscount', 'wholesalePrice', 'quantity',
      'unitPriceGross', 'grossAmount', 'discountAmount', 'netAmountGross',
      'subtotalGross', 'netBeforeVat', 'vatAmount', 'totalGross', 'vatRate',
      'nextNumber', 'padding', 'rowNumber'
    ], '0.00');
  });

  // جعل ورقة السجل والمكان المؤقت للبيانات أقل بروزًا للمستخدم.
  ss.getSheetByName('Audit_Log').setTabColor('#6b7280');
  ss.getSheetByName('Import_Staging').setTabColor('#f59e0b');
  ss.getSheetByName('Sequences').setTabColor('#2563eb');
}

function applyValidationByHeader_(sh, headers, header, values) {
  const index = headers.indexOf(header);
  if (index < 0) return;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sh.getRange(2, index + 1, Math.max(sh.getMaxRows() - 1, 1), 1)
    .setDataValidation(rule);
}

function applyDateFormat_(sh, headers, names, format) {
  names.forEach(function(name) {
    const index = headers.indexOf(name);
    if (index >= 0) {
      sh.getRange(2, index + 1, Math.max(sh.getMaxRows() - 1, 1), 1)
        .setNumberFormat(format);
    }
  });
}

function applyNumberFormat_(sh, headers, names, format) {
  names.forEach(function(name) {
    const index = headers.indexOf(name);
    if (index >= 0) {
      sh.getRange(2, index + 1, Math.max(sh.getMaxRows() - 1, 1), 1)
        .setNumberFormat(format);
    }
  });
}

/**
 * الإعدادات الأولية. لا يتم استبدال قيمة سبق أن عدّلها المستخدم.
 */
function seedSettings_(ss) {
  const defaults = [
    ['companyName', '', 'text', 'global'],
    ['companyLogo', '', 'text', 'global'],
    ['companyAddress', '', 'text', 'global'],
    ['companyPhone', '', 'text', 'global'],
    ['companyEmail', '', 'text', 'global'],
    ['currency', 'ر.س', 'text', 'global'],
    ['vatRate', '15', 'number', 'global'],
    ['priceIncludesVat', 'true', 'boolean', 'global'],
    ['salesInvoicePrefix', 'SI-', 'text', 'global'],
    ['salesReturnPrefix', 'SR-', 'text', 'global'],
    ['purchaseInvoicePrefix', 'PI-', 'text', 'global'],
    ['purchaseReturnPrefix', 'PR-', 'text', 'global'],
    ['salesStartNumber', '1', 'number', 'global'],
    ['purchaseStartNumber', '1', 'number', 'global'],
    ['returnStartNumber', '1', 'number', 'global'],
    ['invoicePaper', 'A4', 'text', 'global'],
    ['showSeller', 'true', 'boolean', 'global'],
    ['showCustomer', 'true', 'boolean', 'global'],
    ['showItemImage', 'false', 'boolean', 'global'],
    ['requiredCustomerOnSale', 'false', 'boolean', 'global'],
    ['autoPrintSales', 'false', 'boolean', 'global'],
    ['autoPrintSalesReturn', 'false', 'boolean', 'global'],
    ['autoPrintPurchase', 'false', 'boolean', 'global'],
    ['autoPrintPurchaseReturn', 'false', 'boolean', 'global'],
    ['language', 'ar', 'text', 'global'],
    ['timezone', Session.getScriptTimeZone() || 'Asia/Riyadh', 'text', 'global']
  ];

  const sh = ss.getSheetByName('Settings');
  const existing = readColumnValues_(sh, 2);
  const now = formatDateTime_(new Date());
  const rows = [];

  defaults.forEach(function(item) {
    const key = item[0];
    if (existing[key]) return;
    rows.push([
      Utilities.getUuid(), key, item[1], item[2], item[3], 'on', now, 'system'
    ]);
  });

  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, EM_SHEETS.Settings.length)
      .setValues(rows);
  }
}

/**
 * أرقام المستندات الأولية.
 */
function seedSequences_(ss) {
  const defaults = [
    ['sales_invoice', 'SI-', 1, 6],
    ['sales_return', 'SR-', 1, 6],
    ['purchase_invoice', 'PI-', 1, 6],
    ['purchase_return', 'PR-', 1, 6]
  ];
  const sh = ss.getSheetByName('Sequences');
  const existing = readColumnValues_(sh, 2);
  const now = formatDateTime_(new Date());
  const rows = [];

  defaults.forEach(function(item) {
    if (existing[item[0]]) return;
    rows.push([
      Utilities.getUuid(), item[0], item[1], item[2], item[3], 'on', now, 'system'
    ]);
  });

  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, EM_SHEETS.Sequences.length)
      .setValues(rows);
  }
}

/**
 * معلومات النظام داخل PropertiesService حتى لا تعتمد على صف قابل للتعديل.
 */
function seedSystemMetadata_(ss) {
  const props = PropertiesService.getDocumentProperties();
  props.setProperty('EASYMANAGE_VERSION', EM_VERSION);
  props.setProperty('EASYMANAGE_SPREADSHEET_ID', ss.getId());
  props.setProperty('EASYMANAGE_INITIALIZED_AT', props.getProperty('EASYMANAGE_INITIALIZED_AT') || formatDateTime_(new Date()));
}

/**
 * أسماء نطاقات مفيدة للواجهة والتقارير.
 */
function createNamedRanges_(ss) {
  const settings = ss.getSheetByName('Settings');
  const sequences = ss.getSheetByName('Sequences');
  setNamedRange_(ss, 'EM_Settings', settings.getRange('A:H'));
  setNamedRange_(ss, 'EM_Sequences', sequences.getRange('A:H'));
}

function setNamedRange_(ss, name, range) {
  const old = ss.getRangeByName(name);
  if (old) ss.removeNamedRange(name);
  ss.setNamedRange(name, range);
}

function readColumnValues_(sh, columnNumber) {
  const result = {};
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return result;
  sh.getRange(2, columnNumber, lastRow - 1, 1).getValues().forEach(function(row) {
    const value = String(row[0] || '').trim();
    if (value) result[value] = true;
  });
  return result;
}

function formatDateTime_(date) {
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone() || 'Asia/Riyadh',
    EM_DATETIME_FORMAT
  );
}

/**
 * فحص سريع للبنية دون تعديل البيانات.
 */
function validateEasyManageSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const missing = [];
  const wrong = [];

  Object.keys(EM_SHEETS).forEach(function(name) {
    const sh = ss.getSheetByName(name);
    if (!sh) {
      missing.push(name);
      return;
    }
    const actual = sh.getRange(1, 1, 1, EM_SHEETS[name].length).getValues()[0];
    if (!sameArray_(actual, EM_SHEETS[name])) wrong.push(name);
  });

  const result = {
    ok: missing.length === 0 && wrong.length === 0,
    missingSheets: missing,
    wrongHeaders: wrong,
    version: PropertiesService.getDocumentProperties().getProperty('EASYMANAGE_VERSION') || ''
  };

  Logger.log(JSON.stringify(result, null, 2));
  SpreadsheetApp.getUi().alert(
    result.ok
      ? 'بنية EasyManage صحيحة.'
      : 'توجد مشكلات في البنية. راجع سجل التنفيذ لمعرفة التفاصيل.'
  );
  return result;
}
/**
 * EasyManage — Data Layer v1
 * يعتمد على EasyManage_Bootstrap.gs.
 *
 * يوفر:
 * - معرفات داخلية ثابتة.
 * - تحققًا مركزيًا من الحقول والتكرار والعلاقات.
 * - إدارة المخازن.
 * - إنشاء وتعديل مسودات المستندات.
 * - اعتماد وإلغاء فواتير البيع والشراء والمرتجعات.
 * - توليد أرقام المستندات بقفل متزامن.
 * - حركات مخزون مرتبطة بالمستند الأصلي.
 *
 * تنبيه:
 * يجب تشغيل setupEasyManageDataLayer مرة واحدة بعد لصق هذا الملف.
 */

const EM_INVENTORY_SHEET = 'Inventory_Transactions';
const EM_INVENTORY_HEADERS = [
  'id', 'transactionDate', 'transactionType', 'sourceType', 'sourceId',
  'sourceNumber', 'originalInvoiceId', 'branchId', 'warehouseId', 'itemId',
  'itemCodeSnapshot', 'itemNameSnapshot', 'quantityIn', 'quantityOut',
  'unitCostGross', 'currency', 'notes', 'createdAt', 'createdBy'
];

const EM_DOCUMENTS = {
  sales_invoice: {
    sheet: 'Sales_Invoices',
    linesSheet: 'Sales_Lines',
    numberField: 'invoiceNumber',
    dateField: 'invoiceDate',
    prefixSetting: 'salesInvoicePrefix',
    sequence: 'sales_invoice',
    direction: 'out',
    lineParent: 'salesInvoiceId',
    return: false
  },
  sales_return: {
    sheet: 'Sales_Returns',
    linesSheet: 'Sales_Return_Lines',
    numberField: 'returnNumber',
    dateField: 'returnDate',
    prefixSetting: 'salesReturnPrefix',
    sequence: 'sales_return',
    direction: 'in',
    lineParent: 'salesReturnId',
    return: true,
    originalField: 'salesInvoiceId',
    originalLineField: 'originalSalesLineId'
  },
  purchase_invoice: {
    sheet: 'Purchase_Invoices',
    linesSheet: 'Purchase_Lines',
    numberField: 'purchaseNumber',
    dateField: 'purchaseDate',
    prefixSetting: 'purchaseInvoicePrefix',
    sequence: 'purchase_invoice',
    direction: 'in',
    lineParent: 'purchaseInvoiceId',
    return: false
  },
  purchase_return: {
    sheet: 'Purchase_Returns',
    linesSheet: 'Purchase_Return_Lines',
    numberField: 'returnNumber',
    dateField: 'returnDate',
    prefixSetting: 'purchaseReturnPrefix',
    sequence: 'purchase_return',
    direction: 'out',
    lineParent: 'purchaseReturnId',
    return: true,
    originalField: 'purchaseInvoiceId',
    originalLineField: 'originalPurchaseLineId'
  }
};

const EM_REQUIRED = {
  Branches: ['branchCode', 'name'],
  Warehouses: ['warehouseCode', 'branchId', 'name'],
  Employees: ['name'],
  Customers: ['name'],
  Suppliers: ['name'],
  Groups: ['name'],
  Units: ['name'],
  Items: ['itemCode', 'name', 'unitId'],
  Sales_Invoices: ['invoiceDate', 'branchId', 'warehouseId', 'status'],
  Purchase_Invoices: ['purchaseDate', 'branchId', 'warehouseId', 'supplierId', 'status'],
  Sales_Returns: ['returnDate', 'salesInvoiceId', 'branchId', 'warehouseId', 'status'],
  Purchase_Returns: ['returnDate', 'purchaseInvoiceId', 'branchId', 'warehouseId', 'status']
};

/** ينشئ ورقة حركات المخزون ويضيفها إلى البنية الحالية. */
function setupEasyManageDataLayer() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureExtraSheet_(ss, EM_INVENTORY_SHEET, EM_INVENTORY_HEADERS);
    const props = PropertiesService.getDocumentProperties();
    props.setProperty('EASYMANAGE_STOCK_LAYER_VERSION', '1.0.0');
    SpreadsheetApp.flush();
    return { ok: true, sheet: EM_INVENTORY_SHEET, version: '1.0.0' };
  } finally {
    lock.releaseLock();
  }
}

function ensureExtraSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getMaxColumns() < headers.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  }
  const current = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeader = current.some(function(v) { return String(v || '').trim() !== ''; });
  if (hasHeader && !sameArray_(current, headers)) {
    throw new Error('عناوين الورقة "' + name + '" لا تطابق مخطط حركات المخزون.');
  }
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#2563eb');
  sh.setTabColor('#2563eb');
  sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), headers.length)
    .setNumberFormat('@');
}

function emNow_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Asia/Riyadh',
    EM_DATETIME_FORMAT
  );
}

function emToday_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Asia/Riyadh',
    EM_DATE_FORMAT
  );
}

function emId_() {
  return Utilities.getUuid();
}

function emActor_(actor) {
  if (!actor) return { id: 'system', name: 'system' };
  if (typeof actor === 'string') return { id: actor, name: actor };
  return { id: String(actor.id || 'system'), name: String(actor.name || actor.username || 'system') };
}

function emHeaders_(sheetName) {
  if (sheetName === EM_INVENTORY_SHEET) return EM_INVENTORY_HEADERS;
  if (typeof EM_EXTRA_HEADERS !== 'undefined' && EM_EXTRA_HEADERS[sheetName]) return EM_EXTRA_HEADERS[sheetName];
  if (!EM_SHEETS[sheetName]) throw new Error('ورقة غير معرفة في المخطط: ' + sheetName);
  return EM_SHEETS[sheetName];
}

function emSheet_(sheetName) {
  if (sheetName === 'Customers') emEnsureCustomerBirthCol_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(sheetName);
  if (!sh) {
    if (sheetName === EM_INVENTORY_SHEET) {
      ensureExtraSheet_(ss, sheetName, EM_INVENTORY_HEADERS);
    } else if (typeof EM_EXTRA_HEADERS !== 'undefined' && EM_EXTRA_HEADERS[sheetName]) {
      const headers = EM_EXTRA_HEADERS[sheetName];
      sh = ss.insertSheet(sheetName);
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else if (EM_SHEETS[sheetName]) {
      ensureSheet_(ss, sheetName, EM_SHEETS[sheetName]);
    } else {
      throw new Error('الورقة غير موجودة: ' + sheetName);
    }
    sh = ss.getSheetByName(sheetName);
  }
  return sh;
}

function emReadAll_(sheetName) {
  const sh = emSheet_(sheetName);
  const headers = emHeaders_(sheetName);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, headers.length).getValues().map(function(row) {
    const obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i] instanceof Date
        ? Utilities.formatDate(row[i], Session.getScriptTimeZone() || 'Asia/Riyadh', EM_DATETIME_FORMAT)
        : row[i];
    });
    return obj;
  });
}

function emFindById_(sheetName, id) {
  const value = String(id || '').trim();
  if (!value) return null;
  return emReadAll_(sheetName).find(function(row) { return String(row.id) === value; }) || null;
}

function emAppend_(sheetName, object) {
  const sh = emSheet_(sheetName);
  const headers = emHeaders_(sheetName);
  sh.appendRow(headers.map(function(header) {
    return object[header] === undefined ? '' : object[header];
  }));
  return object;
}

function emUpdateById_(sheetName, id, object) {
  const sh = emSheet_(sheetName);
  const headers = emHeaders_(sheetName);
  const n = sh.getLastRow() - 1;
  if (n < 1) throw new Error('السجل غير موجود: ' + id);
  const ids = sh.getRange(2, 1, n, 1).getValues().map(function(row) { return String(row[0]); });
  const index = ids.indexOf(String(id));
  if (index < 0) throw new Error('السجل غير موجود: ' + id);
  sh.getRange(index + 2, 1, 1, headers.length).setValues([
    headers.map(function(header) {
      return object[header] === undefined ? '' : object[header];
    })
  ]);
  return object;
}

function emRequired_(object, sheetName) {
  (EM_REQUIRED[sheetName] || []).forEach(function(field) {
    if (object[field] === undefined || object[field] === null || String(object[field]).trim() === '') {
      throw new Error('الحقل مطلوب في ' + sheetName + ': ' + field);
    }
  });
}

function emNumber_(value, field, allowZero) {
  const n = Number(value);
  if (!isFinite(n) || (allowZero ? n < 0 : n <= 0)) {
    throw new Error('قيمة رقمية غير صحيحة: ' + field);
  }
  return Math.round(n * 10000) / 10000;
}

function emOptionalNumber_(value, field) {
  if (value === '' || value === null || value === undefined) return '';
  return emNumber_(value, field, true);
}

function emStatus_(status) {
  const value = String(status || 'draft');
  if (EM_STATUS_VALUES.indexOf(value) < 0) {
    throw new Error('حالة المستند غير صحيحة: ' + value);
  }
  return value;
}

function emActive_(value) {
  return value === false || String(value) === 'off' ? 'off' : 'on';
}

function emValidateDate_(value, field) {
  const date = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('التاريخ غير صحيح في ' + field + ': استخدم yyyy-MM-dd');
  }
  return date;
}

function emEnsureUnique_(sheetName, field, value, excludeId) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return;
  const duplicate = emReadAll_(sheetName).some(function(row) {
    return String(row.id) !== String(excludeId || '') &&
      String(row[field] || '').trim().toLowerCase() === normalized;
  });
  if (duplicate) throw new Error('القيمة مستخدمة مسبقًا في ' + sheetName + ': ' + field);
}

function emEnsureActiveBranch_(branchId) {
  const branch = emFindById_('Branches', branchId);
  if (!branch || branch.active !== 'on') throw new Error('الفرع غير موجود أو غير نشط.');
  return branch;
}

function emEnsureActiveWarehouse_(warehouseId, branchId) {
  const warehouse = emFindById_('Warehouses', warehouseId);
  if (!warehouse || warehouse.active !== 'on') throw new Error('المخزن غير موجود أو غير نشط.');
  if (branchId && String(warehouse.branchId) !== String(branchId)) {
    throw new Error('المخزن لا يتبع الفرع المحدد.');
  }
  return warehouse;
}

function emEnsureActiveItem_(itemId) {
  const item = emFindById_('Items', itemId);
  if (!item || item.active !== 'on') throw new Error('الصنف غير موجود أو غير نشط: ' + itemId);
  return item;
}

/** إدارة المخازن */
function createWarehouse(input, actor) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    input = input || {};
    emRequired_(input, 'Warehouses');
    emEnsureActiveBranch_(input.branchId);
    emEnsureUnique_('Warehouses', 'warehouseCode', input.warehouseCode);
    const now = emNow_();
    const user = emActor_(actor);
    const row = {
      id: emId_(),
      warehouseCode: String(input.warehouseCode).trim(),
      branchId: String(input.branchId),
      name: String(input.name).trim(),
      address: String(input.address || '').trim(),
      managerEmployeeId: String(input.managerEmployeeId || ''),
      active: emActive_(input.active),
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      updatedBy: user.id
    };
    emAppend_('Warehouses', row);
    emAudit_('create', 'Warehouses', row.id, row.warehouseCode, null, row, user);
    return row;
  } finally {
    lock.releaseLock();
  }
}

function updateWarehouse(id, patch, actor) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const old = emFindById_('Warehouses', id);
    if (!old) throw new Error('المخزن غير موجود.');
    patch = patch || {};
    const row = Object.assign({}, old, patch, { id: old.id });
    emRequired_(row, 'Warehouses');
    emEnsureActiveBranch_(row.branchId);
    emEnsureUnique_('Warehouses', 'warehouseCode', row.warehouseCode, id);
    const user = emActor_(actor);
    row.warehouseCode = String(row.warehouseCode).trim();
    row.name = String(row.name).trim();
    row.active = emActive_(row.active);
    row.updatedAt = emNow_();
    row.updatedBy = user.id;
    emUpdateById_('Warehouses', id, row);
    emAudit_('update', 'Warehouses', id, row.warehouseCode, old, row, user);
    return row;
  } finally {
    lock.releaseLock();
  }
}

function listWarehouses(branchId, includeInactive) {
  return emReadAll_('Warehouses').filter(function(row) {
    return (!branchId || String(row.branchId) === String(branchId)) &&
      (includeInactive || row.active === 'on');
  });
}

/** طبقة حفظ عامة للبيانات الأساسية. */
function createMasterRecord(sheetName, input, actor) {
  const allowed = ['Branches', 'Employees', 'Customers', 'Suppliers', 'Groups', 'Units', 'Items'];
  if (allowed.indexOf(sheetName) < 0) throw new Error('ورقة غير مسموح بها: ' + sheetName);
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    input = input || {};
    emRequired_(input, sheetName);
    const uniqueFields = {
      Branches: 'branchCode', Customers: 'customerCode', Suppliers: 'supplierCode',
      Employees: 'employeeCode', Groups: 'groupCode', Units: 'unitCode',
      Items: 'itemCode'
    };
    const uniqueField = uniqueFields[sheetName];
    if (uniqueField && input[uniqueField]) emEnsureUnique_(sheetName, uniqueField, input[uniqueField]);
    if (sheetName === 'Items') {
      emOptionalNumber_(input.reorderLevel, 'reorderLevel');
      emOptionalNumber_(input.purchasePrice, 'purchasePrice');
      emOptionalNumber_(input.salePrice, 'salePrice');
      emOptionalNumber_(input.salePriceAfterDiscount, 'salePriceAfterDiscount');
      emOptionalNumber_(input.wholesalePrice, 'wholesalePrice');
      emOptionalNumber_(input.discountRate, 'discountRate');
    }
    const user = emActor_(actor);
    const now = emNow_();
    const headers = emHeaders_(sheetName);
    const row = { id: emId_() };
    headers.forEach(function(header) { if (input[header] !== undefined) row[header] = input[header]; });
    row.active = emActive_(row.active);
    row.createdAt = now;
    row.updatedAt = now;
    row.createdBy = user.id;
    row.updatedBy = user.id;
    emAppend_(sheetName, row);
    emAudit_('create', sheetName, row.id, row[uniqueField] || row.name, null, row, user);
    return row;
  } finally {
    lock.releaseLock();
  }
}

/** حفظ فاتورة أو مرتجع كمسودة. */
function saveDocumentDraft(documentType, headerInput, linesInput, actor) {
  const cfg = EM_DOCUMENTS[documentType];
  if (!cfg) throw new Error('نوع المستند غير معروف: ' + documentType);
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const header = Object.assign({}, headerInput || {});
    const lines = Array.isArray(linesInput) ? linesInput : [];
    const user = emActor_(actor);
    validateDocumentDraft_(documentType, header, lines);
    const now = emNow_();
    const id = header.id || emId_();
    const old = header.id ? emFindById_(cfg.sheet, header.id) : null;
    if (old && old.status !== 'draft') throw new Error('لا يمكن تعديل مستند غير مسودة.');
    const number = old && old[cfg.numberField]
      ? old[cfg.numberField]
      : nextDocumentNumber_(cfg.sequence, cfg.prefixSetting);
    const row = buildDocumentHeader_(documentType, header, id, number, now, user, old);
    if (old) emUpdateById_(cfg.sheet, id, row); else emAppend_(cfg.sheet, row);
    replaceDocumentLines_(cfg, id, lines, user, old);
    emAudit_(old ? 'update' : 'create', cfg.sheet, id, number, old, row, user);
    return { header: row, lines: getDocumentLines_(cfg, id) };
  } finally {
    lock.releaseLock();
  }
}

function validateDocumentDraft_(documentType, header, lines) {
  const cfg = EM_DOCUMENTS[documentType];
  emRequired_(Object.assign({}, header, { status: header.status || 'draft' }), cfg.sheet);
  if (header.status && emStatus_(header.status) !== 'draft') {
    throw new Error('الحفظ بهذه الدالة مخصص للمسودة فقط.');
  }
  emValidateDate_(header[cfg.dateField], cfg.dateField);
  emEnsureActiveBranch_(header.branchId);
  emEnsureActiveWarehouse_(header.warehouseId, header.branchId);
  if (cfg.sheet === 'Sales_Invoices' && header.customerId) {
    requireActiveRecord_('Customers', header.customerId, 'العميل');
  }
  if (cfg.sheet === 'Purchase_Invoices') {
    requireActiveRecord_('Suppliers', header.supplierId, 'المورد');
  }
  if (cfg.return) {
    const original = emFindById_(EM_DOCUMENTS[documentType].sheet === 'Sales_Returns' ? 'Sales_Invoices' : 'Purchase_Invoices', header[cfg.originalField]);
    if (!original) throw new Error('الفاتورة الأصلية غير موجودة.');
    if (original.status !== 'approved') throw new Error('لا يمكن إنشاء مرتجع إلا من فاتورة معتمدة.');
  }
  if (!lines.length) throw new Error('يجب إضافة سطر واحد على الأقل.');
  lines.forEach(function(line, index) {
    emEnsureActiveItem_(line.itemId);
    emNumber_(line.quantity, 'quantity في السطر ' + (index + 1), false);
    emNumber_(line.unitPriceGross, 'unitPriceGross في السطر ' + (index + 1), true);
    if (cfg.return && !line[cfg.originalLineField]) {
      throw new Error('السطر ' + (index + 1) + ' يجب أن يرتبط بسطر الفاتورة الأصلية.');
    }
  });
}

function buildDocumentHeader_(documentType, input, id, number, now, user, old) {
  const cfg = EM_DOCUMENTS[documentType];
  const headers = emHeaders_(cfg.sheet);
  const row = {};
  headers.forEach(function(field) {
    if (input[field] !== undefined) row[field] = input[field];
    else if (old && old[field] !== undefined) row[field] = old[field];
    else row[field] = '';
  });
  row.id = id;
  row[cfg.numberField] = number;
  row.status = 'draft';
  row[cfg.dateField] = input[cfg.dateField] || (old && old[cfg.dateField]) || emToday_();
  row.currency = input.currency || (old && old.currency) || getSetting_('currency', 'ر.س');
  row.createdAt = old ? old.createdAt : now;
  row.createdBy = old ? old.createdBy : user.id;
  row.updatedAt = now;
  row.updatedBy = user.id;
  return row;
}

function replaceDocumentLines_(cfg, parentId, lines, user, oldHeader) {
  const sh = emSheet_(cfg.linesSheet);
  const headers = emHeaders_(cfg.linesSheet);
  const n = sh.getLastRow() - 1;
  if (n > 0) {
    const values = sh.getRange(2, 1, n, headers.length).getValues();
    const parentIndex = headers.indexOf(cfg.lineParent);
    for (let i = values.length - 1; i >= 0; i--) {
      if (String(values[i][parentIndex]) === String(parentId)) sh.deleteRow(i + 2);
    }
  }
  lines.forEach(function(input, index) {
    const item = emEnsureActiveItem_(input.itemId);
    const row = {};
    headers.forEach(function(field) { row[field] = input[field] === undefined ? '' : input[field]; });
    const quantity = emNumber_(input.quantity, 'quantity', false);
    const price = emNumber_(input.unitPriceGross, 'unitPriceGross', true);
    const gross = round2_(quantity * price);
    const discountRate = input.discountRate === '' || input.discountRate === undefined ? 0 : emNumber_(input.discountRate, 'discountRate', true);
    if (discountRate > 100) throw new Error('نسبة الخصم أكبر من 100%.');
    const discount = round2_(gross * discountRate / 100);
    row.id = emId_();
    row[cfg.lineParent] = parentId;
    row.lineNo = index + 1;
    row.itemId = item.id;
    row.itemCodeSnapshot = item.itemCode;
    row.itemNameSnapshot = item.name;
    row.unitId = item.unitId;
    row.unitNameSnapshot = findName_('Units', item.unitId);
    row.quantity = quantity;
    row.unitPriceGross = price;
    row.grossAmount = gross;
    row.discountRate = discountRate;
    row.discountAmount = discount;
    row.netAmountGross = round2_(gross - discount);
    emAppend_(cfg.linesSheet, row);
  });
}

function getDocumentLines_(cfg, parentId) {
  return emReadAll_(cfg.linesSheet).filter(function(row) {
    return String(row[cfg.lineParent]) === String(parentId);
  }).sort(function(a, b) { return Number(a.lineNo) - Number(b.lineNo); });
}

/** اعتماد مستند وإنشاء حركات المخزون المرتبطة به. */
function approveDocument(documentType, id, actor) {
  const cfg = EM_DOCUMENTS[documentType];
  if (!cfg) throw new Error('نوع المستند غير معروف.');
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const header = emFindById_(cfg.sheet, id);
    if (!header) throw new Error('المستند غير موجود.');
    if (header.status === 'approved') return header;
    if (header.status === 'cancelled') throw new Error('لا يمكن اعتماد مستند ملغى.');
    const lines = getDocumentLines_(cfg, id);
    validateDocumentDraft_(documentType, header, lines);
    const user = emActor_(actor);
    const movements = buildMovementsForDocument_(documentType, header, lines, user);
    const now = emNow_();
    header.status = 'approved';
    header.approvedAt = now;
    header.approvedBy = user.id;
    header.updatedAt = now;
    header.updatedBy = user.id;
    calculateHeaderTotals_(header, lines);
    emUpdateById_(cfg.sheet, id, header);
    movements.forEach(function(movement) { emAppend_(EM_INVENTORY_SHEET, movement); });
    emAudit_('approve', cfg.sheet, id, header[cfg.numberField], null, header, user);
    return { header: header, lines: lines, movements: movements };
  } finally {
    lock.releaseLock();
  }
}

/** إلغاء مستند معتمد وإنشاء حركة عكسية بدل حذف الحركة الأصلية. */
function cancelDocument(documentType, id, reason, actor) {
  const cfg = EM_DOCUMENTS[documentType];
  if (!cfg) throw new Error('نوع المستند غير معروف.');
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const header = emFindById_(cfg.sheet, id);
    if (!header) throw new Error('المستند غير موجود.');
    if (header.status === 'cancelled') return header;
    if (!String(reason || '').trim()) throw new Error('سبب الإلغاء مطلوب.');
    const user = emActor_(actor);
    const lines = getDocumentLines_(cfg, id);
    const originalMovements = emReadAll_(EM_INVENTORY_SHEET).filter(function(m) {
      return String(m.sourceId) === String(id) && String(m.sourceType) === documentType;
    });
    const reversals = originalMovements.map(function(m) {
      const copy = Object.assign({}, m);
      copy.id = emId_();
      copy.transactionDate = emNow_();
      copy.transactionType = 'cancellation_reversal';
      copy.sourceType = documentType + '_cancellation';
      copy.sourceId = id;
      copy.sourceNumber = header[cfg.numberField];
      copy.quantityIn = m.quantityOut || 0;
      copy.quantityOut = m.quantityIn || 0;
      copy.notes = 'عكس مستند ملغى: ' + String(reason).trim();
      copy.createdAt = emNow_();
      copy.createdBy = user.id;
      return copy;
    });
    header.status = 'cancelled';
    header.cancelledAt = emNow_();
    header.cancelledBy = user.id;
    header.cancelReason = String(reason).trim();
    header.updatedAt = emNow_();
    header.updatedBy = user.id;
    emUpdateById_(cfg.sheet, id, header);
    reversals.forEach(function(movement) { emAppend_(EM_INVENTORY_SHEET, movement); });
    emAudit_('cancel', cfg.sheet, id, header[cfg.numberField], null, header, user, reason);
    return { header: header, lines: lines, reversals: reversals };
  } finally {
    lock.releaseLock();
  }
}

function buildMovementsForDocument_(documentType, header, lines, user) {
  const cfg = EM_DOCUMENTS[documentType];
  const movements = [];
  lines.forEach(function(line) {
    const item = emEnsureActiveItem_(line.itemId);
    const quantity = emNumber_(line.quantity, 'quantity', false);
    const movement = {
      id: emId_(),
      transactionDate: emNow_(),
      transactionType: cfg.return ? 'return' : (documentType.indexOf('sales') === 0 ? 'sale' : 'purchase'),
      sourceType: documentType,
      sourceId: header.id,
      sourceNumber: header[cfg.numberField],
      originalInvoiceId: cfg.return ? header[cfg.originalField] : header.id,
      branchId: header.branchId,
      warehouseId: header.warehouseId,
      itemId: item.id,
      itemCodeSnapshot: item.itemCode,
      itemNameSnapshot: item.name,
      quantityIn: cfg.direction === 'in' ? quantity : 0,
      quantityOut: cfg.direction === 'out' ? quantity : 0,
      unitCostGross: emOptionalNumber_(line.unitPriceGross, 'unitPriceGross'),
      currency: header.currency || getSetting_('currency', 'ر.س'),
      notes: '',
      createdAt: emNow_(),
      createdBy: user.id
    };
    movements.push(movement);
  });
  return movements;
}

function calculateHeaderTotals_(header, lines) {
  const gross = round2_(lines.reduce(function(sum, line) { return sum + Number(line.grossAmount || 0); }, 0));
  const discount = round2_(lines.reduce(function(sum, line) { return sum + Number(line.discountAmount || 0); }, 0));
  const total = round2_(lines.reduce(function(sum, line) { return sum + Number(line.netAmountGross || 0); }, 0));
  const vatRate = Number(getSetting_('vatRate', '15')) / 100;
  const netBeforeVat = round2_(total / (1 + vatRate));
  header.subtotalGross = gross;
  header.discountAmount = discount;
  header.totalGross = total;
  header.netBeforeVat = netBeforeVat;
  header.vatAmount = round2_(total - netBeforeVat);
}

/** توليد الرقم التالي مع قفل المستند. */
function nextDocumentNumber_(documentType, prefixSetting) {
  const sh = emSheet_('Sequences');
  const headers = emHeaders_('Sequences');
  const n = sh.getLastRow() - 1;
  const rows = n > 0 ? sh.getRange(2, 1, n, headers.length).getValues() : [];
  const typeIndex = headers.indexOf('documentType');
  const nextIndex = headers.indexOf('nextNumber');
  const prefixIndex = headers.indexOf('prefix');
  const paddingIndex = headers.indexOf('padding');
  const rowIndex = rows.findIndex(function(row) { return String(row[typeIndex]) === String(documentType); });
  const settingPrefix = getSetting_(prefixSetting, '');
  let prefix;
  let next;
  let padding = 6;
  if (rowIndex < 0) {
    prefix = settingPrefix;
    next = 1;
    sh.appendRow([emId_(), documentType, prefix, next + 1, padding, 'on', emNow_(), 'system']);
  } else {
    const rowNumber = rowIndex + 2;
    prefix = String(rows[rowIndex][prefixIndex] || settingPrefix);
    next = Number(rows[rowIndex][nextIndex]) || 1;
    padding = Number(rows[rowIndex][paddingIndex]) || 6;
    sh.getRange(rowNumber, nextIndex + 1).setValue(next + 1);
    sh.getRange(rowNumber, headers.indexOf('updatedAt') + 1).setValue(emNow_());
  }
  return prefix + String(next).padStart(padding, '0');
}

function getSetting_(key, fallback) {
  const row = emReadAll_('Settings').find(function(item) { return String(item.key) === String(key) && item.active !== 'off'; });
  return row ? row.value : fallback;
}

function requireActiveRecord_(sheetName, id, label) {
  const row = emFindById_(sheetName, id);
  if (!row || row.active !== 'on') throw new Error(label + ' غير موجود أو غير نشط.');
  return row;
}

function findName_(sheetName, id) {
  if (!id) return '';
  const row = emFindById_(sheetName, id);
  return row ? row.name : '';
}

function round2_(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function emAudit_(action, entityType, entityId, entityNumber, before, after, actor, reason) {
  const user = emActor_(actor);
  emAppend_('Audit_Log', {
    id: emId_(),
    timestamp: emNow_(),
    userId: user.id,
    username: user.name,
    action: action,
    entityType: entityType,
    entityId: entityId,
    entityNumber: entityNumber || '',
    beforeJson: before ? JSON.stringify(before) : '',
    afterJson: after ? JSON.stringify(after) : '',
    reason: reason || '',
    ipOrDevice: ''
  });
}

/** قراءة رصيد صنف في مخزن من حركات المخزون. */
function getStockBalance(warehouseId, itemId) {
  return emReadAll_(EM_INVENTORY_SHEET)
    .filter(function(row) {
      return String(row.warehouseId) === String(warehouseId) &&
        String(row.itemId) === String(itemId);
    })
    .reduce(function(total, row) {
      return total + Number(row.quantityIn || 0) - Number(row.quantityOut || 0);
    }, 0);
}

/** تقرير أرصدة مخزن أو جميع المخازن. */
function getWarehouseBalances(warehouseId) {
  const balances = {};
  emReadAll_(EM_INVENTORY_SHEET).forEach(function(row) {
    if (warehouseId && String(row.warehouseId) !== String(warehouseId)) return;
    const key = String(row.warehouseId) + '|' + String(row.itemId);
    if (!balances[key]) {
      balances[key] = {
        warehouseId: row.warehouseId,
        itemId: row.itemId,
        itemCode: row.itemCodeSnapshot,
        itemName: row.itemNameSnapshot,
        quantity: 0
      };
    }
    balances[key].quantity += Number(row.quantityIn || 0) - Number(row.quantityOut || 0);
  });
  return Object.keys(balances).map(function(key) { return balances[key]; });
}
/** EasyManage — Web endpoints */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('EasyManage')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getUiData() {
  return {
    branches: emReadAll_('Branches').filter(function(row) { return row.active === 'on'; }),
    warehouses: emReadAll_('Warehouses').filter(function(row) { return row.active === 'on'; }),
    items: emReadAll_('Items').filter(function(row) { return row.active === 'on'; }),
    customers: emReadAll_('Customers').filter(function(row) { return row.active === 'on'; }),
    suppliers: emReadAll_('Suppliers').filter(function(row) { return row.active === 'on'; }),
    units: emReadAll_('Units').filter(function(row) { return row.active === 'on'; }),
    groups: emReadAll_('Groups').filter(function(row) { return row.active === 'on'; })
  };
}

function createWarehouseFromUi(data) {
  return createWarehouse(data, { id: 'web-user', name: 'مستخدم الواجهة' });
}

function saveSalesInvoiceFromUi(header, lines) {
  return saveDocumentDraft('sales_invoice', header, lines, {
    id: 'web-user', name: 'مستخدم الواجهة'
  });
}

function savePurchaseInvoiceFromUi(header, lines) {
  return saveDocumentDraft('purchase_invoice', header, lines, {
    id: 'web-user', name: 'مستخدم الواجهة'
  });
}

function approveDocumentFromUi(documentType, id) {
  return approveDocument(documentType, id, {
    id: 'web-user', name: 'مستخدم الواجهة'
  });
}

function cancelDocumentFromUi(documentType, id, reason) {
  return cancelDocument(documentType, id, reason, {
    id: 'web-user', name: 'مستخدم الواجهة'
  });
}

function testCreateWarehouse() {
  const branches = emReadAll_('Branches');
  let branch = branches.find(function(row) { return row.active === 'on'; });

  if (!branch) {
    branch = createMasterRecord('Branches', {
      branchCode: 'BR-001',
      name: 'الفرع الرئيسي',
      address: '',
      phone: '',
      active: 'on'
    }, { id: 'system', name: 'system' });
  }

  const code = 'WH-' + new Date().getTime();
  const warehouse = createWarehouse({
    warehouseCode: code,
    branchId: branch.id,
    name: 'مخزن اختباري',
    address: '',
    active: 'on'
  }, { id: 'system', name: 'system' });

  Logger.log(JSON.stringify({
    ok: true,
    message: 'تم إنشاء المخزن الاختباري بنجاح',
    warehouse: warehouse
  }, null, 2));
  return warehouse;
}

/** Restored EasyManage extensions */
const EM_EXTRA_HEADERS = {
  Transfers:['id','transferNumber','transferDate','fromBranchId','fromWarehouseId','toBranchId','toWarehouseId','status','notes','createdAt','updatedAt','createdBy','updatedBy','approvedAt','approvedBy'],
  Transfer_Lines:['id','transferId','lineNo','itemId','itemCodeSnapshot','itemNameSnapshot','unitId','unitNameSnapshot','quantity','unitCostGross','notes'],
  Stocktakes:['id','stocktakeNumber','stocktakeDate','branchId','warehouseId','status','notes','createdAt','updatedAt','createdBy','updatedBy','approvedAt','approvedBy'],
  Stocktake_Lines:['id','stocktakeId','lineNo','itemId','itemCodeSnapshot','itemNameSnapshot','systemQuantity','countedQuantity','differenceQuantity','unitCostGross','notes'],
  Cash_Receipts:['id','receiptNumber','receiptDate','cashType','amount','currency','receivedFromType','receivedFromId','receivedFromName','depositAccount','sourceType','sourceId','description','status','createdAt','updatedAt','createdBy','updatedBy','approvedAt','approvedBy'],
  Cash_Payments:['id','paymentNumber','paymentDate','cashType','amount','currency','paidToType','paidToId','paidToName','expenseCategory','sourceType','sourceId','description','status','createdAt','updatedAt','createdBy','updatedBy','approvedAt','approvedBy'],
  Payment_Details:['id','documentType','documentId','paymentType','amount','currency','providerName','cardLast4','voucherNumber','checkNumber','checkDate','bankName','commissionAmount','notes','createdAt','createdBy'],
  Opening_Balances:['id','balanceType','branchId','warehouseId','partyId','itemId','cashAccount','balanceDate','quantity','amount','currency','notes','status','createdAt','createdBy'],
  Colors_Sizes:['id','itemId','variantType','code','name','barcode','active','createdAt','createdBy'],
  Report_Views:['id','viewCode','name','reportType','filtersJson','columnsJson','active','createdAt','updatedAt']
};
function ensureExtraRuntimeSheet_(name){const ss=SpreadsheetApp.getActiveSpreadsheet();let sh=ss.getSheetByName(name);if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,EM_EXTRA_HEADERS[name].length).setValues([EM_EXTRA_HEADERS[name]]);sh.setFrozenRows(1)}return sh}
function ensureExtraHeadersRuntime_(){Object.keys(EM_EXTRA_HEADERS).forEach(ensureExtraRuntimeSheet_)}
function getInvoicesReport(status,fromDate,toDate){const cfg=[['Sales_Invoices','invoiceNumber','invoiceDate','sales_invoice','بيع'],['Purchase_Invoices','purchaseNumber','purchaseDate','purchase_invoice','شراء'],['Sales_Returns','returnNumber','returnDate','sales_return','مرتجع بيع'],['Purchase_Returns','returnNumber','returnDate','purchase_return','مرتجع شراء']];let out=[];cfg.forEach(c=>emReadAll_(c[0]).forEach(r=>{const d=String(r[c[2]]||'').slice(0,10);if((!status||r.status===status)&&(!fromDate||d>=fromDate)&&(!toDate||d<=toDate))out.push({id:r.id,type:c[3],typeLabel:c[4],number:r[c[1]],date:d,status:r.status,totalGross:Number(r.totalGross||0),currency:r.currency||'ر.س',branchId:r.branchId,warehouseId:r.warehouseId})}));return out}
function getDailySalesReport(date,branchId,warehouseId){const rows=getInvoicesReport('approved',date,date).filter(r=>(!branchId||String(r.branchId)===String(branchId))&&(!warehouseId||String(r.warehouseId)===String(warehouseId)));const sales=rows.filter(r=>r.type==='sales_invoice'),returns=rows.filter(r=>r.type==='sales_return');const a=x=>x.reduce((s,r)=>s+Number(r.totalGross||0),0);return {date:date,invoiceCount:sales.length,returnCount:returns.length,totalSales:a(sales),totalReturns:a(returns),netSales:a(sales)-a(returns),byItem:[],invoices:rows}}
function getDailyInventoryReport(date,warehouseId){const out={};emReadAll_(EM_INVENTORY_SHEET).forEach(r=>{if(warehouseId&&String(r.warehouseId)!==String(warehouseId))return;const k=r.warehouseId+'|'+r.itemId;if(!out[k])out[k]={warehouseId:r.warehouseId,itemId:r.itemId,itemCode:r.itemCodeSnapshot,itemName:r.itemNameSnapshot,opening:0,received:0,issued:0,closing:0};const i=String(r.transactionDate||'').slice(0,10)===date;const qin=Number(r.quantityIn||0),qout=Number(r.quantityOut||0);if(i){out[k].received+=qin;out[k].issued+=qout}else out[k].opening+=qin-qout;out[k].closing+=qin-qout});return {date:date,warehouseId:warehouseId||'',rows:Object.keys(out).map(k=>out[k])}}
function getDailyReportsUi(date,branchId,warehouseId){return {sales:getDailySalesReport(date||emToday_(),branchId,warehouseId),inventory:getDailyInventoryReport(date||emToday_(),warehouseId),invoices:getInvoicesReport('',date||emToday_(),date||emToday_())}}
function exportDailyReportCsv(date,branchId,warehouseId){const r=getDailyReportsUi(date,branchId,warehouseId);const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';let a=[['EasyManage',r.sales.date],[],['المؤشر','القيمة'],['المبيعات',r.sales.totalSales],['المرتجعات',r.sales.totalReturns],['الصافي',r.sales.netSales],[],['الصنف','أول','وارد','منصرف','آخر']];r.inventory.rows.forEach(x=>a.push([x.itemName,x.opening,x.received,x.issued,x.closing]));return a.map(x=>x.map(q).join(',')).join('\n')}
function exportDailyReportPdf(date,branchId,warehouseId){const csv=exportDailyReportCsv(date,branchId,warehouseId);const html='<html dir="rtl"><body><h1>EasyManage - تقرير يومي</h1><pre>'+csv.replace(/</g,'&lt;')+'</pre></body></html>';const blob=Utilities.newBlob(html,'text/html','report.html').getAs(MimeType.PDF);return {ok:true,filename:'easymanage-report-'+(date||emToday_())+'.pdf',mimeType:MimeType.PDF,base64:Utilities.base64Encode(blob.getBytes())}}
function testApproveSalesInvoice(){const branches=emReadAll_('Branches').filter(r=>r.active==='on');if(!branches.length)throw new Error('أنشئ فرعًا ومخزنًا وصنفًا قبل الاختبار.');const wh=emReadAll_('Warehouses').find(r=>r.active==='on'&&String(r.branchId)===String(branches[0].id));const item=emReadAll_('Items').find(r=>r.active==='on');if(!wh||!item)throw new Error('أنشئ مخزنًا وصنفًا قبل الاختبار.');const d=saveDocumentDraft('sales_invoice',{invoiceDate:emToday_(),branchId:branches[0].id,warehouseId:wh.id,status:'draft',paymentType:'cash'},[{itemId:item.id,quantity:1,unitPriceGross:10}],{id:'system',name:'system'});const a=approveDocument('sales_invoice',d.header.id,{id:'system',name:'system'});const m=emReadAll_(EM_INVENTORY_SHEET).filter(r=>String(r.sourceId)===String(d.header.id));const result={ok:a.header.status==='approved'&&m.length>0,invoiceId:d.header.id,movementCount:m.length};Logger.log(JSON.stringify(result));return result}
function createTransferFromUi(d){ensureExtraRuntimeSheet_('Transfers');ensureExtraRuntimeSheet_('Transfer_Lines');const id=emId_(),h={id:id,transferNumber:'TR-'+Date.now(),transferDate:d.transferDate||emToday_(),fromBranchId:d.fromBranchId||'',fromWarehouseId:d.fromWarehouseId,toBranchId:d.toBranchId||'',toWarehouseId:d.toWarehouseId,status:'draft',notes:d.notes||'',createdAt:emNow_(),updatedAt:emNow_(),createdBy:'web-user'};emAppend_('Transfers',h);(d.lines||[]).forEach((x,i)=>emAppend_('Transfer_Lines',{id:emId_(),transferId:id,lineNo:i+1,itemId:x.itemId,quantity:Number(x.quantity||0)}));return {header:h}}
function approveTransferFromUi(id){const h=emFindById_('Transfers',id);if(!h)throw new Error('التحويل غير موجود');const lines=emReadAll_('Transfer_Lines').filter(x=>String(x.transferId)===String(id)),mv=[];lines.forEach(x=>{const qty=Number(x.quantity||0);mv.push({id:emId_(),transactionDate:emNow_(),transactionType:'transfer_out',sourceType:'transfer',sourceId:id,branchId:h.fromBranchId,warehouseId:h.fromWarehouseId,itemId:x.itemId,quantityOut:qty,quantityIn:0,createdAt:emNow_()});mv.push({id:emId_(),transactionDate:emNow_(),transactionType:'transfer_in',sourceType:'transfer',sourceId:id,branchId:h.toBranchId,warehouseId:h.toWarehouseId,itemId:x.itemId,quantityOut:0,quantityIn:qty,createdAt:emNow_()})});mv.forEach(x=>emAppend_(EM_INVENTORY_SHEET,x));h.status='approved';h.approvedAt=emNow_();emUpdateById_('Transfers',id,h);return {header:h,movements:mv}}
function createStocktakeFromUi(d){ensureExtraRuntimeSheet_('Stocktakes');ensureExtraRuntimeSheet_('Stocktake_Lines');const id=emId_(),h={id:id,stocktakeNumber:'ST-'+Date.now(),stocktakeDate:d.stocktakeDate||emToday_(),branchId:d.branchId||'',warehouseId:d.warehouseId,status:'draft',createdAt:emNow_(),updatedAt:emNow_(),createdBy:'web-user'};emAppend_('Stocktakes',h);(d.lines||[]).forEach((x,i)=>emAppend_('Stocktake_Lines',{id:emId_(),stocktakeId:id,lineNo:i+1,itemId:x.itemId,countedQuantity:Number(x.countedQuantity||0),systemQuantity:getStockBalance(h.warehouseId,x.itemId),differenceQuantity:0}));return {header:h}}
function approveStocktakeFromUi(id){const h=emFindById_('Stocktakes',id);if(!h)throw new Error('الجرد غير موجود');const lines=emReadAll_('Stocktake_Lines').filter(x=>String(x.stocktakeId)===String(id)),mv=[];lines.forEach(x=>{const diff=Number(x.countedQuantity||0)-getStockBalance(h.warehouseId,x.itemId);if(diff)mv.push({id:emId_(),transactionDate:emNow_(),transactionType:'stocktake_adjustment',sourceType:'stocktake',sourceId:id,branchId:h.branchId,warehouseId:h.warehouseId,itemId:x.itemId,quantityIn:diff>0?diff:0,quantityOut:diff<0?-diff:0,createdAt:emNow_()})});mv.forEach(x=>emAppend_(EM_INVENTORY_SHEET,x));h.status='approved';h.approvedAt=emNow_();emUpdateById_('Stocktakes',id,h);return {header:h,movements:mv}}
function createCashReceiptFromUi(d){ensureExtraRuntimeSheet_('Cash_Receipts');const r={id:emId_(),receiptNumber:'CR-'+Date.now(),receiptDate:d.receiptDate||emToday_(),cashType:d.cashType||'cash',amount:Number(d.amount||0),receivedFromName:d.receivedFromName||'',depositAccount:d.depositAccount||'',description:d.description||'',status:'approved',createdAt:emNow_(),approvedAt:emNow_(),createdBy:'web-user'};emAppend_('Cash_Receipts',r);return r}
function createCashPaymentFromUi(d){ensureExtraRuntimeSheet_('Cash_Payments');const r={id:emId_(),paymentNumber:'CP-'+Date.now(),paymentDate:d.paymentDate||emToday_(),cashType:d.cashType||'cash',amount:Number(d.amount||0),paidToName:d.paidToName||'',expenseCategory:d.expenseCategory||'',description:d.description||'',status:'approved',createdAt:emNow_(),approvedAt:emNow_(),createdBy:'web-user'};emAppend_('Cash_Payments',r);return r}
function approveCashReceiptFromUi(id){return emFindById_('Cash_Receipts',id)}function approveCashPaymentFromUi(id){return emFindById_('Cash_Payments',id)}
function getMasterRowsFromUi(s){const allowed=['Customers','Suppliers','Employees','Items','Groups','Units','Branches','Partners'];if(allowed.indexOf(String(s))<0)throw new Error('نوع البيانات غير مسموح.');return emReadAll_(s)}function saveMasterFromUi(s,d){return d&&d.id?updateMasterRecord(s,d.id,d,{id:'web-user',name:'واجهة'}):createMasterRecord(s,d,{id:'web-user',name:'واجهة'})}function deactivateMasterFromUi(s,id){return updateMasterRecord(s,id,{active:'off'},{id:'web-user',name:'واجهة'})}
function updateMasterRecord(s,id,d,a){const r=emFindById_(s,id);if(!r)throw new Error('السجل غير موجود');Object.keys(d||{}).forEach(k=>{if(k!=='id'&&k!=='createdAt'&&r.hasOwnProperty(k))r[k]=d[k]});r.updatedAt=emNow_();emUpdateById_(s,id,r);return r}
function completeEasyManageSchema(){ensureExtraRuntimeSheet_('Transfers');ensureExtraRuntimeSheet_('Transfer_Lines');ensureExtraRuntimeSheet_('Stocktakes');ensureExtraRuntimeSheet_('Stocktake_Lines');ensureExtraRuntimeSheet_('Cash_Receipts');ensureExtraRuntimeSheet_('Cash_Payments');ensureExtraRuntimeSheet_('Payment_Details');ensureExtraRuntimeSheet_('Opening_Balances');ensureExtraRuntimeSheet_('Colors_Sizes');ensureExtraRuntimeSheet_('Report_Views');return {ok:true,version:'1.1.0'}}
function validateCompleteEasyManageSchema(){const ss=SpreadsheetApp.getActiveSpreadsheet();const missing=Object.keys(EM_EXTRA_HEADERS).filter(s=>!ss.getSheetByName(s));const result={ok:!missing.length,missingSheets:missing};Logger.log(JSON.stringify(result));return result}

const EM_ROLE_PERMISSIONS={admin:{all:'admin'},cashier:{Sales:'write',SalesReturns:'write',Customers:'write',Reports:'read'},warehouse_keeper:{Warehouses:'write',Items:'read',Reports:'read'}};
function emPasswordHash_(salt,password){return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(salt)+'|'+String(password),Utilities.Charset.UTF_8))}
function createEasyUser(input,actor){input=input||{};const rows=emReadAll_('Users_Roles');if(rows.length&&(!actor||actor.id!=='system'))throw new Error('لا يمكن إنشاء مستخدم إلا بواسطة مدير.');if(!input.username||String(input.password||'').length<6)throw new Error('اسم المستخدم وكلمة المرور مطلوبان.');if(!EM_ROLE_PERMISSIONS[input.roleCode||'cashier'])throw new Error('الدور غير معروف.');const salt=Utilities.getUuid(),r={id:emId_(),username:String(input.username),employeeId:input.employeeId||'',roleCode:input.roleCode||'cashier',permissionsJson:JSON.stringify(EM_ROLE_PERMISSIONS[input.roleCode||'cashier']),passwordSalt:salt,passwordHash:emPasswordHash_(salt,input.password),active:'on',maxDevices:2,lastLoginAt:'',createdAt:emNow_(),updatedAt:emNow_(),createdBy:'system',updatedBy:'system'};emAppend_('Users_Roles',r);return {id:r.id,username:r.username,roleCode:r.roleCode,active:r.active}}
function loginEasyManage(username,password,device){const r=emReadAll_('Users_Roles').find(x=>x.active==='on'&&x.username===username);if(!r||emPasswordHash_(r.passwordSalt,password)!==r.passwordHash)throw new Error('بيانات الدخول غير صحيحة');const t=Utilities.getUuid()+Utilities.getUuid(),expiresAt=Date.now()+21600*1000,session={userId:r.id,username:r.username,roleCode:r.roleCode,device:device||'browser',expiresAt:expiresAt};PropertiesService.getScriptProperties().setProperty('EM_SESSION_'+t,JSON.stringify(session));try{CacheService.getScriptCache().put('EM_SESSION_'+t,JSON.stringify(session),21600)}catch(e){}r.lastLoginAt=emNow_();emUpdateById_('Users_Roles',r.id,r);return {token:t,user:{id:r.id,username:r.username,roleCode:r.roleCode}}}
function logoutEasyManage(token){if(token){PropertiesService.getScriptProperties().deleteProperty('EM_SESSION_'+token);try{CacheService.getScriptCache().remove('EM_SESSION_'+token)}catch(e){}}return true}
function getSessionUser(token){if(!token)throw new Error('SESSION_EXPIRED');let raw=null;try{raw=CacheService.getScriptCache().get('EM_SESSION_'+token)}catch(e){}if(!raw)raw=PropertiesService.getScriptProperties().getProperty('EM_SESSION_'+token);if(!raw)throw new Error('SESSION_EXPIRED');const s=JSON.parse(raw);if(s.expiresAt&&Date.now()>Number(s.expiresAt)){logoutEasyManage(token);throw new Error('SESSION_EXPIRED')}const r=emFindById_('Users_Roles',s.userId);if(!r||r.active!=='on'){logoutEasyManage(token);throw new Error('SESSION_EXPIRED')}return {id:r.id,username:r.username,roleCode:r.roleCode,active:r.active}}
function listEasyUsers(){return emReadAll_('Users_Roles').map(r=>({id:r.id,username:r.username,employeeId:r.employeeId,roleCode:r.roleCode,active:r.active}))}

function getInvoicesFromUi(status,fromDate,toDate){return getInvoicesReport(status||'',fromDate||'',toDate||'')}
function getWarehouseBalancesFromUi(warehouseId){return getWarehouseBalances(warehouseId||'')}
function getDailyReportForUi(date,branchId,warehouseId){return getDailyReportsUi(date,branchId,warehouseId)}

/** Latest extensions */
function getSalesPeriodReport(fromDate,toDate,branchId,warehouseId){const rows=getInvoicesReport('approved',fromDate,toDate).filter(r=>r.type==='sales_invoice'&&(!branchId||String(r.branchId)===String(branchId))&&(!warehouseId||String(r.warehouseId)===String(warehouseId)));const returns=getInvoicesReport('approved',fromDate,toDate).filter(r=>r.type==='sales_return'&&(!branchId||String(r.branchId)===String(branchId))&&(!warehouseId||String(r.warehouseId)===String(warehouseId)));const sum=a=>a.reduce((s,r)=>s+Number(r.totalGross||0),0);return{fromDate:fromDate,toDate:toDate,invoiceCount:rows.length,returnCount:returns.length,totalSales:sum(rows),totalReturns:sum(returns),netSales:sum(rows)-sum(returns),rows:rows.concat(returns)}}
function getPurchasePeriodReport(fromDate,toDate,branchId,warehouseId){const rows=getInvoicesReport('approved',fromDate,toDate).filter(r=>r.type==='purchase_invoice'&&(!branchId||String(r.branchId)===String(branchId))&&(!warehouseId||String(r.warehouseId)===String(warehouseId)));const returns=getInvoicesReport('approved',fromDate,toDate).filter(r=>r.type==='purchase_return');const sum=a=>a.reduce((s,r)=>s+Number(r.totalGross||0),0);return{fromDate:fromDate,toDate:toDate,invoiceCount:rows.length,returnCount:returns.length,totalPurchases:sum(rows),totalReturns:sum(returns),rows:rows.concat(returns)}}
function getStockBalancesReport(warehouseId){const balances=getWarehouseBalances(warehouseId||''),items={};emReadAll_('Items').forEach(i=>items[String(i.id)]=i);return balances.map(r=>{const i=items[String(r.itemId)]||{};return{warehouseId:r.warehouseId,itemId:r.itemId,itemCode:r.itemCode||i.itemCode||'',itemName:r.itemName||i.name||'',quantity:Number(r.quantity||0),reorderLevel:Number(i.reorderLevel||0),purchasePrice:Number(i.purchasePrice||0),salePrice:Number(i.salePrice||0),belowReorder:Number(r.quantity||0)<=Number(i.reorderLevel||0)}})}
function getReorderReport(warehouseId){return getStockBalancesReport(warehouseId).filter(r=>r.belowReorder&&r.reorderLevel>0)}
function getReportsBundleFromUi(fromDate,toDate,branchId,warehouseId){const f=fromDate||emToday_(),t=toDate||f;return{sales:getSalesPeriodReport(f,t,branchId||'',warehouseId||''),purchases:getPurchasePeriodReport(f,t,branchId||'',warehouseId||''),balances:getStockBalancesReport(warehouseId||''),reorder:getReorderReport(warehouseId||'')}}
function getInventoryMovementReport(fromDate,toDate,warehouseId,itemId){return emReadAll_(EM_INVENTORY_SHEET).filter(r=>{const d=String(r.transactionDate||'').slice(0,10);return(!fromDate||d>=fromDate)&&(!toDate||d<=toDate)&&(!warehouseId||String(r.warehouseId)===String(warehouseId))&&(!itemId||String(r.itemId)===String(itemId))}).map(r=>({date:String(r.transactionDate||'').slice(0,10),transactionType:r.transactionType,sourceType:r.sourceType,sourceId:r.sourceId,warehouseId:r.warehouseId,itemId:r.itemId,itemCode:r.itemCodeSnapshot,itemName:r.itemNameSnapshot,quantityIn:Number(r.quantityIn||0),quantityOut:Number(r.quantityOut||0),balance:getStockBalance(r.warehouseId,r.itemId)}))}
function getCustomerSalesReport(fromDate,toDate,customerId){const rows=emReadAll_('Sales_Invoices').filter(r=>{const d=String(r.invoiceDate||'').slice(0,10);return r.status==='approved'&&(!fromDate||d>=fromDate)&&(!toDate||d<=toDate)&&(!customerId||String(r.customerId)===String(customerId))}),returns=emReadAll_('Sales_Returns').filter(r=>{const d=String(r.returnDate||'').slice(0,10);return r.status==='approved'&&(!fromDate||d>=fromDate)&&(!toDate||d<=toDate)&&(!customerId||String(r.customerId)===String(customerId))});const sum=a=>a.reduce((s,r)=>s+Number(r.totalGross||0),0);return{rows:rows,returns:returns,totalSales:sum(rows),totalReturns:sum(returns),netSales:sum(rows)-sum(returns)}}
function getSupplierPurchasesReport(fromDate,toDate,supplierId){const rows=emReadAll_('Purchase_Invoices').filter(r=>{const d=String(r.purchaseDate||'').slice(0,10);return r.status==='approved'&&(!fromDate||d>=fromDate)&&(!toDate||d<=toDate)&&(!supplierId||String(r.supplierId)===String(supplierId))}),returns=emReadAll_('Purchase_Returns').filter(r=>{const d=String(r.returnDate||'').slice(0,10);return r.status==='approved'&&(!fromDate||d>=fromDate)&&(!toDate||d<=toDate)&&(!supplierId||String(r.supplierId)===String(supplierId))});const sum=a=>a.reduce((s,r)=>s+Number(r.totalGross||0),0);return{rows:rows,returns:returns,totalPurchases:sum(rows),totalReturns:sum(returns),netPurchases:sum(rows)-sum(returns)}}
function getExpensePeriodReport(fromDate,toDate,expenseCategory){const rows=emReadAll_('Cash_Payments').filter(r=>{const d=String(r.paymentDate||'').slice(0,10);return r.status==='approved'&&(!fromDate||d>=fromDate)&&(!toDate||d<=toDate)&&(!expenseCategory||String(r.expenseCategory)===String(expenseCategory))});const by={};rows.forEach(r=>{const k=r.expenseCategory||'غير مصنف';if(!by[k])by[k]={category:k,amount:0,count:0};by[k].amount+=Number(r.amount||0);by[k].count++});return{rows:rows,byCategory:Object.keys(by).map(k=>by[k]),total:rows.reduce((s,r)=>s+Number(r.amount||0),0)}}
function getSecondaryReportFromUi(type,fromDate,toDate,warehouseId,itemId,customerId,supplierId){if(type==='inventory_movement')return{type:type,rows:getInventoryMovementReport(fromDate,toDate,warehouseId,itemId)};if(type==='customer_sales')return{type:type,data:getCustomerSalesReport(fromDate,toDate,customerId)};if(type==='supplier_purchases')return{type:type,data:getSupplierPurchasesReport(fromDate,toDate,supplierId)};if(type==='expenses')return{type:type,data:getExpensePeriodReport(fromDate,toDate,'')};throw new Error('نوع التقرير غير معروف.')}
function createFirstAdminFromUi(input){if(emReadAll_('Users_Roles').length)throw new Error('يوجد مستخدمون بالفعل؛ استخدم تسجيل الدخول.');return createEasyUser({username:input.username,password:input.password,roleCode:'admin'},{id:'system',name:'system'})}
function requireUiAdmin_(token){const u=getSessionUser(token);if(u.roleCode!=='admin')throw new Error('هذه العملية متاحة للمدير فقط.');return u}
function loginFromUi(username,password){return loginEasyManage(username,password,'browser')}
function listUsersFromUi(token){requireUiAdmin_(token);return listEasyUsers()}
function createUserFromUi(input,token){const u=requireUiAdmin_(token);return createEasyUser(input,{id:u.id,name:u.username})}
function deactivateUserFromUi(id,token){requireUiAdmin_(token);const r=emFindById_('Users_Roles',id);if(!r)throw new Error('المستخدم غير موجود.');r.active='off';r.updatedAt=emNow_();r.updatedBy='admin';emUpdateById_('Users_Roles',id,r);return{ok:true,id:id}}
function requireUiPermission_(token,permission){const u=getSessionUser(token),role=String(u.roleCode||'');if(role==='admin')return u;const p={sales_write:['cashier'],purchase_write:['warehouse_keeper'],inventory_write:['warehouse_keeper'],warehouse_write:['warehouse_keeper'],document_approve:['cashier','warehouse_keeper'],document_cancel:['cashier','warehouse_keeper']};if(!p[permission]||p[permission].indexOf(role)<0)throw new Error('لا تملك صلاحية تنفيذ هذه العملية.');return u}
function createWarehouseFromUi(data,token){const u=requireUiPermission_(token,'warehouse_write');return createWarehouse(data,{id:u.id,name:u.username})}
function saveSalesInvoiceFromUi(header,lines,token){const u=requireUiPermission_(token,'sales_write');return saveDocumentDraft('sales_invoice',header,lines,{id:u.id,name:u.username})}
function savePurchaseInvoiceFromUi(header,lines,token){const u=requireUiPermission_(token,'purchase_write');return saveDocumentDraft('purchase_invoice',header,lines,{id:u.id,name:u.username})}
function approveDocumentFromUi(documentType,id,token){const u=requireUiPermission_(token,'document_approve');return approveDocument(documentType,id,{id:u.id,name:u.username})}
function cancelDocumentFromUi(documentType,id,reason,token){const u=requireUiPermission_(token,'document_cancel');return cancelDocument(documentType,id,reason,{id:u.id,name:u.username})}

function createTransferFromUi(d,token){const u=requireUiPermission_(token,'inventory_write');ensureExtraRuntimeSheet_('Transfers');ensureExtraRuntimeSheet_('Transfer_Lines');const id=emId_(),h={id:id,transferNumber:'TR-'+Date.now(),transferDate:d.transferDate||emToday_(),fromBranchId:d.fromBranchId||'',fromWarehouseId:d.fromWarehouseId,toBranchId:d.toBranchId||'',toWarehouseId:d.toWarehouseId,status:'draft',notes:d.notes||'',createdAt:emNow_(),updatedAt:emNow_(),createdBy:u.id};emAppend_('Transfers',h);(d.lines||[]).forEach((x,i)=>emAppend_('Transfer_Lines',{id:emId_(),transferId:id,lineNo:i+1,itemId:x.itemId,quantity:Number(x.quantity||0)}));return{header:h}}
function approveTransferFromUi(id,token){const u=requireUiPermission_(token,'document_approve');return approveTransferFromUiCore_(id,u)}
function approveTransferFromUiCore_(id,u){const h=emFindById_('Transfers',id);if(!h)throw new Error('التحويل غير موجود');const lines=emReadAll_('Transfer_Lines').filter(x=>String(x.transferId)===String(id)),mv=[];lines.forEach(x=>{const q=Number(x.quantity||0);mv.push({id:emId_(),transactionDate:emNow_(),transactionType:'transfer_out',sourceType:'transfer',sourceId:id,branchId:h.fromBranchId,warehouseId:h.fromWarehouseId,itemId:x.itemId,quantityOut:q,quantityIn:0,createdAt:emNow_()});mv.push({id:emId_(),transactionDate:emNow_(),transactionType:'transfer_in',sourceType:'transfer',sourceId:id,branchId:h.toBranchId,warehouseId:h.toWarehouseId,itemId:x.itemId,quantityOut:0,quantityIn:q,createdAt:emNow_()})});mv.forEach(x=>emAppend_(EM_INVENTORY_SHEET,x));h.status='approved';h.approvedAt=emNow_();h.approvedBy=u.id;emUpdateById_('Transfers',id,h);return{header:h,movements:mv}}
function createStocktakeFromUi(d,token){const u=requireUiPermission_(token,'inventory_write');const r=createStocktakeFromUiCore_(d,u);return r}
function createStocktakeFromUiCore_(d,u){ensureExtraRuntimeSheet_('Stocktakes');ensureExtraRuntimeSheet_('Stocktake_Lines');const id=emId_(),h={id:id,stocktakeNumber:'ST-'+Date.now(),stocktakeDate:d.stocktakeDate||emToday_(),branchId:d.branchId||'',warehouseId:d.warehouseId,status:'draft',createdAt:emNow_(),updatedAt:emNow_(),createdBy:u.id};emAppend_('Stocktakes',h);(d.lines||[]).forEach((x,i)=>emAppend_('Stocktake_Lines',{id:emId_(),stocktakeId:id,lineNo:i+1,itemId:x.itemId,countedQuantity:Number(x.countedQuantity||0),systemQuantity:getStockBalance(h.warehouseId,x.itemId),differenceQuantity:0}));return{header:h}}
function approveStocktakeFromUi(id,token){const u=requireUiPermission_(token,'document_approve'),h=emFindById_('Stocktakes',id);if(!h)throw new Error('الجرد غير موجود');const lines=emReadAll_('Stocktake_Lines').filter(x=>String(x.stocktakeId)===String(id)),mv=[];lines.forEach(x=>{const d=Number(x.countedQuantity||0)-getStockBalance(h.warehouseId,x.itemId);if(d)mv.push({id:emId_(),transactionDate:emNow_(),transactionType:'stocktake_adjustment',sourceType:'stocktake',sourceId:id,branchId:h.branchId,warehouseId:h.warehouseId,itemId:x.itemId,quantityIn:d>0?d:0,quantityOut:d<0?-d:0,createdAt:emNow_()})});mv.forEach(x=>emAppend_(EM_INVENTORY_SHEET,x));h.status='approved';h.approvedAt=emNow_();h.approvedBy=u.id;emUpdateById_('Stocktakes',id,h);return{header:h,movements:mv}}
function createCashReceiptFromUi(d,token){const u=requireUiPermission_(token,'cash_write'),r={id:emId_(),receiptNumber:'CR-'+Date.now(),receiptDate:d.receiptDate||emToday_(),cashType:d.cashType||'cash',amount:Number(d.amount||0),receivedFromName:d.receivedFromName||'',depositAccount:d.depositAccount||'',description:d.description||'',status:'approved',createdAt:emNow_(),approvedAt:emNow_(),createdBy:u.id};ensureExtraRuntimeSheet_('Cash_Receipts');emAppend_('Cash_Receipts',r);return r}
function createCashPaymentFromUi(d,token){const u=requireUiPermission_(token,'cash_write'),r={id:emId_(),paymentNumber:'CP-'+Date.now(),paymentDate:d.paymentDate||emToday_(),cashType:d.cashType||'cash',amount:Number(d.amount||0),paidToName:d.paidToName||'',expenseCategory:d.expenseCategory||'',description:d.description||'',status:'approved',createdAt:emNow_(),approvedAt:emNow_(),createdBy:u.id};ensureExtraRuntimeSheet_('Cash_Payments');emAppend_('Cash_Payments',r);return r}
function approveCashReceiptFromUi(id,token){requireUiPermission_(token,'document_approve');return emFindById_('Cash_Receipts',id)}function approveCashPaymentFromUi(id,token){requireUiPermission_(token,'document_approve');return emFindById_('Cash_Payments',id)}

function requireUiPermission_(token,permission){const u=getSessionUser(token),role=String(u.roleCode||'');if(role==='admin')return u;const p={sales_write:['cashier'],purchase_write:['warehouse_keeper'],inventory_write:['warehouse_keeper'],warehouse_write:['warehouse_keeper'],cash_write:['cashier'],document_approve:['cashier','warehouse_keeper'],document_cancel:['cashier','warehouse_keeper']};if(!p[permission]||p[permission].indexOf(role)<0)throw new Error('لا تملك صلاحية تنفيذ هذه العملية.');return u}

/** ================= النسخ الاحتياطي والاستعادة الآمنة ================= */
function backupSheetNames_(){const names=Object.keys(EM_SHEETS);if(typeof EM_EXTRA_HEADERS!=='undefined')Object.keys(EM_EXTRA_HEADERS).forEach(function(n){if(names.indexOf(n)<0)names.push(n)});if(names.indexOf(EM_INVENTORY_SHEET)<0)names.push(EM_INVENTORY_SHEET);return names}
function createEasyManageBackup(folderId){if(!folderId)throw new Error('أدخل معرف مجلد Google Drive.');const folder=DriveApp.getFolderById(folderId),payload={format:'EasyManageBackup',version:'1.0',createdAt:new Date().toISOString(),spreadsheetId:SpreadsheetApp.getActiveSpreadsheet().getId(),sheets:{}};backupSheetNames_().forEach(function(name){try{payload.sheets[name]={headers:emHeaders_(name),rows:emReadAll_(name)}}catch(e){}});const file=folder.createFile('EasyManage-backup-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Riyadh','yyyyMMdd-HHmmss')+'.json',JSON.stringify(payload,null,2),MimeType.PLAIN_TEXT);return{ok:true,fileId:file.getId(),fileName:file.getName(),url:file.getUrl(),createdAt:payload.createdAt}}
function restoreEasyManageBackupToNewSpreadsheet(fileId){if(!fileId)throw new Error('أدخل معرف ملف النسخة الاحتياطية.');const text=DriveApp.getFileById(fileId).getBlob().getDataAsString(),payload=JSON.parse(text);if(payload.format!=='EasyManageBackup')throw new Error('ملف النسخة غير صالح.');const ss=SpreadsheetApp.create('EasyManage-Restored-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Riyadh','yyyyMMdd-HHmmss'));const first=ss.getSheets()[0];let used=false;Object.keys(payload.sheets||{}).forEach(function(name){const spec=payload.sheets[name],sh=used?ss.insertSheet(name):first;used=true;sh.setName(name);const headers=spec.headers||[];if(headers.length)sh.getRange(1,1,1,headers.length).setValues([headers]);const rows=spec.rows||[];if(rows.length)sh.getRange(2,1,rows.length,headers.length).setValues(rows.map(function(row){return headers.map(function(h){return row[h]===undefined?'':row[h]})}));});return{ok:true,spreadsheetId:ss.getId(),url:ss.getUrl(),name:ss.getName()}}
function listEasyManageBackups(folderId){if(!folderId)throw new Error('أدخل معرف مجلد Google Drive.');const files=DriveApp.getFolderById(folderId).getFiles();const out=[];while(files.hasNext()){const f=files.next();if(/^EasyManage-backup-.*\.json$/.test(f.getName()))out.push({id:f.getId(),name:f.getName(),url:f.getUrl(),updatedAt:f.getLastUpdated().toISOString(),size:f.getSize()})}return out}
function createBackupFromUi(folderId,token){requireUiAdmin_(token);return createEasyManageBackup(folderId)}
function restoreBackupFromUi(fileId,token){requireUiAdmin_(token);return restoreEasyManageBackupToNewSpreadsheet(fileId)}

/** ================= المرتجعات المرتبطة بالفاتورة الأصلية ================= */
function saveReturnFromUi(returnType,header,lines,token){const docType=returnType==='purchase_return'?'purchase_return':'sales_return';const perm=docType==='sales_return'?'sales_write':'purchase_write';const u=requireUiPermission_(token,perm);return saveDocumentDraft(docType,header,lines,{id:u.id,name:u.username})}
function approveReturnFromUi(returnType,id,token){const docType=returnType==='purchase_return'?'purchase_return':'sales_return';const u=requireUiPermission_(token,'document_approve');return approveDocument(docType,id,{id:u.id,name:u.username})}

/** ================= تصدير التقارير إلى ملف Google Sheets ================= */
function exportDailyReportToSpreadsheet(date,branchId,warehouseId){const r=getReportsBundleFromUi(date||emToday_(),date||emToday_(),branchId||'',warehouseId||''),ss=SpreadsheetApp.create('EasyManage-Report-'+(date||emToday_())),sales=ss.getSheets()[0];sales.setName('Sales Summary');sales.getRange(1,1,6,2).setValues([['EasyManage','تقرير المبيعات'],['التاريخ',date||emToday_()],['إجمالي المبيعات',r.sales.totalSales],['إجمالي المرتجعات',r.sales.totalReturns],['صافي المبيعات',r.sales.netSales],['عدد الفواتير',r.sales.invoiceCount]]);const inv=ss.insertSheet('Inventory Balances');inv.getRange(1,1,1,5).setValues([['الصنف','الرصيد','حد إعادة الطلب','سعر الشراء','الحالة']]);const rows=(r.balances||[]).map(x=>[x.itemName,x.quantity,x.reorderLevel,x.purchasePrice,x.belowReorder?'يحتاج إعادة طلب':'طبيعي']);if(rows.length)inv.getRange(2,1,rows.length,5).setValues(rows);const pur=ss.insertSheet('Purchases Summary');pur.getRange(1,1,4,2).setValues([['EasyManage','ملخص المشتريات'],['إجمالي المشتريات',r.purchases.totalPurchases],['مرتجع المشتريات',r.purchases.totalReturns],['عدد الفواتير',r.purchases.invoiceCount]]);[sales,inv,pur].forEach(sh=>{sh.setFrozenRows(1);sh.autoResizeColumns(1,Math.min(sh.getMaxColumns(),5))});return{ok:true,spreadsheetId:ss.getId(),url:ss.getUrl(),name:ss.getName(),downloadHint:'افتح الملف ثم File > Download > Microsoft Excel (.xlsx)'}}
function exportSpreadsheetFromUi(date,branchId,warehouseId,token){return exportDailyReportToSpreadsheet(date,branchId,warehouseId)}

/** ================= حماية البيانات الأساسية ================= */
function saveMasterFromUi(s,d,token){const p=(s==='Items'||s==='Warehouses')?'warehouse_write':'admin_master';const u=requireUiPermission_(token,p);return d&&d.id?updateMasterRecord(s,d.id,d,{id:u.id,name:u.username}):createMasterRecord(s,d,{id:u.id,name:u.username})}
function deactivateMasterFromUi(s,id,token){const u=requireUiPermission_(token,'admin_master');return updateMasterRecord(s,id,{active:'off'},{id:u.id,name:u.username})}
function requireUiPermission_(token,permission){const u=getSessionUser(token),role=String(u.roleCode||'');if(role==='admin')return u;const p={sales_write:['cashier'],purchase_write:['warehouse_keeper'],inventory_write:['warehouse_keeper'],warehouse_write:['warehouse_keeper'],cash_write:['cashier'],document_approve:['cashier','warehouse_keeper'],document_cancel:['cashier','warehouse_keeper']};if(!p[permission]||p[permission].indexOf(role)<0)throw new Error('لا تملك صلاحية تنفيذ هذه العملية.');return u}

/** ================= الشركاء وإعدادات المنشأة ================= */
EM_EXTRA_HEADERS.Partners=['id','partnerCode','name','sharePercent','phone','email','notes','active','createdAt','updatedAt','createdBy','updatedBy'];
function getMasterRowsFromUi(s){const allowed=['Customers','Suppliers','Employees','Items','Groups','Units','Branches','Partners'];if(allowed.indexOf(String(s))<0)throw new Error('نوع البيانات غير مسموح.');return emReadAll_(s)}
function saveMasterFromUi(s,d,token){if(s==='Partners'){const u=requireUiPermission_(token,'admin_master'),r=d&&d.id?emFindById_('Partners',d.id):null;if(r){Object.keys(d).forEach(k=>{if(k!=='id'&&r.hasOwnProperty(k))r[k]=d[k]});r.updatedAt=emNow_();r.updatedBy=u.id;emUpdateById_('Partners',r.id,r);return r}const x={id:emId_(),partnerCode:d.code||'',name:d.name||'',sharePercent:Number(d.sharePercent||0),phone:d.phone||'',email:d.email||'',notes:d.notes||'',active:'on',createdAt:emNow_(),updatedAt:emNow_(),createdBy:u.id,updatedBy:u.id};emAppend_('Partners',x);return x}const p=(s==='Items'||s==='Warehouses')?'warehouse_write':'admin_master';const u=requireUiPermission_(token,p);return d&&d.id?updateMasterRecord(s,d.id,d,{id:u.id,name:u.username}):createMasterRecord(s,d,{id:u.id,name:u.username})}
function deactivateMasterFromUi(s,id,token){const u=requireUiPermission_(token,'admin_master');return updateMasterRecord(s,id,{active:'off'},{id:u.id,name:u.username})}

/** ================= قائمة الإضافة ================= */
EM_EXTRA_HEADERS.General_Ledger=['id','accountCode','accountName','accountType','parentAccountId','active','notes','createdAt','updatedAt','createdBy','updatedBy'];
EM_EXTRA_HEADERS.Expense_Categories=['id','categoryCode','name','active','notes','createdAt','updatedAt','createdBy','updatedBy'];
EM_EXTRA_HEADERS.Currencies=['id','currencyCode','name','symbol','barcode','decimalPlaces','active','createdAt','updatedAt','createdBy','updatedBy'];
function additionSheet_(type){return{Colors:'Colors_Sizes',Sizes:'Colors_Sizes',Ledger:'General_Ledger',Expenses:'Expense_Categories',Currencies:'Currencies'}[type]||type}
function getAdditionRowsFromUi(type,token){requireUiAdmin_(token);return emReadAll_(additionSheet_(type)).filter(function(r){return type==='Colors'?r.variantType==='color':type==='Sizes'?r.variantType==='size':true})}
function saveAdditionFromUi(type,d,token){const u=requireUiAdmin_(token),sheet=additionSheet_(type);ensureExtraRuntimeSheet_(sheet);const existing=d&&d.id?emFindById_(sheet,d.id):null;if(existing){Object.keys(d).forEach(function(k){if(k!=='id'&&existing.hasOwnProperty(k))existing[k]=d[k]});if(type==='Colors'||type==='Sizes')existing.variantType=type==='Colors'?'color':'size';existing.updatedAt=emNow_();existing.updatedBy=u.id;emUpdateById_(sheet,existing.id,existing);return existing}const r={id:emId_(),createdAt:emNow_(),updatedAt:emNow_(),createdBy:u.id,updatedBy:u.id,active:'on'};if(sheet==='Colors_Sizes'){r.itemId=d.itemId||'';r.variantType=type==='Colors'?'color':'size';r.code=d.code||'';r.name=d.name||'';r.barcode=d.barcode||''}else if(sheet==='General_Ledger'){r.accountCode=d.code||'';r.accountName=d.name||'';r.accountType=d.accountType||'asset';r.parentAccountId=d.parentAccountId||'';r.notes=d.notes||''}else if(sheet==='Expense_Categories'){r.categoryCode=d.code||'';r.name=d.name||'';r.notes=d.notes||''}else if(sheet==='Currencies'){r.currencyCode=d.code||'';r.name=d.name||'';r.symbol=d.symbol||'';r.barcode=d.barcode||'';r.decimalPlaces=Number(d.decimalPlaces||2)}emAppend_(sheet,r);return r}
function deactivateAdditionFromUi(type,id,token){const u=requireUiAdmin_(token),sheet=additionSheet_(type),r=emFindById_(sheet,id);if(!r)throw new Error('السجل غير موجود');r.active='off';r.updatedAt=emNow_();r.updatedBy=u.id;emUpdateById_(sheet,id,r);return r}

function getInvoicesFromUi(status,fromDate,toDate,type){return getInvoicesReport(status||'',fromDate||'',toDate||'').filter(function(r){return !type||r.type===type})}
EM_EXTRA_HEADERS.Adjustments=['id','adjustmentType','branchId','warehouseId','partyId','employeeId','itemId','quantity','amount','priceField','reason','status','createdAt','createdBy','updatedAt','updatedBy'];
function saveAdjustmentFromUi(d,token){const u=requireUiAdmin_(token);ensureExtraRuntimeSheet_('Adjustments');const r={id:emId_(),adjustmentType:d.adjustmentType||'inventory',branchId:d.branchId||'',warehouseId:d.warehouseId||'',partyId:d.partyId||'',employeeId:d.employeeId||'',itemId:d.itemId||'',quantity:Number(d.quantity||0),amount:Number(d.amount||0),priceField:d.priceField||'',reason:d.reason||'',status:'approved',createdAt:emNow_(),createdBy:u.id,updatedAt:emNow_(),updatedBy:u.id};emAppend_('Adjustments',r);if(r.adjustmentType==='inventory'&&r.itemId&&r.warehouseId){emAppend_(EM_INVENTORY_SHEET,{id:emId_(),transactionDate:emNow_(),transactionType:'manual_adjustment',sourceType:'adjustment',sourceId:r.id,branchId:r.branchId,warehouseId:r.warehouseId,itemId:r.itemId,quantityIn:r.quantity>0?r.quantity:0,quantityOut:r.quantity<0?-r.quantity:0,notes:r.reason,createdAt:emNow_(),createdBy:u.id})}return r}
function getAdjustmentsFromUi(token){requireUiAdmin_(token);return emReadAll_('Adjustments')}
function deleteAdjustmentFromUi(id,token){const u=requireUiAdmin_(token);const r=emFindById_('Adjustments',id);if(!r)throw new Error('التسوية غير موجودة');r.status='cancelled';r.updatedAt=emNow_();r.updatedBy=u.id;emUpdateById_('Adjustments',id,r);return r}

/** ================= المرحلة الحالية: إعدادات البيع والملفات والأرصدة ================= */
function countActiveBranches_(){return emReadAll_('Branches').filter(function(r){return r.active==='on'}).length}
function saveBranchFromUi(data,token){const u=requireUiPermission_(token,'admin_master');if(!data.id&&countActiveBranches_()>=10)throw new Error('لا يمكن إضافة أكثر من 10 فروع للمنشأة.');return data.id?updateMasterRecord('Branches',data.id,data,{id:u.id,name:u.username}):createMasterRecord('Branches',data,{id:u.id,name:u.username})}
function setSettingValue_(key,value,type,userId){const sh=emSheet_('Settings'),headers=emHeaders_('Settings'),rows=emReadAll_('Settings'),idx=rows.findIndex(function(r){return String(r.key)===String(key)}),r={id:idx>=0?rows[idx].id:emId_(),key:key,value:String(value==null?'':value),valueType:type||'string',scope:'global',active:'on',updatedAt:emNow_(),updatedBy:userId||'system'};if(idx>=0)emUpdateById_('Settings',r.id,r);else emAppend_('Settings',r);return r}
function getSalesSettingsFromUi(token){requireUiAdmin_(token);return{requireCustomer:getSetting_('sales.requireCustomer','off'),requireSeller:getSetting_('sales.requireSeller','off'),discountEnabled:getSetting_('sales.discountEnabled','on'),vatRate:getSetting_('sales.vatRate','0'),showItemImage:getSetting_('sales.showItemImage','off'),paperSize:getSetting_('sales.paperSize','A4'),barcodeSize:getSetting_('sales.barcodeSize','medium'),invoiceLayout:getSetting_('sales.invoiceLayout','standard'),emails:getSetting_('notification.emails','')}}
function saveSalesSettingsFromUi(d,token){const u=requireUiAdmin_(token);[['sales.requireCustomer',d.requireCustomer],['sales.requireSeller',d.requireSeller],['sales.discountEnabled',d.discountEnabled],['sales.vatRate',d.vatRate],['sales.showItemImage',d.showItemImage],['sales.paperSize',d.paperSize],['sales.barcodeSize',d.barcodeSize],['sales.invoiceLayout',d.invoiceLayout],['notification.emails',d.emails]].forEach(function(x){setSettingValue_(x[0],x[1],typeof x[1]==='number'?'number':'string',u.id)});return getSalesSettingsFromUi(token)}
function uploadCompanyAssetFromUi(file,kind,token){const u=requireUiAdmin_(token);if(!file||!file.data)throw new Error('الملف مطلوب.');const bytes=Utilities.base64Decode(String(file.data).split(',').pop()),blob=Utilities.newBlob(bytes,file.mimeType||'application/octet-stream',file.name||('easymanage-'+kind));const f=DriveApp.createFile(blob);const key=kind==='logo'?'company.logoUrl':kind==='homeImage'?'company.homeImageUrl':'company.startupSoundUrl';setSettingValue_(key,f.getUrl(),'url',u.id);return{ok:true,fileId:f.getId(),url:f.getUrl(),name:f.getName(),kind:kind}}
function saveOpeningBalanceFromUi(d,token){const u=requireUiAdmin_(token);ensureExtraRuntimeSheet_('Opening_Balances');const r={id:emId_(),balanceType:d.balanceType||'warehouse',branchId:d.branchId||'',warehouseId:d.warehouseId||'',partyId:d.partyId||'',itemId:d.itemId||'',cashAccount:d.cashAccount||'',balanceDate:d.balanceDate||emToday_(),quantity:Number(d.quantity||0),amount:Number(d.amount||0),currency:d.currency||'',notes:d.notes||'',status:'approved',createdAt:emNow_(),createdBy:u.id};emAppend_('Opening_Balances',r);if(r.balanceType==='warehouse'&&r.itemId&&r.warehouseId&&r.quantity){emAppend_(EM_INVENTORY_SHEET,{id:emId_(),transactionDate:r.balanceDate,transactionType:'opening_balance',sourceType:'opening_balance',sourceId:r.id,branchId:r.branchId,warehouseId:r.warehouseId,itemId:r.itemId,quantityIn:r.quantity>0?r.quantity:0,quantityOut:r.quantity<0?-r.quantity:0,notes:r.notes,createdAt:emNow_(),createdBy:u.id})}return r}
function getOpeningBalancesFromUi(token){requireUiAdmin_(token);return emReadAll_('Opening_Balances')}

function saveMasterFromUi(s,d,token){if(s==='Branches'&&!d.id&&countActiveBranches_()>=10)throw new Error('لا يمكن إضافة أكثر من 10 فروع للمنشأة.');if(s==='Partners'){const u=requireUiPermission_(token,'admin_master'),r=d&&d.id?emFindById_('Partners',d.id):null;if(r){Object.keys(d).forEach(function(k){if(k!=='id'&&r.hasOwnProperty(k))r[k]=d[k]});r.updatedAt=emNow_();r.updatedBy=u.id;emUpdateById_('Partners',r.id,r);return r}const x={id:emId_(),partnerCode:d.code||'',name:d.name||'',sharePercent:Number(d.sharePercent||0),phone:d.phone||'',email:d.email||'',notes:d.notes||'',active:'on',createdAt:emNow_(),updatedAt:emNow_(),createdBy:u.id,updatedBy:u.id};emAppend_('Partners',x);return x}const p=(s==='Items'||s==='Warehouses')?'warehouse_write':'admin_master',u=requireUiPermission_(token,p);return d&&d.id?updateMasterRecord(s,d.id,d,{id:u.id,name:u.username}):createMasterRecord(s,d,{id:u.id,name:u.username})}

function saveSalesSettingsFromUi(d,token){const u=requireUiAdmin_(token);[['sales.requireCustomer',d.requireCustomer],['sales.requireSeller',d.requireSeller],['sales.discountEnabled',d.discountEnabled],['sales.vatRate',d.vatRate],['vatRate',d.vatRate],['sales.showItemImage',d.showItemImage],['sales.paperSize',d.paperSize],['sales.barcodeSize',d.barcodeSize],['sales.invoiceLayout',d.invoiceLayout],['notification.emails',d.emails]].forEach(function(x){setSettingValue_(x[0],x[1],typeof x[1]==='number'?'number':'string',u.id)});return getSalesSettingsFromUi(token)}
function saveSalesInvoiceFromUi(header,lines,token){const u=requireUiPermission_(token,'sales_write'),h=Object.assign({},header||{}),settings=getSalesSettingsFromUi(token);if(settings.requireCustomer==='on'&&!h.customerId)throw new Error('اسم العميل مطلوب حسب إعدادات فواتير البيع.');if(settings.requireSeller==='on'&&!String(h.sellerName||'').trim())throw new Error('اسم البائع مطلوب حسب إعدادات فواتير البيع.');h.vatRate=Number(settings.vatRate||0);if(settings.discountEnabled==='off'){(lines||[]).forEach(function(x){x.discountRate=0})}return saveDocumentDraft('sales_invoice',h,lines,{id:u.id,name:u.username})}

/** ================= الاستيراد الجماعي وشجرة المجموعات ================= */
function bulkImportItemsFromUi(rows, token) {
  const u = requireUiAdmin_(token);
  if (!Array.isArray(rows) || !rows.length) throw new Error('ملف الأصناف فارغ.');
  function k(v) { return String(v == null ? '' : v).replace(/[\u200f\u200e]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function val(row, names) {
    const wanted = names.map(k), keys = Object.keys(row || {});
    for (let i = 0; i < keys.length; i++) if (wanted.indexOf(k(keys[i])) >= 0) return row[keys[i]];
    return '';
  }
  function txt(row, names) { return String(val(row, names) == null ? '' : val(row, names)).trim(); }
  function num(row, names) {
    const raw = val(row, names);
    if (raw === '' || raw == null) return 0;
    const n = Number(String(raw).replace(/,/g, '').replace(/٪/g, '').replace('%', '').trim());
    return isFinite(n) ? n : 0;
  }
  function findByValue_(sheet, value) {
    const wanted = k(value);
    return emReadAll_(sheet).find(function(r) {
      return [r.name, r.symbol, r.unitCode, r.branchCode, r.groupCode].some(function(x) { return k(x) === wanted; });
    }) || null;
  }
  function unit_(name) {
    return findByValue_('Units', name) || createMasterRecord('Units', { unitCode: name, name: name, symbol: name, active: 'on' }, { id: u.id, name: u.username });
  }
  function group_(name, parentId) {
    if (!name) return null;
    const found = emReadAll_('Groups').find(function(r) { return k(r.name) === k(name) && String(r.parentGroupId || '') === String(parentId || ''); });
    return found || createMasterRecord('Groups', { groupCode: name, name: name, parentGroupId: parentId || '', active: 'on' }, { id: u.id, name: u.username });
  }
  function branch_(name) {
    return emReadAll_('Branches').find(function(r) { return r.active === 'on' && (k(r.name) === k(name) || k(r.branchCode) === k(name)); }) || null;
  }
  function openingExists_(itemId, warehouseId) {
    return emReadAll_(EM_INVENTORY_SHEET).some(function(r) { return r.sourceType === 'excel_import_opening' && String(r.sourceId) === String(itemId) && String(r.warehouseId) === String(warehouseId); });
  }
  ensureExtraRuntimeSheet_(EM_INVENTORY_SHEET);
  const byCode = {};
  emReadAll_('Items').forEach(function(r) { byCode[String(r.itemCode).trim()] = r; });
  const result = { created: 0, updated: 0, openingBalances: 0, errors: [], rows: [] };
  rows.forEach(function(raw, index) {
    try {
      const itemCode = txt(raw, ['رقم الصنف', 'itemCode', 'code']);
      const name = txt(raw, ['اسم الصنف', 'name']);
      const mainName = txt(raw, ['المجموعة الرئيسية', 'groupName']);
      const subName = txt(raw, ['المجموعة الفرعية', 'subGroupName']);
      const retail = num(raw, ['سعر التجزئة (بعد العرض ان وجد)', 'سعر التجزئة بعد العرض ان وجد', 'salePriceAfterDiscount']);
      const wholesale = num(raw, ['سعر الجملة (بعد العرض ان وجد)', 'سعر الجملة بعد العرض ان وجد', 'wholesalePrice']);
      const consumer = num(raw, ['سعر المستهلك (بعد العرض ان وجد)', 'سعر المستهلك بعد العرض ان وجد', 'salePrice']);
      const branchName = txt(raw, ['الفرع', 'branchName', 'branch']);
      const opening = num(raw, ['الرصيد', 'openingQuantity', 'quantity']);
      const unitName = txt(raw, ['الوحدة', 'unitName', 'unit']);
      if (!itemCode || !name || !unitName || !branchName) throw new Error('رقم الصنف والاسم والوحدة والفرع حقول مطلوبة.');
      const branch = branch_(branchName);
      if (!branch) throw new Error('الفرع غير موجود أو غير نشط: ' + branchName);
      const warehouse = emReadAll_('Warehouses').find(function(r) { return r.active === 'on' && String(r.branchId) === String(branch.id); });
      if (!warehouse) throw new Error('لا يوجد مخزن نشط مرتبط بالفرع: ' + branch.name);
      const unit = unit_(unitName), main = group_(mainName, ''), sub = group_(subName, main ? main.id : '');
      const d = { itemCode: itemCode, name: name, groupId: (sub || main || {}).id || '', unitId: unit.id, salePriceAfterDiscount: retail, wholesalePrice: wholesale, salePrice: consumer, active: 'on' };
      const old = byCode[itemCode];
      const saved = old ? updateMasterRecord('Items', old.id, d, { id: u.id, name: u.username }) : createMasterRecord('Items', d, { id: u.id, name: u.username });
      byCode[itemCode] = saved;
      if (old) result.updated++; else result.created++;
      if (opening && !openingExists_(saved.id, warehouse.id)) {
        emAppend_(EM_INVENTORY_SHEET, { id: emId_(), transactionDate: emToday_(), transactionType: 'opening_balance', sourceType: 'excel_import_opening', sourceId: saved.id, sourceNumber: itemCode, originalInvoiceId: '', branchId: branch.id, warehouseId: warehouse.id, itemId: saved.id, itemCodeSnapshot: itemCode, itemNameSnapshot: name, quantityIn: opening > 0 ? opening : 0, quantityOut: opening < 0 ? -opening : 0, unitCostGross: wholesale, currency: getSetting_('currency', 'ر.س'), notes: 'رصيد افتتاحي مستورد من Excel', createdAt: emNow_(), createdBy: u.id });
        result.openingBalances++;
      }
      result.rows.push({ line: index + 2, itemCode: itemCode, status: old ? 'updated' : 'created', id: saved.id });
    } catch (e) { result.errors.push({ line: index + 2, message: e.message || String(e) }); }
  });
  return result;
}
function getGroupsTreeFromUi(token){requireUiAdmin_(token);const rows=emReadAll_('Groups').filter(r=>r.active==='on'),by={};rows.forEach(r=>by[r.id]=Object.assign({},r,{children:[]}));const roots=[];rows.forEach(r=>{if(r.parentGroupId&&by[r.parentGroupId])by[r.parentGroupId].children.push(by[r.id]);else roots.push(by[r.id])});return roots}

/** ================= النقدية والمرتبات ================= */
EM_EXTRA_HEADERS.Visa_Transactions=['id','transactionDate','direction','cardNumber','cardType','cardExpiry','amount','collectedAmount','invoiceNumber','receiptId','status','notes','createdAt','createdBy'];
EM_EXTRA_HEADERS.Checks_Transactions=['id','transactionDate','direction','checkNumber','bankName','amount','receiptNumber','collectedAmount','dueDate','customerName','status','notes','createdAt','createdBy'];
EM_EXTRA_HEADERS.Payroll=['id','payrollMonth','employeeId','employeeName','jobTitle','basicSalary','variableSalary','allowances','grossSalary','insuranceAmount','advances','deductions','totalDeductions','netSalary','status','notes','createdAt','createdBy','updatedAt','updatedBy'];
function cashAmount_(sheet,fromDate,toDate){return emReadAll_(sheet).filter(function(r){const d=String(r.receiptDate||r.paymentDate||'').slice(0,10);return r.status==='approved'&&(!fromDate||d>=fromDate)&&(!toDate||d<=toDate)}).reduce(function(s,r){return s+Number(r.amount||0)},0)}
function getTreasuryBalanceFromUi(fromDate,toDate,token){requireUiAdmin_(token);return{receipts:cashAmount_('Cash_Receipts',fromDate,toDate),payments:cashAmount_('Cash_Payments',fromDate,toDate),balance:cashAmount_('Cash_Receipts',fromDate,toDate)-cashAmount_('Cash_Payments',fromDate,toDate)}}
function getTreasuryMovementsFromUi(fromDate,toDate,token){requireUiAdmin_(token);const a=[];emReadAll_('Cash_Receipts').forEach(function(r){const d=String(r.receiptDate||'').slice(0,10);if(r.status==='approved'&&(!fromDate||d>=fromDate)&&(!toDate||d<=toDate))a.push({date:d,type:'قبض',number:r.receiptNumber,description:r.description||'',debit:Number(r.amount||0),credit:0,balance:0,cashType:r.cashType})});emReadAll_('Cash_Payments').forEach(function(r){const d=String(r.paymentDate||'').slice(0,10);if(r.status==='approved'&&(!fromDate||d>=fromDate)&&(!toDate||d<=toDate))a.push({date:d,type:'صرف',number:r.paymentNumber,description:r.description||'',debit:0,credit:Number(r.amount||0),balance:0,cashType:r.cashType})});a.sort(function(x,y){return x.date.localeCompare(y.date)});let b=0;a.forEach(function(x){b+=x.debit-x.credit;x.balance=b});return{rows:a,totalBalance:b}}
function getVisaTransactionsFromUi(fromDate,toDate,token){requireUiAdmin_(token);return emReadAll_('Visa_Transactions').filter(function(r){const d=String(r.transactionDate||'').slice(0,10);return(!fromDate||d>=fromDate)&&(!toDate||d<=toDate)})}
function getChecksTransactionsFromUi(fromDate,toDate,token){requireUiAdmin_(token);return emReadAll_('Checks_Transactions').filter(function(r){const d=String(r.transactionDate||'').slice(0,10);return(!fromDate||d>=fromDate)&&(!toDate||d<=toDate)})}
function savePayrollFromUi(d,token){const u=requireUiAdmin_(token);ensureExtraRuntimeSheet_('Payroll');const base=Number(d.basicSalary||0),variable=Number(d.variableSalary||0),allow=Number(d.allowances||0),insurance=Number(d.insuranceAmount||0),adv=Number(d.advances||0),ded=Number(d.deductions||0),gross=base+variable+allow,total=insurance+adv+ded,r={id:emId_(),payrollMonth:d.payrollMonth||emToday_().slice(0,7),employeeId:d.employeeId||'',employeeName:d.employeeName||'',jobTitle:d.jobTitle||'',basicSalary:base,variableSalary:variable,allowances:allow,grossSalary:gross,insuranceAmount:insurance,advances:adv,deductions:ded,totalDeductions:total,netSalary:gross-total,status:'draft',notes:d.notes||'',createdAt:emNow_(),createdBy:u.id,updatedAt:emNow_(),updatedBy:u.id};emAppend_('Payroll',r);return r}
function getPayrollFromUi(month,query,token){requireUiAdmin_(token);return emReadAll_('Payroll').filter(function(r){return(!month||String(r.payrollMonth)===String(month))&&(!query||String(r.employeeName).toLowerCase().indexOf(String(query).toLowerCase())>=0||String(r.jobTitle).toLowerCase().indexOf(String(query).toLowerCase())>=0)})}
function getUiData(){return{branches:emReadAll_('Branches').filter(r=>r.active==='on'),warehouses:emReadAll_('Warehouses').filter(r=>r.active==='on'),items:emReadAll_('Items').filter(r=>r.active==='on'),customers:emReadAll_('Customers').filter(r=>r.active==='on'),suppliers:emReadAll_('Suppliers').filter(r=>r.active==='on'),employees:emReadAll_('Employees').filter(r=>r.active==='on'),units:emReadAll_('Units').filter(r=>r.active==='on'),groups:emReadAll_('Groups').filter(r=>r.active==='on')}}
function createCashReceiptFromUi(d,token){const u=requireUiPermission_(token,'cash_write'),r={id:emId_(),receiptNumber:'CR-'+Date.now(),receiptDate:d.receiptDate||emToday_(),cashType:d.cashType||'cash',amount:Number(d.amount||0),currency:d.currency||'',receivedFromName:d.receivedFromName||'',depositAccount:d.depositAccount||'',description:d.description||'',status:'approved',createdAt:emNow_(),updatedAt:emNow_(),approvedAt:emNow_(),createdBy:u.id,approvedBy:u.id};ensureExtraRuntimeSheet_('Cash_Receipts');emAppend_('Cash_Receipts',r);if(r.cashType==='card'){ensureExtraRuntimeSheet_('Visa_Transactions');emAppend_('Visa_Transactions',{id:emId_(),transactionDate:r.receiptDate,direction:'in',cardNumber:d.cardNumber||'',cardType:d.cardType||'visa',cardExpiry:d.cardExpiry||'',amount:r.amount,collectedAmount:Number(d.collectedAmount||0),invoiceNumber:d.invoiceNumber||'',receiptId:r.receiptNumber,status:'received',notes:r.description,createdAt:emNow_(),createdBy:u.id})}if(r.cashType==='check'){ensureExtraRuntimeSheet_('Checks_Transactions');emAppend_('Checks_Transactions',{id:emId_(),transactionDate:r.receiptDate,direction:'in',checkNumber:d.checkNumber||'',bankName:d.bankName||'',amount:r.amount,receiptNumber:r.receiptNumber,collectedAmount:Number(d.collectedAmount||0),dueDate:d.dueDate||'',customerName:r.receivedFromName,status:'received',notes:r.description,createdAt:emNow_(),createdBy:u.id})}return r}
function createCashPaymentFromUi(d,token){const u=requireUiPermission_(token,'cash_write'),r={id:emId_(),paymentNumber:'CP-'+Date.now(),paymentDate:d.paymentDate||emToday_(),cashType:d.cashType||'cash',amount:Number(d.amount||0),currency:d.currency||'',paidToName:d.paidToName||'',expenseCategory:d.expenseCategory||'',description:d.description||'',status:'approved',createdAt:emNow_(),updatedAt:emNow_(),approvedAt:emNow_(),createdBy:u.id,approvedBy:u.id};ensureExtraRuntimeSheet_('Cash_Payments');emAppend_('Cash_Payments',r);if(r.cashType==='check'){ensureExtraRuntimeSheet_('Checks_Transactions');emAppend_('Checks_Transactions',{id:emId_(),transactionDate:r.paymentDate,direction:'out',checkNumber:d.checkNumber||'',bankName:d.bankName||'',amount:r.amount,receiptNumber:r.paymentNumber,collectedAmount:Number(d.collectedAmount||0),dueDate:d.dueDate||'',customerName:r.paidToName,status:'issued',notes:r.description,createdAt:emNow_(),createdBy:u.id})}return r}
/** ================= تقارير المبيعات المتقدمة ================= */
function getSalesAnalyticsReportFromUi(type,fromDate,toDate,token){requireUiAdmin_(token);const f=fromDate||'0000-01-01',t=toDate||'9999-12-31',items=emReadAll_('Items'),imap={};items.forEach(function(x){imap[x.id]=x});const groups=emReadAll_('Groups'),gmap={};groups.forEach(function(x){gmap[x.id]=x});const sales=emReadAll_('Sales_Invoices').filter(x=>x.status==='approved'&&String(x.invoiceDate).slice(0,10)>=f&&String(x.invoiceDate).slice(0,10)<=t),sids={};sales.forEach(x=>sids[x.id]=x);const sl=emReadAll_('Sales_Lines').filter(x=>sids[x.salesInvoiceId]),rets=emReadAll_('Sales_Returns').filter(x=>x.status==='approved'&&String(x.returnDate).slice(0,10)>=f&&String(x.returnDate).slice(0,10)<=t),rids={};rets.forEach(x=>rids[x.id]=x);const rl=emReadAll_('Sales_Return_Lines').filter(x=>rids[x.salesReturnId]);const purchases=emReadAll_('Purchase_Invoices').filter(x=>x.status==='approved'&&String(x.purchaseDate).slice(0,10)>=f&&String(x.purchaseDate).slice(0,10)<=t),pids={};purchases.forEach(x=>pids[x.id]=x);const pl=emReadAll_('Purchase_Lines').filter(x=>pids[x.purchaseInvoiceId]),purchaseQty={};pl.forEach(x=>purchaseQty[x.itemId]=(purchaseQty[x.itemId]||0)+Number(x.quantity||0));const agg={};const ensure=id=>agg[id]||(agg[id]={itemId:id,itemCode:(imap[id]||{}).itemCode||'',itemName:(imap[id]||{}).name||'',unitId:(imap[id]||{}).unitId||'',groupId:(imap[id]||{}).groupId||'',qty:0,returnQty:0,sales:0,returns:0,cost:0});sl.forEach(x=>{const a=ensure(x.itemId),q=Number(x.quantity||0),v=Number(x.netAmountGross||x.grossAmount||0),cost=q*Number((imap[x.itemId]||{}).purchasePrice||0);a.qty+=q;a.sales+=v;a.cost+=cost});rl.forEach(x=>{const a=ensure(x.itemId),q=Number(x.quantity||0),v=Number(x.netAmountGross||x.grossAmount||0);a.returnQty+=q;a.returns+=v;a.cost-=q*Number((imap[x.itemId]||{}).purchasePrice||0)});Object.keys(agg).forEach(k=>{const a=agg[k],g=gmap[a.groupId]||{};a.netQty=a.qty-a.returnQty;a.netSales=a.sales-a.returns;a.grossProfit=a.netSales-a.cost;a.profitRate=a.netSales?Math.round(a.grossProfit/a.netSales*10000)/100:0;a.subGroup=g.name||'';a.mainGroup=g.parentGroupId?(gmap[g.parentGroupId]||{}).name||'':g.name||''});let rows=[];if(type==='items'||type==='profitability'||type==='top'||type==='stagnant'||type==='compare'){rows=Object.values(agg);if(type==='top')rows.sort((a,b)=>b.netSales-a.netSales);if(type==='stagnant')rows=rows.filter(x=>x.qty===0&&x.returnQty===0);if(type==='compare')rows=rows.map(x=>({itemCode:x.itemCode,itemName:x.itemName,salesQty:x.qty,purchaseQty:purchaseQty[x.itemId]||0,unitId:x.unitId}))}else if(type==='returns'){rows=rets.map(x=>({date:x.returnDate,number:x.returnNumber,total:x.totalGross,notes:x.reason||x.notes||''}))}else if(type==='daily'||type==='monthly'){const m={};sales.forEach(x=>{const k=type==='daily'?String(x.invoiceDate).slice(0,10):String(x.invoiceDate).slice(0,7);if(!m[k])m[k]={period:k,sales:0,discount:0,netSales:0,returns:0,cost:0};m[k].sales+=Number(x.subtotalGross||x.totalGross||0);m[k].discount+=Number(x.discountAmount||0);m[k].netSales+=Number(x.totalGross||0)});rets.forEach(x=>{const k=type==='daily'?String(x.returnDate).slice(0,10):String(x.returnDate).slice(0,7);if(!m[k])m[k]={period:k,sales:0,discount:0,netSales:0,returns:0,cost:0};m[k].returns+=Number(x.totalGross||0)});rows=Object.values(m).sort((a,b)=>a.period.localeCompare(b.period));rows.forEach(x=>x.grossProfit=x.netSales-x.returns)}else if(type==='cash'||type==='credit'){rows=sales.filter(x=>type==='cash'?x.paymentType==='cash':x.paymentType==='credit').map(x=>({date:x.invoiceDate,number:x.invoiceNumber,total:x.totalGross,netSales:x.totalGross,dueDate:x.dueDate||''}))}else if(type==='groups'){const m={};Object.values(agg).forEach(x=>{const k=x.mainGroup||x.subGroup||'بدون مجموعة';if(!m[k])m[k]={mainGroup:k,qty:0,returnQty:0,netSales:0,returns:0};m[k].qty+=x.qty;m[k].returnQty+=x.returnQty;m[k].netSales+=x.netSales;m[k].returns+=x.returns});rows=Object.values(m)}else rows=sales.map(x=>({date:x.invoiceDate,number:x.invoiceNumber,total:x.totalGross,netSales:x.totalGross,paymentType:x.paymentType}));return{type:type,fromDate:f,toDate:t,rows:rows,summary:{sales:sales.length,returns:rets.length,totalSales:sales.reduce((a,x)=>a+Number(x.totalGross||0),0),totalReturns:rets.reduce((a,x)=>a+Number(x.totalGross||0),0)}}}
function getPurchaseAnalyticsReportFromUi(type,fromDate,toDate,supplierId,token){requireUiAdmin_(token);const f=fromDate||'0000-01-01',t=toDate||'9999-12-31',items=emReadAll_('Items'),suppliers=emReadAll_('Suppliers'),imap={},smap={};items.forEach(x=>imap[x.id]=x);suppliers.forEach(x=>smap[x.id]=x);const inv=emReadAll_('Purchase_Invoices').filter(x=>x.status==='approved'&&String(x.purchaseDate).slice(0,10)>=f&&String(x.purchaseDate).slice(0,10)<=t&&(!supplierId||String(x.supplierId)===String(supplierId))),ids={};inv.forEach(x=>ids[x.id]=x);const lines=emReadAll_('Purchase_Lines').filter(x=>ids[x.purchaseInvoiceId]);if(type==='returns'){const rr=emReadAll_('Purchase_Returns').filter(x=>x.status==='approved'&&String(x.returnDate).slice(0,10)>=f&&String(x.returnDate).slice(0,10)<=t&&(!supplierId||String(x.supplierId)===String(supplierId)));return{type:type,rows:rr.map(x=>({date:x.returnDate,supplier:(smap[x.supplierId]||{}).name||'',number:x.returnNumber,value:x.totalGross,notes:x.reason||x.notes||''}))}}return{type:type,rows:lines.map(x=>{const h=ids[x.purchaseInvoiceId]||{},i=imap[x.itemId]||{},sp=smap[h.supplierId]||{};return{date:h.purchaseDate,itemCode:x.itemCodeSnapshot||i.itemCode,itemName:x.itemNameSnapshot||i.name,supplier:sp.name||'',invoice:h.purchaseNumber,unit:x.unitNameSnapshot||'',quantity:x.quantity,unitPrice:x.unitPriceGross,total:x.netAmountGross||x.grossAmount}})}}
function getItemCatalogReportFromUi(type,warehouseId,supplierId,token){requireUiAdmin_(token);const items=emReadAll_('Items').filter(x=>x.active==='on'&&(!supplierId||String(x.supplierId)===String(supplierId))),groups=emReadAll_('Groups'),gmap={};groups.forEach(x=>gmap[x.id]=x);const suppliers=emReadAll_('Suppliers'),smap={};suppliers.forEach(x=>smap[x.id]=x);const balances={};if(warehouseId)getWarehouseBalances(warehouseId).forEach(x=>balances[x.itemId]=Number(x.quantity||0));const available=type.indexOf('available')===0;return{type:type,rows:items.filter(x=>!available||Number(balances[x.id]||0)>0).map(x=>{const g=gmap[x.groupId]||{},parent=g.parentGroupId?(gmap[g.parentGroupId]||{}):{};return{itemCode:x.itemCode,itemName:x.name,supplier:(smap[x.supplierId]||{}).name||'',mainGroup:parent.name||(!g.parentGroupId?g.name||'':''),subGroup:g.parentGroupId?g.name||'':'',reorderLevel:x.reorderLevel,purchasePrice:x.purchasePrice,salePrice:x.salePrice,salePriceAfterDiscount:x.salePriceAfterDiscount,wholesalePrice:x.wholesalePrice,unitId:x.unitId,quantity:warehouseId?Number(balances[x.id]||0):''}})}}
function getSecondaryReportFromUi(type,fromDate,toDate,warehouseId,itemId,customerId,supplierId,token){if(type==='purchase_items'||type==='purchase_suppliers')return getPurchaseAnalyticsReportFromUi('items',fromDate,toDate,supplierId,token);if(type==='purchase_returns')return getPurchaseAnalyticsReportFromUi('returns',fromDate,toDate,supplierId,token);if(type.indexOf('item_')===0)return getItemCatalogReportFromUi(type.replace('item_',''),warehouseId,supplierId,token);if(type==='inventory_movement')return{type:type,rows:getInventoryMovementReport(fromDate,toDate,warehouseId,itemId)};if(type==='customer_sales')return{type:type,data:getCustomerSalesReport(fromDate,toDate,customerId)};if(type==='supplier_purchases')return{type:type,data:getSupplierPurchasesReport(fromDate,toDate,supplierId)};if(type==='expenses')return{type:type,data:getExpensePeriodReport(fromDate,toDate,'')};throw new Error('نوع التقرير غير معروف.')}
function getInventoryAnalyticsReportFromUi(type,fromDate,toDate,warehouseId,itemId,query,token){requireUiAdmin_(token);const f=fromDate||'0000-01-01',t=toDate||'9999-12-31',items=emReadAll_('Items'),suppliers=emReadAll_('Suppliers'),imap={},smap={};items.forEach(x=>imap[x.id]=x);suppliers.forEach(x=>smap[x.id]=x);const rows=emReadAll_(EM_INVENTORY_SHEET).filter(x=>String(x.transactionDate).slice(0,10)>=f&&String(x.transactionDate).slice(0,10)<=t&&(!warehouseId||String(x.warehouseId)===String(warehouseId))&&(!itemId||String(x.itemId)===String(itemId)));if(type==='movement_detail'||type==='movement_total'){const out={};rows.forEach(x=>{const k=type==='movement_total'?x.itemId+'|'+String(x.transactionDate).slice(0,10):x.id;if(!out[k])out[k]={date:String(x.transactionDate).slice(0,10),itemCode:x.itemCodeSnapshot||(imap[x.itemId]||{}).itemCode||'',itemName:x.itemNameSnapshot||(imap[x.itemId]||{}).name||'',in:0,out:0,balance:0,notes:x.notes||x.transactionType||''};out[k].in+=Number(x.quantityIn||0);out[k].out+=Number(x.quantityOut||0);out[k].balance+=Number(x.quantityIn||0)-Number(x.quantityOut||0)});return{type:type,rows:Object.values(out)}}if(type==='adjustments'){return{type:type,rows:rows.filter(x=>String(x.transactionType).indexOf('adjust')>=0).map(x=>({date:x.transactionDate,notes:x.notes||'',itemCode:x.itemCodeSnapshot||(imap[x.itemId]||{}).itemCode||'',itemName:x.itemNameSnapshot||(imap[x.itemId]||{}).name||'',in:x.quantityIn||0,out:x.quantityOut||0,purchaseValue:(x.quantityIn||x.quantityOut||0)*Number((imap[x.itemId]||{}).purchasePrice||0),saleValue:(x.quantityIn||x.quantityOut||0)*Number((imap[x.itemId]||{}).salePrice||0)}))}}const bal={};rows.forEach(x=>{const k=x.itemId;if(!bal[k])bal[k]={itemId:k,quantity:0,in:0,out:0,purchases:0,purchaseReturns:0,sales:0,salesReturns:0,transfers:0,adjustments:0};const qin=Number(x.quantityIn||0),qout=Number(x.quantityOut||0);bal[k].quantity+=qin-qout;bal[k].in+=qin;bal[k].out+=qout;const tt=String(x.transactionType||'');if(tt.indexOf('purchase')>=0)bal[k].purchases+=qin;if(tt.indexOf('return')>=0&&tt.indexOf('purchase')>=0)bal[k].purchaseReturns+=qout;if(tt.indexOf('sale')>=0)bal[k].sales+=qout;if(tt.indexOf('transfer')>=0)bal[k].transfers+=qin+qout;if(tt.indexOf('adjust')>=0)bal[k].adjustments+=qin-qout});let out=Object.values(bal).map(x=>{const i=imap[x.itemId]||{},s=smap[i.supplierId]||{};return Object.assign(x,{itemCode:i.itemCode||'',itemName:i.name||'',supplier:s.name||'',purchasePrice:Number(i.purchasePrice||0),salePrice:Number(i.salePrice||0),reorderLevel:Number(i.reorderLevel||0),mainGroup:'',subGroup:''})});if(query)out=out.filter(x=>String(x.itemCode).indexOf(query)>=0||String(x.itemName).toLowerCase().indexOf(String(query).toLowerCase())>=0);if(type==='reorder')out=out.filter(x=>x.quantity<=x.reorderLevel&&x.reorderLevel>0);if(type==='valuation')out=out.map(x=>Object.assign(x,{purchaseValue:x.quantity*x.purchasePrice,saleValue:x.quantity*x.salePrice,wholesaleValue:x.quantity*Number((imap[x.itemId]||{}).wholesalePrice||0),consumerValue:x.quantity*Number((imap[x.itemId]||{}).salePriceAfterDiscount||0)}));return{type:type,rows:out}}
function getSecondaryReportFromUi(type,fromDate,toDate,warehouseId,itemId,customerId,supplierId,token){if(type.indexOf('movement_')===0)return getInventoryAnalyticsReportFromUi(type,fromDate,toDate,warehouseId,itemId,'',token);if(type.indexOf('stock_')===0||type==='reorder'||type==='valuation'||type==='adjustments')return getInventoryAnalyticsReportFromUi(type,fromDate,toDate,warehouseId,itemId,itemId||'',token);if(type.indexOf('item_')===0)return getItemCatalogReportFromUi(type.replace('item_',''),warehouseId,supplierId,token);if(type==='purchase_items'||type==='purchase_suppliers'||type==='purchase_returns')return getPurchaseAnalyticsReportFromUi(type==='purchase_returns'?'returns':'items',fromDate,toDate,supplierId,token);return getPurchaseAnalyticsReportFromUi(type,fromDate,toDate,supplierId,token)}
function getCustomerAnalyticsReportFromUi(type,fromDate,toDate,customerId,itemId,token){requireUiAdmin_(token);const f=fromDate||'0000-01-01',t=toDate||'9999-12-31',customers=emReadAll_('Customers'),cmap={};customers.forEach(x=>cmap[x.id]=x);const inv=emReadAll_('Sales_Invoices').filter(x=>x.status==='approved'&&String(x.invoiceDate).slice(0,10)>=f&&String(x.invoiceDate).slice(0,10)<=t&&(!customerId||String(x.customerId)===String(customerId))),ids={};inv.forEach(x=>ids[x.id]=x);const lines=emReadAll_('Sales_Lines').filter(x=>ids[x.salesInvoiceId]&&(!itemId||String(x.itemId)===String(itemId))),rets=emReadAll_('Sales_Returns').filter(x=>x.status==='approved'&&String(x.returnDate).slice(0,10)>=f&&String(x.returnDate).slice(0,10)<=t&&(!customerId||String(x.customerId)===String(customerId))),rids={};rets.forEach(x=>rids[x.id]=x);const rl=emReadAll_('Sales_Return_Lines').filter(x=>rids[x.salesReturnId]&&(!itemId||String(x.itemId)===String(itemId)));if(type==='detail')return{type:type,rows:customers.filter(x=>String(x.id)===String(customerId)).map(x=>({code:x.customerCode,name:x.name,address:x.address,phone:x.phone,mobile:x.mobile,email:x.email,discountRate:x.discountRate,barcode:x.barcode,managerEmployeeId:x.managerEmployeeId}))};if(type==='invoice_detail')return{type:type,rows:inv.map(x=>({date:x.invoiceDate,number:x.invoiceNumber,amount:x.totalGross,sales:x.netBeforeVat,notes:x.notes||''}))};if(type==='item_detail')return{type:type,rows:lines.map(x=>({date:(ids[x.salesInvoiceId]||{}).invoiceDate,invoiceNumber:(ids[x.salesInvoiceId]||{}).invoiceNumber,returnNumber:'',salesQty:x.quantity,returnQty:0,salesValue:x.netAmountGross||x.grossAmount,returnValue:0,customer:(cmap[(ids[x.salesInvoiceId]||{}).customerId]||{}).name||''})).concat(rl.map(x=>({date:(rids[x.salesReturnId]||{}).returnDate,invoiceNumber:'',returnNumber:(rids[x.salesReturnId]||{}).returnNumber,salesQty:0,returnQty:x.quantity,salesValue:0,returnValue:x.netAmountGross||x.grossAmount,customer:(cmap[(rids[x.salesReturnId]||{}).customerId]||{}).name||''})))};if(type==='item_total'){const m={};lines.forEach(x=>{const k=x.itemId;if(!m[k])m[k]={itemCode:x.itemCodeSnapshot,itemName:x.itemNameSnapshot,qty:0,value:0};m[k].qty+=Number(x.quantity||0);m[k].value+=Number(x.netAmountGross||x.grossAmount||0)});rl.forEach(x=>{const k=x.itemId;if(!m[k])m[k]={itemCode:x.itemCodeSnapshot,itemName:x.itemNameSnapshot,qty:0,value:0};m[k].qty-=Number(x.quantity||0);m[k].value-=Number(x.netAmountGross||x.grossAmount||0)});return{type:type,rows:Object.values(m)}}if(type==='total'){const m={};customers.filter(x=>!customerId||String(x.id)===String(customerId)).forEach(x=>m[x.id]={customer:x.name,cash:0,credit:0,returns:0,total:0});inv.forEach(x=>{const k=x.customerId;if(!m[k])m[k]={customer:(cmap[k]||{}).name||'',cash:0,credit:0,returns:0,total:0};m[k][x.paymentType==='credit'?'credit':'cash']+=Number(x.totalGross||0);m[k].total+=Number(x.totalGross||0)});rets.forEach(x=>{const k=x.customerId;if(!m[k])m[k]={customer:(cmap[k]||{}).name||'',cash:0,credit:0,returns:0,total:0};m[k].returns+=Number(x.totalGross||0);m[k].total-=Number(x.totalGross||0)});return{type:type,rows:Object.values(m)}}if(type==='statement'||type==='inactive'){const rows=inv.map(x=>({date:x.invoiceDate,description:'فاتورة بيع '+x.invoiceNumber,debit:Number(x.totalGross||0),credit:0,balance:Number(x.totalGross||0)}));return{type:type,rows:rows}}if(type==='adjustments')return{type:type,rows:emReadAll_('Adjustments').filter(x=>(!customerId||String(x.partyId)===String(customerId))&&String(x.createdAt).slice(0,10)>=f&&String(x.createdAt).slice(0,10)<=t)};return{type:type,rows:[]}}
function getSecondaryReportFromUi(type,fromDate,toDate,warehouseId,itemId,customerId,supplierId,token){if(type.indexOf('customer_')===0)return getCustomerAnalyticsReportFromUi(type.replace('customer_',''),fromDate,toDate,customerId,itemId,token);return getInventoryAnalyticsReportFromUi(type,fromDate,toDate,warehouseId,itemId,itemId||'',token)}
function getSecondaryReportFromUi(type,fromDate,toDate,warehouseId,itemId,customerId,supplierId,token){if(type.indexOf('customer_')===0)return getCustomerAnalyticsReportFromUi(type.replace('customer_',''),fromDate,toDate,customerId,itemId,token);if(type.indexOf('movement_')===0||type.indexOf('stock_')===0||type==='reorder'||type==='valuation'||type==='adjustments')return getInventoryAnalyticsReportFromUi(type,fromDate,toDate,warehouseId,itemId,itemId||'',token);if(type.indexOf('item_')===0)return getItemCatalogReportFromUi(type.replace('item_',''),warehouseId,supplierId,token);if(type==='purchase_items'||type==='purchase_suppliers'||type==='purchase_returns')return getPurchaseAnalyticsReportFromUi(type==='purchase_returns'?'returns':'items',fromDate,toDate,supplierId,token);return getPurchaseAnalyticsReportFromUi(type,fromDate,toDate,supplierId,token)}
function getSupplierAnalyticsReportFromUi(type,fromDate,toDate,supplierId,token){requireUiAdmin_(token);const f=fromDate||'0000-01-01',t=toDate||'9999-12-31',suppliers=emReadAll_('Suppliers'),smap={};suppliers.forEach(x=>smap[x.id]=x);const inv=emReadAll_('Purchase_Invoices').filter(x=>x.status==='approved'&&String(x.purchaseDate).slice(0,10)>=f&&String(x.purchaseDate).slice(0,10)<=t&&(!supplierId||String(x.supplierId)===String(supplierId))),ids={};inv.forEach(x=>ids[x.id]=x);const lines=emReadAll_('Purchase_Lines').filter(x=>ids[x.purchaseInvoiceId]),rets=emReadAll_('Purchase_Returns').filter(x=>x.status==='approved'&&String(x.returnDate).slice(0,10)>=f&&String(x.returnDate).slice(0,10)<=t&&(!supplierId||String(x.supplierId)===String(supplierId)));if(type==='detail')return{type:type,rows:suppliers.filter(x=>String(x.id)===String(supplierId)).map(x=>({code:x.supplierCode,name:x.name,address:x.address,phone:x.phone,mobile:x.mobile,email:x.email,managerEmployeeId:x.managerEmployeeId}))};if(type==='accounts')return{type:type,rows:lines.map(x=>({date:(ids[x.purchaseInvoiceId]||{}).purchaseDate,invoice:(ids[x.purchaseInvoiceId]||{}).purchaseNumber,itemName:x.itemNameSnapshot,quantity:x.quantity,returns:0,gross:x.grossAmount,net:x.netAmountGross,returnValue:0}))};if(type==='total'){const m={};suppliers.filter(x=>!supplierId||String(x.id)===String(supplierId)).forEach(x=>m[x.id]={supplier:x.name,purchases:0,returns:0,paid:0,balance:0});inv.forEach(x=>{const k=x.supplierId;if(!m[k])m[k]={supplier:(smap[k]||{}).name||'',purchases:0,returns:0,paid:0,balance:0};m[k].purchases+=Number(x.totalGross||0);m[k].balance+=Number(x.totalGross||0)});rets.forEach(x=>{const k=x.supplierId;if(!m[k])m[k]={supplier:(smap[k]||{}).name||'',purchases:0,returns:0,paid:0,balance:0};m[k].returns+=Number(x.totalGross||0);m[k].balance-=Number(x.totalGross||0)});return{type:type,rows:Object.values(m)}}if(type==='movement'||type==='statement'){const rows=inv.map(x=>({date:x.purchaseDate,supplier:(smap[x.supplierId]||{}).name||'',invoice:x.purchaseNumber,opening:0,purchases:x.totalGross||0,purchaseReturns:0,paid:0,debit:x.totalGross||0,credit:0,balance:x.totalGross||0}));return{type:type,rows:rows}}if(type==='adjustments')return{type:type,rows:emReadAll_('Adjustments').filter(x=>(!supplierId||String(x.partyId)===String(supplierId))&&String(x.createdAt).slice(0,10)>=f&&String(x.createdAt).slice(0,10)<=t)};return{type:type,rows:[]}}
function getSecondaryReportFromUi(type,fromDate,toDate,warehouseId,itemId,customerId,supplierId,token){if(type.indexOf('supplier_')===0)return getSupplierAnalyticsReportFromUi(type.replace('supplier_',''),fromDate,toDate,supplierId,token);if(type.indexOf('customer_')===0)return getCustomerAnalyticsReportFromUi(type.replace('customer_',''),fromDate,toDate,customerId,itemId,token);if(type.indexOf('movement_')===0||type.indexOf('stock_')===0||type==='reorder'||type==='valuation'||type==='adjustments')return getInventoryAnalyticsReportFromUi(type,fromDate,toDate,warehouseId,itemId,itemId||'',token);if(type.indexOf('item_')===0)return getItemCatalogReportFromUi(type.replace('item_',''),warehouseId,supplierId,token);if(type==='purchase_items'||type==='purchase_suppliers'||type==='purchase_returns')return getPurchaseAnalyticsReportFromUi(type==='purchase_returns'?'returns':'items',fromDate,toDate,supplierId,token);return getPurchaseAnalyticsReportFromUi(type,fromDate,toDate,supplierId,token)}
function getEmployeeAnalyticsReportFromUi(type,fromDate,toDate,employeeId,token){requireUiAdmin_(token);const f=fromDate||'0000-01-01',t=toDate||'9999-12-31',employees=emReadAll_('Employees'),emap={};employees.forEach(x=>emap[x.id]=x);if(type==='list')return{type:type,rows:employees.filter(x=>!employeeId||String(x.id)===String(employeeId)).map(x=>({code:x.employeeCode,branchId:x.branchId,name:x.name,birthDate:x.birthDate,maritalStatus:x.maritalStatus,jobTitle:x.jobTitle,address:x.address,phone:x.phone,mobile:x.mobile}))};const inv=emReadAll_('Sales_Invoices').filter(x=>x.status==='approved'&&String(x.invoiceDate).slice(0,10)>=f&&String(x.invoiceDate).slice(0,10)<=t&&(!employeeId||String(x.sellerEmployeeId)===String(employeeId))),ids={};inv.forEach(x=>ids[x.id]=x);const lines=emReadAll_('Sales_Lines').filter(x=>ids[x.salesInvoiceId]);if(type==='period')return{type:type,rows:lines.map(x=>({date:(ids[x.salesInvoiceId]||{}).invoiceDate,employee:(emap[(ids[x.salesInvoiceId]||{}).sellerEmployeeId]||{}).name||'',itemName:x.itemNameSnapshot,itemCode:x.itemCodeSnapshot,quantity:x.quantity,value:x.netAmountGross||x.grossAmount}))};if(type==='statement')return{type:type,rows:inv.map(x=>({date:x.invoiceDate,description:'فاتورة بيع '+x.invoiceNumber,debit:x.totalGross,credit:0,balance:x.totalGross}))};return{type:type,rows:[]}}
function getAuditReportFromUi(fromDate,toDate,userId,token){requireUiAdmin_(token);return{rows:emReadAll_('Audit_Log').filter(x=>{const d=String(x.timestamp||'').slice(0,10);return(!fromDate||d>=fromDate)&&(!toDate||d<=toDate)&&(!userId||String(x.userId)===String(userId))}).map(x=>({date:String(x.timestamp||'').slice(0,10),time:String(x.timestamp||'').slice(11),user:x.username,description:x.action+' '+x.entityType+' '+x.entityNumber}))}}
function getSecondaryReportFromUi(type,fromDate,toDate,warehouseId,itemId,customerId,supplierId,token){if(type==='audit_log')return getAuditReportFromUi(fromDate,toDate,'',token);if(type.indexOf('employee_')===0)return getEmployeeAnalyticsReportFromUi(type.replace('employee_',''),fromDate,toDate,customerId,token);if(type.indexOf('supplier_')===0)return getSupplierAnalyticsReportFromUi(type.replace('supplier_',''),fromDate,toDate,supplierId,token);if(type.indexOf('customer_')===0)return getCustomerAnalyticsReportFromUi(type.replace('customer_',''),fromDate,toDate,customerId,itemId,token);if(type.indexOf('movement_')===0||type.indexOf('stock_')===0||type==='reorder'||type==='valuation'||type==='adjustments')return getInventoryAnalyticsReportFromUi(type,fromDate,toDate,warehouseId,itemId,itemId||'',token);if(type.indexOf('item_')===0)return getItemCatalogReportFromUi(type.replace('item_',''),warehouseId,supplierId,token);if(type==='purchase_items'||type==='purchase_suppliers'||type==='purchase_returns')return getPurchaseAnalyticsReportFromUi(type==='purchase_returns'?'returns':'items',fromDate,toDate,supplierId,token);return getPurchaseAnalyticsReportFromUi(type,fromDate,toDate,supplierId,token)}
function getRepTaxReportFromUi(type,fromDate,toDate,employeeId,token){requireUiAdmin_(token);const f=fromDate||'0000-01-01',t=toDate||'9999-12-31',emps=emReadAll_('Employees'),emap={};emps.forEach(x=>emap[x.id]=x);const inv=emReadAll_('Sales_Invoices').filter(x=>x.status==='approved'&&String(x.invoiceDate).slice(0,10)>=f&&String(x.invoiceDate).slice(0,10)<=t&&(!employeeId||String(x.sellerEmployeeId)===String(employeeId))),rets=emReadAll_('Sales_Returns').filter(x=>x.status==='approved'&&String(x.returnDate).slice(0,10)>=f&&String(x.returnDate).slice(0,10)<=t),receipts=emReadAll_('Cash_Receipts').filter(x=>x.status==='approved'&&String(x.receiptDate).slice(0,10)>=f&&String(x.receiptDate).slice(0,10)<=t);if(type==='commissions'){const m={};inv.forEach(x=>{const k=x.sellerEmployeeId||'';if(!m[k])m[k]={date:x.invoiceDate,employee:(emap[k]||{}).name||'',cash:0,checks:0,totalCollections:0,commissionRate:Number((emap[k]||{}).commissionRate||0),commission:0};m[k].totalCollections+=Number(x.totalGross||0);m[k].cash+=x.paymentType==='cash'?Number(x.totalGross||0):0;m[k].checks+=x.paymentType==='check'?Number(x.totalGross||0):0;m[k].commission=m[k].totalCollections*m[k].commissionRate/100});return{type:type,rows:Object.values(m)}}if(type==='sales_collections'){const m={};inv.forEach(x=>{const k=x.customerId||'';if(!m[k])m[k]={customer:x.customerId||'',opening:0,sales:0,returns:0,cash:0,checks:0,totalCollections:0,balance:0};m[k].sales+=Number(x.totalGross||0);m[k].cash+=x.paymentType==='cash'?Number(x.totalGross||0):0;m[k].checks+=x.paymentType==='check'?Number(x.totalGross||0):0});rets.forEach(x=>{const k=x.customerId||'';if(!m[k])m[k]={customer:k,opening:0,sales:0,returns:0,cash:0,checks:0,totalCollections:0,balance:0};m[k].returns+=Number(x.totalGross||0)});Object.values(m).forEach(x=>{x.totalCollections=x.cash+x.checks;x.balance=x.sales-x.returns-x.totalCollections});return{type:type,rows:Object.values(m)}}if(type==='year_chart'){const m={};inv.forEach(x=>{const k=String(x.invoiceDate).slice(0,7);if(!m[k])m[k]={period:k,sales:0,collections:0};m[k].sales+=Number(x.totalGross||0);m[k].collections+=x.paymentType==='cash'||x.paymentType==='check'?Number(x.totalGross||0):0});return{type:type,rows:Object.values(m).sort((a,b)=>a.period.localeCompare(b.period))}}if(type==='tax'){const rows=[];inv.forEach(x=>rows.push({date:x.invoiceDate,description:'ضريبة فاتورة '+x.invoiceNumber,debit:Number(x.vatAmount||0),credit:0,balance:Number(x.vatAmount||0)}));rets.forEach(x=>rows.push({date:x.returnDate,description:'ضريبة مرتجع '+x.returnNumber,debit:0,credit:Number(x.vatAmount||0),balance:-Number(x.vatAmount||0)}));let b=0;rows.sort((a,c)=>String(a.date).localeCompare(String(c.date))).forEach(x=>{b+=x.debit-x.credit;x.balance=b});return{type:type,rows:rows,totalBalance:b}}return{type:type,rows:[],receipts:receipts.length}}
function getSecondaryReportFromUi(type,fromDate,toDate,warehouseId,itemId,customerId,supplierId,token){if(type==='rep_commissions'||type==='rep_sales_collections'||type==='rep_year_chart'||type==='sales_tax')return getRepTaxReportFromUi(type==='rep_commissions'?'commissions':type==='rep_sales_collections'?'sales_collections':type==='rep_year_chart'?'year_chart':'tax',fromDate,toDate,customerId,token);if(type.indexOf('employee_')===0)return getEmployeeAnalyticsReportFromUi(type.replace('employee_',''),fromDate,toDate,customerId,token);if(type.indexOf('supplier_')===0)return getSupplierAnalyticsReportFromUi(type.replace('supplier_',''),fromDate,toDate,supplierId,token);if(type.indexOf('customer_')===0)return getCustomerAnalyticsReportFromUi(type.replace('customer_',''),fromDate,toDate,customerId,itemId,token);if(type.indexOf('movement_')===0||type.indexOf('stock_')===0||type==='reorder'||type==='valuation'||type==='adjustments')return getInventoryAnalyticsReportFromUi(type,fromDate,toDate,warehouseId,itemId,itemId||'',token);if(type.indexOf('item_')===0)return getItemCatalogReportFromUi(type.replace('item_',''),warehouseId,supplierId,token);if(type==='purchase_items'||type==='purchase_suppliers'||type==='purchase_returns')return getPurchaseAnalyticsReportFromUi(type==='purchase_returns'?'returns':'items',fromDate,toDate,supplierId,token);return getPurchaseAnalyticsReportFromUi(type,fromDate,toDate,supplierId,token)}


/** =====================================================================
 * المرحلة 3 — التقارير المالية والإدارية (من دليل المستخدم، قسم التقارير)
 * كتلة مستقلة بأسماء فريدة (fin*) حتى لا تتعارض مع التعريفات السابقة.
 * كل التقارير للمدير فقط، وتُرجع الشكل الموحد:
 *   { title, sections:[ { title, columns:[{key,label,type}], rows:[], summary:[{label,value}] } ] }
 * ===================================================================== */
EM_EXTRA_HEADERS.Ledger_Entries = ['id','entryDate','accountId','partnerId','currency','paymentNumber','receiptNumber','description','debit','credit','status','createdAt','createdBy'];

function finD_(v) { return String(v || '').slice(0, 10); }
function finNum_(v) { const n = Number(v || 0); return isNaN(n) ? 0 : n; }
function finIn_(d, from, to) { d = finD_(d); return (!from || d >= from) && (!to || d <= to); }
function finCur_(rowCurrency, currency) { return !currency || !rowCurrency || String(rowCurrency) === String(currency); }
function finNorm_(v) { return String(v == null ? '' : v).trim().toLowerCase(); }
function finCmp_(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function finRound_(v) { return Math.round((Number(v) || 0) * 100) / 100; }
function finCol_(key, label, type) { return { key: key, label: label, type: type || 'text' }; }
function finSection_(title, columns, rows, summary) { return { title: title, columns: columns, rows: rows, summary: summary || [] }; }

/** هل القيمة المخزنة (معرّف/رمز/اسم) تشير إلى هذا السجل؟ */
function finMatchRef_(value, rec, codeField, nameField) {
  const v = finNorm_(value);
  if (!v || !rec) return false;
  return [rec.id, rec[codeField], rec[nameField]].some(function(x) { return finNorm_(x) === v; });
}

/** إضافة عمود «الإجمالي» التراكمي لصفوف المبالغ. */
function finRunningTotal_(rows, field, totalField) {
  let sum = 0;
  rows.forEach(function(r) { sum += finNum_(r[field]); r[totalField || 'runningTotal'] = finRound_(sum); });
  return finRound_(sum);
}

/** بيانات القوائم المنسدلة لشاشة التقارير المالية. */
function getFinLookupsFromUi(token) {
  requireUiAdmin_(token);
  return {
    accounts: emReadAll_('General_Ledger').filter(function(r) { return r.active === 'on'; }),
    categories: emReadAll_('Expense_Categories').filter(function(r) { return r.active === 'on'; }),
    currencies: emReadAll_('Currencies').filter(function(r) { return r.active === 'on'; }),
    partners: emReadAll_('Partners').filter(function(r) { return r.active === 'on'; })
  };
}

/** قيد يدوي على الأستاذ العام أو جاري شريك. */
function saveLedgerEntryFromUi(d, token) {
  const u = requireUiAdmin_(token);
  d = d || {};
  if (!d.accountId && !d.partnerId) throw new Error('اختر الحساب أو الشريك.');
  if (d.accountId && !emFindById_('General_Ledger', d.accountId)) throw new Error('الحساب غير موجود.');
  if (d.partnerId && !emFindById_('Partners', d.partnerId)) throw new Error('الشريك غير موجود.');
  const debit = finNum_(d.debit), credit = finNum_(d.credit);
  if (debit < 0 || credit < 0) throw new Error('المبالغ يجب ألا تكون سالبة.');
  if ((debit > 0) === (credit > 0)) throw new Error('أدخل مبلغًا واحدًا فقط: مدين أو دائن.');
  const date = d.entryDate || emToday_();
  emValidateDate_(date, 'تاريخ القيد');
  const r = {
    id: emId_(), entryDate: date, accountId: d.accountId || '', partnerId: d.partnerId || '',
    currency: d.currency || '', paymentNumber: d.paymentNumber || '', receiptNumber: d.receiptNumber || '',
    description: d.description || '', debit: debit, credit: credit, status: 'approved',
    createdAt: emNow_(), createdBy: u.id
  };
  emAppend_('Ledger_Entries', r);
  emAudit_('create', 'Ledger_Entries', r.id, '', null, r, { id: u.id, name: u.username }, '');
  return r;
}

/** نقطة الدخول الوحيدة للتقارير المالية. */
function getFinancialReportFromUi(type, params, token) {
  requireUiAdmin_(token);
  const p = params || {};
  const from = p.fromDate || '', to = p.toDate || '';
  const asOf = p.asOfDate || p.toDate || emToday_();
  switch (type) {
    case 'colors_sizes': return finColorsSizes_();
    case 'ledger': return finLedgerMovement_(p.accountId, p.currency, from, to);
    case 'expense_item_detail': return finExpenseDetail_(from, to, p.expenseCategory, true);
    case 'expense_period_detail': return finExpenseDetail_(from, to, '', false);
    case 'expense_period_total': return finExpenseTotals_(from, to);
    case 'dues': return finDues_(from, to);
    case 'activity_summary': return finActivitySummary_(asOf);
    case 'partners_current': return finPartnersCurrent_(p.partnerId, from, to);
    case 'profit_loss': return finProfitLoss_(from, to);
    case 'trial_balance': return finTrialBalance_(asOf);
    default: throw new Error('نوع التقرير المالي غير معروف: ' + type);
  }
}

/* ---------- 1) بيان الألوان والمقاسات ---------- */
function finColorsSizes_() {
  const items = {};
  emReadAll_('Items').forEach(function(i) { items[i.id] = i; });
  const rows = emReadAll_('Colors_Sizes').filter(function(r) { return r.active === 'on'; });
  const map = function(kind) {
    return rows.filter(function(r) { return r.variantType === kind; })
      .sort(function(a, b) { return finCmp_(String(a.code), String(b.code)); })
      .map(function(r) { return { code: r.code, name: r.name, item: (items[r.itemId] || {}).name || '', barcode: r.barcode || '' }; });
  };
  const cols = function(first) { return [finCol_('code', 'رقم ' + first), finCol_('name', first), finCol_('item', 'الصنف المرتبط'), finCol_('barcode', 'الباركود')]; };
  const colors = map('color'), sizes = map('size');
  return {
    title: 'بيان الألوان والمقاسات',
    sections: [
      finSection_('الألوان', cols('اللون'), colors, [{ label: 'عدد الألوان', value: colors.length }]),
      finSection_('المقاسات', cols('المقاس'), sizes, [{ label: 'عدد المقاسات', value: sizes.length }])
    ]
  };
}

/* ---------- 2) حركة الأستاذ العام ---------- */
/**
 * حركات حساب من: القيود اليدوية + إيصالات الاستلام (حقل «حساب الإيداع») + إيصالات الصرف (حقل «بند المصروف»).
 * الحساب من نوع «أصول»: الاستلام مدين والصرف دائن. بقية الأنواع: الاستلام دائن والصرف مدين.
 */
function finLedgerLines_(account, currency) {
  const isAsset = (account.accountType || 'asset') === 'asset';
  const out = [];
  emReadAll_('Ledger_Entries').forEach(function(e) {
    if (e.status === 'cancelled' || String(e.accountId) !== String(account.id) || !finCur_(e.currency, currency)) return;
    out.push({ date: finD_(e.entryDate), paymentNumber: e.paymentNumber || '', receiptNumber: e.receiptNumber || '', description: e.description || 'قيد يدوي', debit: finNum_(e.debit), credit: finNum_(e.credit) });
  });
  emReadAll_('Cash_Receipts').forEach(function(r) {
    if (r.status !== 'approved' || !finMatchRef_(r.depositAccount, account, 'accountCode', 'accountName') || !finCur_(r.currency, currency)) return;
    const a = finNum_(r.amount);
    out.push({ date: finD_(r.receiptDate), paymentNumber: '', receiptNumber: r.receiptNumber, description: r.description || ('استلام من ' + (r.receivedFromName || '')), debit: isAsset ? a : 0, credit: isAsset ? 0 : a });
  });
  emReadAll_('Cash_Payments').forEach(function(p) {
    if (p.status !== 'approved' || !finMatchRef_(p.expenseCategory, account, 'accountCode', 'accountName') || !finCur_(p.currency, currency)) return;
    const a = finNum_(p.amount);
    out.push({ date: finD_(p.paymentDate), paymentNumber: p.paymentNumber, receiptNumber: '', description: p.description || ('صرف إلى ' + (p.paidToName || '')), debit: isAsset ? 0 : a, credit: isAsset ? a : 0 });
  });
  return out.sort(function(x, y) { return finCmp_(x.date, y.date); });
}

function finLedgerMovement_(accountId, currency, from, to) {
  const account = emFindById_('General_Ledger', accountId);
  if (!account) throw new Error('اختر الحساب أولًا.');
  const lines = finLedgerLines_(account, currency);
  let bal = 0;
  const rows = [];
  lines.forEach(function(l) { if (from && l.date < from) bal += l.debit - l.credit; });
  if (from && bal !== 0) rows.push({ date: from, paymentNumber: '', receiptNumber: '', description: 'رصيد سابق', debit: bal > 0 ? finRound_(bal) : 0, credit: bal < 0 ? finRound_(-bal) : 0, balance: finRound_(bal) });
  let totalDebit = 0, totalCredit = 0;
  lines.forEach(function(l) {
    if (!finIn_(l.date, from, to)) return;
    bal += l.debit - l.credit; totalDebit += l.debit; totalCredit += l.credit;
    rows.push({ date: l.date, paymentNumber: l.paymentNumber, receiptNumber: l.receiptNumber, description: l.description, debit: l.debit, credit: l.credit, balance: finRound_(bal) });
  });
  return {
    title: 'حركة أستاذ عام — ' + (account.accountName || account.accountCode) + (currency ? ' (' + currency + ')' : ''),
    sections: [finSection_('حركة الحساب', [
      finCol_('date', 'التاريخ'), finCol_('paymentNumber', 'إيصال صرف'), finCol_('receiptNumber', 'إيصال استلام'),
      finCol_('description', 'البيان'), finCol_('debit', 'مدين', 'money'), finCol_('credit', 'دائن', 'money'), finCol_('balance', 'الرصيد', 'money')
    ], rows, [
      { label: 'إجمالي المدين', value: finRound_(totalDebit) }, { label: 'إجمالي الدائن', value: finRound_(totalCredit) }, { label: 'الرصيد الختامي', value: finRound_(bal) }
    ])]
  };
}

/* ---------- 3) المصروفات ---------- */
function finCategoryName_(raw, cats) {
  const hit = cats.find(function(c) { return finMatchRef_(raw, c, 'categoryCode', 'name'); });
  return hit ? hit.name : String(raw || '').trim();
}

function finExpensePayments_(from, to) {
  return emReadAll_('Cash_Payments').filter(function(p) {
    return p.status === 'approved' && String(p.expenseCategory || '').trim() && finIn_(p.paymentDate, from, to);
  }).sort(function(a, b) { return finCmp_(finD_(a.paymentDate), finD_(b.paymentDate)); });
}

function finExpenseDetail_(from, to, category, byCategory) {
  const cats = emReadAll_('Expense_Categories');
  let list = finExpensePayments_(from, to);
  let title = 'تفصيلي المصروفات عن فترة';
  if (byCategory) {
    const cat = cats.find(function(c) { return String(c.id) === String(category); });
    if (!cat) throw new Error('اختر بند المصروفات أولًا.');
    list = list.filter(function(p) { return finMatchRef_(p.expenseCategory, cat, 'categoryCode', 'name'); });
    title = 'تفصيلي بند المصروفات — ' + cat.name;
  }
  const rows = list.map(function(p) {
    const label = p.description || '';
    return { date: finD_(p.paymentDate), number: p.paymentNumber, description: byCategory ? (label || finCategoryName_(p.expenseCategory, cats)) : ('[' + finCategoryName_(p.expenseCategory, cats) + '] ' + label), amount: finNum_(p.amount) };
  });
  const total = finRunningTotal_(rows, 'amount', 'runningTotal');
  return {
    title: title,
    sections: [finSection_('قائمة المصروفات', [
      finCol_('date', 'التاريخ'), finCol_('number', 'رقم مستند الصرف'), finCol_('description', 'البيان'),
      finCol_('amount', 'المبلغ', 'money'), finCol_('runningTotal', 'الإجمالي', 'money')
    ], rows, [{ label: 'إجمالي المصروفات', value: total }])]
  };
}

function finExpenseTotals_(from, to) {
  const cats = emReadAll_('Expense_Categories'), by = {};
  finExpensePayments_(from, to).forEach(function(p) {
    const k = finCategoryName_(p.expenseCategory, cats);
    by[k] = (by[k] || 0) + finNum_(p.amount);
  });
  const rows = Object.keys(by).sort().map(function(k) { return { category: k, amount: finRound_(by[k]) }; });
  const total = finRound_(rows.reduce(function(s, r) { return s + r.amount; }, 0));
  return {
    title: 'إجمالي المصروفات عن فترة',
    sections: [finSection_('المصروفات حسب البند', [finCol_('category', 'بند المصروفات'), finCol_('amount', 'المبلغ', 'money')], rows, [{ label: 'الإجمالي', value: total }])]
  };
}

/* ---------- 4) بيان الاستحقاقات (CTRL+H) ---------- */
/** المستحق = شيكات واردة لم تُحصَّل بالكامل وتاريخ استحقاقها ضمن الفترة. */
function finDues_(from, to) {
  const rows = [];
  emReadAll_('Checks_Transactions').forEach(function(c) {
    if (c.direction !== 'in' || !c.dueDate || !finIn_(c.dueDate, from, to)) return;
    if (['collected', 'cancelled', 'returned'].indexOf(String(c.status)) >= 0) return;
    const due = finNum_(c.amount) - finNum_(c.collectedAmount);
    if (due <= 0.0001) return;
    rows.push({ customer: c.customerName || '', reference: 'شيك رقم ' + (c.checkNumber || c.receiptNumber || ''), amount: finRound_(due), dueDate: finD_(c.dueDate) });
  });
  rows.sort(function(a, b) { return finCmp_(a.dueDate, b.dueDate); });
  const total = finRunningTotal_(rows, 'amount', 'runningTotal');
  return {
    title: 'بيان الاستحقاقات',
    sections: [finSection_('الاستحقاقات من ' + (from || '—') + ' إلى ' + (to || '—'), [
      finCol_('customer', 'اسم العميل'), finCol_('reference', 'رقم الفاتورة / الشيك'), finCol_('amount', 'المبلغ المستحق', 'money'),
      finCol_('dueDate', 'تاريخ الاستحقاق'), finCol_('runningTotal', 'الإجمالي', 'money')
    ], rows, [{ label: 'إجمالي المستحق', value: total }])]
  };
}

/* ---------- أرصدة مشتركة (خزينة، أوراق قبض، عملاء، موردون، مخزون، شركاء) ---------- */
function finTreasuryBalance_(asOf) {
  let bal = 0;
  emReadAll_('Opening_Balances').forEach(function(o) { if (o.balanceType === 'cash' && finIn_(o.balanceDate, '', asOf)) bal += finNum_(o.amount); });
  // الإيصال المودَع في حساب أصول من الأستاذ العام يُحتسب في ذلك الحساب وليس في الخزينة (منعًا للتكرار).
  const assetAccounts = emReadAll_('General_Ledger').filter(function(a) { return a.active === 'on' && a.accountType === 'asset'; });
  emReadAll_('Cash_Receipts').forEach(function(r) {
    if (r.status !== 'approved' || r.cashType === 'check' || !finIn_(r.receiptDate, '', asOf)) return;
    if (assetAccounts.some(function(a) { return finMatchRef_(r.depositAccount, a, 'accountCode', 'accountName'); })) return;
    bal += finNum_(r.amount);
  });
  emReadAll_('Cash_Payments').forEach(function(p) { if (p.status === 'approved' && p.cashType !== 'check' && finIn_(p.paymentDate, '', asOf)) bal -= finNum_(p.amount); });
  emReadAll_('Checks_Transactions').forEach(function(c) {
    if (!finIn_(c.transactionDate, '', asOf) || String(c.status) === 'cancelled') return;
    bal += (c.direction === 'in' ? 1 : -1) * finNum_(c.collectedAmount);
  });
  return finRound_(bal);
}

function finNotesReceivable_(asOf) {
  let bal = 0;
  emReadAll_('Checks_Transactions').forEach(function(c) {
    if (c.direction !== 'in' || !finIn_(c.transactionDate, '', asOf) || String(c.status) === 'cancelled' || String(c.status) === 'returned') return;
    bal += Math.max(0, finNum_(c.amount) - finNum_(c.collectedAmount));
  });
  return finRound_(bal);
}

/** رصيد الأطراف (عملاء/موردين): مرتجعات، إيصالات، أرصدة افتتاحية وتسويات. المدين موجب للعميل، والدائن موجب للمورد. */
function finPartyBalances_(kind, asOf) {
  const isCustomer = kind === 'customer';
  const parties = emReadAll_(isCustomer ? 'Customers' : 'Suppliers'), map = {}, byName = {};
  parties.forEach(function(x) {
    map[x.id] = { id: x.id, code: isCustomer ? x.customerCode : x.supplierCode, name: x.name, increase: 0, decrease: 0 };
    byName[finNorm_(x.name)] = x.id;
  });
  const bucket = function(id) { return map[id]; };
  const invoices = {};
  if (isCustomer) {
    emReadAll_('Sales_Invoices').forEach(function(i) {
      if (i.status !== 'approved' || !finIn_(i.invoiceDate, '', asOf)) return;
      invoices[i.id] = i;
      if (i.paymentType === 'credit' && bucket(i.customerId)) bucket(i.customerId).increase += finNum_(i.totalGross);
    });
    emReadAll_('Sales_Returns').forEach(function(r) {
      if (r.status !== 'approved' || !finIn_(r.returnDate, '', asOf)) return;
      const o = invoices[r.salesInvoiceId];
      if (o && o.paymentType === 'credit' && bucket(o.customerId)) bucket(o.customerId).decrease += finNum_(r.totalGross);
    });
  } else {
    emReadAll_('Purchase_Invoices').forEach(function(i) {
      if (i.status !== 'approved' || !finIn_(i.purchaseDate, '', asOf)) return;
      if (bucket(i.supplierId)) bucket(i.supplierId).increase += finNum_(i.totalGross);
    });
    emReadAll_('Purchase_Returns').forEach(function(r) {
      if (r.status !== 'approved' || !finIn_(r.returnDate, '', asOf)) return;
      if (bucket(r.supplierId)) bucket(r.supplierId).decrease += finNum_(r.totalGross);
    });
  }
  const resolve = function(type, id, name) {
    if (id && map[id]) return id;
    return (!type || type === kind) ? byName[finNorm_(name)] : undefined;
  };
  if (isCustomer) {
    emReadAll_('Cash_Receipts').forEach(function(r) {
      if (r.status !== 'approved' || !finIn_(r.receiptDate, '', asOf)) return;
      const id = resolve(r.receivedFromType, r.receivedFromId, r.receivedFromName);
      if (id && bucket(id)) bucket(id).decrease += finNum_(r.amount);
    });
  } else {
    emReadAll_('Cash_Payments').forEach(function(p) {
      if (p.status !== 'approved' || String(p.expenseCategory || '').trim() || !finIn_(p.paymentDate, '', asOf)) return;
      const id = resolve(p.paidToType, p.paidToId, p.paidToName);
      if (id && bucket(id)) bucket(id).decrease += finNum_(p.amount);
    });
  }
  emReadAll_('Opening_Balances').forEach(function(o) {
    if (o.balanceType !== kind || !bucket(o.partyId) || !finIn_(o.balanceDate, '', asOf)) return;
    const a = finNum_(o.amount);
    if (a >= 0) bucket(o.partyId).increase += a; else bucket(o.partyId).decrease += -a;
  });
  emReadAll_('Adjustments').forEach(function(a) {
    if (a.adjustmentType !== kind || a.status !== 'approved' || !bucket(a.partyId) || !finIn_(a.createdAt, '', asOf)) return;
    const v = finNum_(a.amount);
    if (v >= 0) bucket(a.partyId).increase += v; else bucket(a.partyId).decrease += -v;
  });
  return Object.keys(map).map(function(k) {
    const m = map[k];
    return { id: m.id, code: m.code, name: m.name, increase: finRound_(m.increase), decrease: finRound_(m.decrease), balance: finRound_(m.increase - m.decrease) };
  });
}

function finInventoryValue_(asOf) {
  const price = {};
  emReadAll_('Items').forEach(function(i) { price[i.id] = finNum_(i.purchasePrice); });
  const qty = {};
  emReadAll_(EM_INVENTORY_SHEET).forEach(function(t) {
    if (!finIn_(t.transactionDate, '', asOf)) return;
    qty[t.itemId] = (qty[t.itemId] || 0) + finNum_(t.quantityIn) - finNum_(t.quantityOut);
  });
  return finRound_(Object.keys(qty).reduce(function(s, id) { return s + qty[id] * (price[id] || 0); }, 0));
}

/** حركات جاري شريك: الدائن = ما أودعه الشريك، المدين = ما سحبه. */
function finPartnerLines_(partner) {
  const out = [];
  const same = function(type, id, name) {
    if (id) return String(id) === String(partner.id);
    return (!type || type === 'partner') && finNorm_(name) === finNorm_(partner.name);
  };
  emReadAll_('Ledger_Entries').forEach(function(e) {
    if (e.status === 'cancelled' || String(e.partnerId) !== String(partner.id)) return;
    out.push({ date: finD_(e.entryDate), description: e.description || 'قيد يدوي', debit: finNum_(e.debit), credit: finNum_(e.credit) });
  });
  emReadAll_('Cash_Receipts').forEach(function(r) {
    if (r.status === 'approved' && same(r.receivedFromType, r.receivedFromId, r.receivedFromName))
      out.push({ date: finD_(r.receiptDate), description: 'إيداع — إيصال ' + r.receiptNumber + (r.description ? ' — ' + r.description : ''), debit: 0, credit: finNum_(r.amount) });
  });
  emReadAll_('Cash_Payments').forEach(function(p) {
    if (p.status === 'approved' && !String(p.expenseCategory || '').trim() && same(p.paidToType, p.paidToId, p.paidToName))
      out.push({ date: finD_(p.paymentDate), description: 'سحب — إيصال ' + p.paymentNumber + (p.description ? ' — ' + p.description : ''), debit: finNum_(p.amount), credit: 0 });
  });
  emReadAll_('Opening_Balances').forEach(function(o) {
    if (o.balanceType !== 'partner' || String(o.partyId) !== String(partner.id)) return;
    const a = finNum_(o.amount);
    out.push({ date: finD_(o.balanceDate), description: 'رصيد افتتاحي', debit: a < 0 ? -a : 0, credit: a > 0 ? a : 0 });
  });
  return out.sort(function(x, y) { return finCmp_(x.date, y.date); });
}

/* ---------- 5) ملخص النشاط (CTRL+D) ---------- */
function finActivitySummary_(asOf) {
  const treasury = finTreasuryBalance_(asOf), notes = finNotesReceivable_(asOf), inv = finInventoryValue_(asOf);
  const customers = finPartyBalances_('customer', asOf).filter(function(c) { return Math.abs(c.balance) > 0.004; });
  const custTotal = finRound_(customers.reduce(function(s, c) { return s + c.balance; }, 0));
  const rows = [
    { item: 'أرصدة الخزينة', amount: treasury },
    { item: 'أرصدة أوراق القبض', amount: notes },
    { item: 'أرصدة العملاء', amount: custTotal },
    { item: 'تقييم المخزون (بسعر الشراء)', amount: inv }
  ];
  return {
    title: 'ملخص النشاط ليوم ' + asOf,
    sections: [
      finSection_('ملخص النشاط', [finCol_('item', 'البند'), finCol_('amount', 'القيمة', 'money')], rows, []),
      finSection_('تفصيل أرصدة العملاء', [finCol_('code', 'الرمز'), finCol_('name', 'العميل'), finCol_('balance', 'الرصيد', 'money')], customers, [{ label: 'إجمالي أرصدة العملاء', value: custTotal }])
    ]
  };
}

/* ---------- 6) جاري الشركاء ---------- */
function finPartnersCurrent_(partnerId, from, to) {
  const partners = emReadAll_('Partners').filter(function(x) { return x.active === 'on'; });
  const summaryRows = [];
  let grand = 0;
  partners.forEach(function(pt) {
    let dep = 0, wd = 0;
    finPartnerLines_(pt).forEach(function(l) { if (finIn_(l.date, '', to)) { dep += l.credit; wd += l.debit; } });
    const bal = finRound_(dep - wd);
    grand += bal;
    summaryRows.push({ code: pt.partnerCode, name: pt.name, share: finNum_(pt.sharePercent), credit: finRound_(dep), debit: finRound_(wd), balance: bal });
  });
  const sections = [finSection_('أرصدة الشركاء', [
    finCol_('code', 'الرمز'), finCol_('name', 'الشريك'), finCol_('share', 'نسبة المشاركة %', 'money'),
    finCol_('credit', 'دائن (إيداعات)', 'money'), finCol_('debit', 'مدين (سحوبات)', 'money'), finCol_('balance', 'الرصيد', 'money')
  ], summaryRows, [{ label: 'إجمالي أرصدة الشركاء', value: finRound_(grand) }])];
  if (partnerId) {
    const pt = partners.find(function(x) { return String(x.id) === String(partnerId); });
    if (!pt) throw new Error('الشريك غير موجود أو غير نشط.');
    const lines = finPartnerLines_(pt);
    let bal = 0;
    const rows = [];
    lines.forEach(function(l) { if (from && l.date < from) bal += l.credit - l.debit; });
    if (from && bal !== 0) rows.push({ date: from, description: 'رصيد سابق', debit: bal < 0 ? finRound_(-bal) : 0, credit: bal > 0 ? finRound_(bal) : 0, balance: finRound_(bal) });
    lines.forEach(function(l) {
      if (!finIn_(l.date, from, to)) return;
      bal += l.credit - l.debit;
      rows.push({ date: l.date, description: l.description, debit: l.debit, credit: l.credit, balance: finRound_(bal) });
    });
    sections.push(finSection_('حركة جاري الشريك — ' + pt.name, [
      finCol_('date', 'التاريخ'), finCol_('description', 'البيان'), finCol_('debit', 'مدين', 'money'), finCol_('credit', 'دائن', 'money'), finCol_('balance', 'الرصيد', 'money')
    ], rows, [{ label: 'رصيد الشريك الختامي', value: finRound_(bal) }]));
  }
  return { title: 'جاري الشركاء', sections: sections };
}

/* ---------- 7) الأرباح والخسائر ---------- */
/**
 * صافي المبيعات = مبيعات معتمدة قبل الضريبة − مرتجعاتها.
 * تكلفة المبيعات = كمية الأصناف × سعر الشراء (بعد استبعاد الضريبة بنفس نسبة النظام) − المرتجعات.
 * تكاليف مشتريات أخرى = تسويات معتمدة من نوع «تكلفة مشتريات أخرى».
 * المصروفات = إيصالات الصرف المعتمدة التي لها بند مصروف.
 */
function finProfitLoss_(from, to) {
  const vat = 1 + finNum_(getSetting_('vatRate', '15')) / 100;
  const beforeVat = function(h) { return h.netBeforeVat !== '' && h.netBeforeVat != null ? finNum_(h.netBeforeVat) : finNum_(h.totalGross) / vat; };
  const price = {};
  emReadAll_('Items').forEach(function(i) { price[i.id] = finNum_(i.purchasePrice); });
  const sales = emReadAll_('Sales_Invoices').filter(function(i) { return i.status === 'approved' && finIn_(i.invoiceDate, from, to); });
  const saleIds = {}; sales.forEach(function(i) { saleIds[i.id] = true; });
  const rets = emReadAll_('Sales_Returns').filter(function(r) { return r.status === 'approved' && finIn_(r.returnDate, from, to); });
  const retIds = {}; rets.forEach(function(r) { retIds[r.id] = true; });
  const grossSales = finRound_(sales.reduce(function(s, i) { return s + beforeVat(i); }, 0));
  const returns = finRound_(rets.reduce(function(s, r) { return s + beforeVat(r); }, 0));
  const netSales = finRound_(grossSales - returns);
  let cost = 0;
  emReadAll_('Sales_Lines').forEach(function(l) { if (saleIds[l.salesInvoiceId]) cost += finNum_(l.quantity) * (price[l.itemId] || 0) / vat; });
  emReadAll_('Sales_Return_Lines').forEach(function(l) { if (retIds[l.salesReturnId]) cost -= finNum_(l.quantity) * (price[l.itemId] || 0) / vat; });
  cost = finRound_(cost);
  const otherPurchases = finRound_(emReadAll_('Adjustments').filter(function(a) {
    return a.adjustmentType === 'purchase_cost' && a.status === 'approved' && finIn_(a.createdAt, from, to);
  }).reduce(function(s, a) { return s + finNum_(a.amount); }, 0));
  const gross = finRound_(netSales - cost - otherPurchases);
  const expenses = finRound_(finExpensePayments_(from, to).reduce(function(s, p) { return s + finNum_(p.amount); }, 0));
  const net = finRound_(gross - expenses);
  const rows = [
    { item: 'إجمالي المبيعات (بعد الخصم وقبل الضريبة)', amount: grossSales },
    { item: 'مرتجعات المبيعات', amount: -returns },
    { item: 'صافي قيمة المبيعات', amount: netSales },
    { item: 'تكلفة المبيعات (بسعر الشراء)', amount: -cost },
    { item: 'تكاليف مشتريات أخرى', amount: -otherPurchases },
    { item: gross >= 0 ? 'مجمل الربح' : 'مجمل الخسارة', amount: gross },
    { item: 'إجمالي المصروفات', amount: -expenses },
    { item: net >= 0 ? 'صافي الربح' : 'صافي الخسارة', amount: net }
  ];
  return { title: 'الأرباح والخسائر', sections: [finSection_('من ' + (from || '—') + ' إلى ' + (to || '—'), [finCol_('item', 'البيان'), finCol_('amount', 'المبلغ', 'money')], rows, [])] };
}

/* ---------- 8) ميزان المراجعة ---------- */
/**
 * الأصول: الخزينة + أوراق القبض + العملاء (المدينون) + المخزون + حسابات الأستاذ من نوع أصول.
 * الخصوم: الموردون + جاري الشركاء + حسابات الأستاذ من نوع خصوم.
 * الأرصدة العكسية (مثل عميل دائن) تُنقل للجهة المقابلة. الفرق يظهر كـ«صافي حقوق الملكية (محتسب)».
 */
function finTrialBalance_(asOf) {
  const assets = [], liabs = [];
  const place = function(label, value, natural) { // natural: 'asset' | 'liability'
    value = finRound_(value);
    if (Math.abs(value) < 0.005) return;
    const toAsset = natural === 'asset' ? value >= 0 : value < 0;
    (toAsset ? assets : liabs).push({ item: label + (value < 0 ? ' (رصيد عكسي)' : ''), amount: Math.abs(value) });
  };
  place('الخزينة', finTreasuryBalance_(asOf), 'asset');
  place('أوراق القبض', finNotesReceivable_(asOf), 'asset');
  place('العملاء', finPartyBalances_('customer', asOf).reduce(function(s, c) { return s + c.balance; }, 0), 'asset');
  place('المخزون (بسعر الشراء)', finInventoryValue_(asOf), 'asset');
  place('الموردون', finPartyBalances_('supplier', asOf).reduce(function(s, c) { return s + c.balance; }, 0), 'liability');
  let partnersTotal = 0;
  emReadAll_('Partners').filter(function(x) { return x.active === 'on'; }).forEach(function(pt) {
    finPartnerLines_(pt).forEach(function(l) { if (finIn_(l.date, '', asOf)) partnersTotal += l.credit - l.debit; });
  });
  place('جاري الشركاء', partnersTotal, 'liability');
  emReadAll_('General_Ledger').filter(function(a) { return a.active === 'on'; }).forEach(function(acc) {
    if (acc.accountType !== 'asset' && acc.accountType !== 'liability') return;
    const net = finLedgerLines_(acc, '').reduce(function(s, l) { return finIn_(l.date, '', asOf) ? s + l.debit - l.credit : s; }, 0);
    place(acc.accountName || acc.accountCode, acc.accountType === 'asset' ? net : -net, acc.accountType);
  });
  const totalAssets = finRound_(assets.reduce(function(s, r) { return s + r.amount; }, 0));
  const totalLiabs = finRound_(liabs.reduce(function(s, r) { return s + r.amount; }, 0));
  const equity = finRound_(totalAssets - totalLiabs);
  const cols = [finCol_('item', 'البند'), finCol_('amount', 'المبلغ', 'money')];
  return {
    title: 'ميزان المراجعة في ' + asOf,
    sections: [
      finSection_('الأصول', cols, assets, [{ label: 'إجمالي الأصول', value: totalAssets }]),
      finSection_('الخصوم', cols.slice(), liabs.concat([{ item: 'صافي حقوق الملكية (محتسب = الأصول − الخصوم)', amount: equity }]),
        [{ label: 'إجمالي الخصوم', value: totalLiabs }, { label: 'إجمالي الخصوم وحقوق الملكية', value: finRound_(totalLiabs + equity) }])
    ]
  };
}


/** =====================================================================
 * EasyManage v2 — الفواتير والمرتجعات والتحويلات والجرد والتسويات
 * كتلة مضافة في نهاية الملف؛ التعريفات هنا تحل محل التعريفات القديمة بنفس الاسم.
 * كل الدوال التي تأخذ token تستقبله كآخر معامل (تضيفه الواجهة تلقائيًا).
 * ===================================================================== */

if (EM_SHEETS.Customers.indexOf('birthDate') < 0) EM_SHEETS.Customers.push('birthDate');
var EM_BIRTH_CHECKED_ = false;

const EM_DOC_LABELS = { sales_invoice: 'فاتورة بيع', purchase_invoice: 'فاتورة شراء', sales_return: 'مرتجع مبيعات', purchase_return: 'مرتجع مشتريات' };
const EM_PRICE_FIELDS = { purchasePrice: 'سعر الشراء', salePrice: 'سعر البيع', salePriceAfterDiscount: 'سعر البيع بعد الخصم', wholesalePrice: 'سعر الجملة' };
const EM_ADJ_LABELS = { inventory: 'بضاعة', customer: 'عميل', supplier: 'مورد', employee: 'موظف', purchase_cost: 'تكلفة مشتريات أخرى', price: 'أسعار السلع' };

/* ---------- أدوات عامة ---------- */
function emN_(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function emRound4_(v) { return Math.round(emN_(v) * 10000) / 10000; }
function emWithLock_(fn) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function emRowsById_(sheetName) {
  const m = {};
  emReadAll_(sheetName).forEach(function(r) { m[String(r.id)] = r; });
  return m;
}
function emAppendMany_(sheetName, objects) {
  if (!objects || !objects.length) return;
  const sh = emSheet_(sheetName), headers = emHeaders_(sheetName);
  const values = objects.map(function(o) { return headers.map(function(h) { return o[h] === undefined ? '' : o[h]; }); });
  sh.getRange(sh.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
}
function emDeleteWhere_(sheetName, field, value) {
  const sh = emSheet_(sheetName), headers = emHeaders_(sheetName), n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const col = headers.indexOf(field);
  const vals = sh.getRange(2, col + 1, n, 1).getValues();
  let c = 0;
  for (let i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][0]) === String(value)) { sh.deleteRow(i + 2); c++; }
  }
  return c;
}
function emEnsureSequence_(type, prefix) {
  if (emReadAll_('Sequences').some(function(r) { return String(r.documentType) === type; })) return;
  emAppend_('Sequences', { id: emId_(), documentType: type, prefix: prefix, nextNumber: 1, padding: 6, active: 'on', updatedAt: emNow_(), updatedBy: 'system' });
}
function emPartyField_(type) { return type.indexOf('sales') === 0 ? 'customerId' : 'supplierId'; }
function emPartySheet_(type) { return type.indexOf('sales') === 0 ? 'Customers' : 'Suppliers'; }
function emPartyInfo_(r) {
  if (!r) return null;
  return { id: r.id, code: r.customerCode || r.supplierCode || '', name: r.name, phone: r.phone || '', mobile: r.mobile || '', email: r.email || '', address: r.address || '', birthDate: r.birthDate || '', discountRate: emN_(r.discountRate), vatNumber: r.vatNumber || '' };
}
function emStockMap_(warehouseId) {
  const m = {};
  getWarehouseBalances(warehouseId).forEach(function(r) { m[String(r.itemId)] = Number(r.quantity || 0); });
  return m;
}
function emCheckStock_(warehouseId, qtyByItem, names) {
  if (getSetting_('inventory.blockNegative', 'off') !== 'on') return;
  const bal = emStockMap_(warehouseId);
  Object.keys(qtyByItem).forEach(function(id) {
    const have = bal[id] || 0, need = qtyByItem[id];
    if (have < need - 0.00001) {
      throw new Error('الرصيد غير كافٍ للصنف "' + (names[id] || id) + '" — المتاح: ' + emRound4_(have) + ' والمطلوب: ' + emRound4_(need) + '.');
    }
  });
}
function emEnsureCustomerBirthCol_() {
  if (EM_BIRTH_CHECKED_) return;
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Customers');
  if (!sh) { EM_BIRTH_CHECKED_ = true; return; }
  const n = EM_SHEETS.Customers.length;
  if (sh.getMaxColumns() < n) sh.insertColumnsAfter(sh.getMaxColumns(), n - sh.getMaxColumns());
  if (String(sh.getRange(1, n).getValue() || '').trim() !== 'birthDate') {
    sh.getRange(1, n).setValue('birthDate').setFontWeight('bold').setFontColor('#ffffff').setBackground('#0f766e').setHorizontalAlignment('center');
  }
  EM_BIRTH_CHECKED_ = true;
}
/** تشغيل يدوي مرة واحدة (اختياري): يضيف عمود تاريخ الميلاد لورقة العملاء. */
function migrateEasyManageV2() { emEnsureCustomerBirthCol_(); return { ok: true }; }

/* ---------- التحقق: المرتجعات مرتبطة بالفاتورة الأصلية وبكمياتها ---------- */
function emReturnable_(returnType, originalId, excludeId) {
  const sales = returnType === 'sales_return';
  const oc = EM_DOCUMENTS[sales ? 'sales_invoice' : 'purchase_invoice'], rc = EM_DOCUMENTS[returnType];
  const orig = emFindById_(oc.sheet, originalId);
  if (!orig) throw new Error('الفاتورة الأصلية غير موجودة.');
  if (orig.status !== 'approved') throw new Error('لا يمكن إنشاء مرتجع إلا من فاتورة معتمدة.');
  const olines = getDocumentLines_(oc, originalId);
  const retIds = {};
  emReadAll_(rc.sheet).forEach(function(h) {
    if (String(h[rc.originalField]) === String(originalId) && h.status === 'approved' && String(h.id) !== String(excludeId || '')) retIds[h.id] = 1;
  });
  const returned = {};
  emReadAll_(rc.linesSheet).forEach(function(l) {
    if (retIds[l[rc.lineParent]]) { const k = String(l[rc.originalLineField]); returned[k] = (returned[k] || 0) + emN_(l.quantity); }
  });
  const lines = olines.map(function(l) {
    const ret = returned[String(l.id)] || 0, q = emN_(l.quantity);
    return { originalLineId: l.id, itemId: l.itemId, itemCode: l.itemCodeSnapshot, itemName: l.itemNameSnapshot, unitName: l.unitNameSnapshot,
      originalQty: q, returnedQty: emRound4_(ret), remaining: Math.max(0, emRound4_(q - ret)), unitPriceGross: emN_(l.unitPriceGross), discountRate: emN_(l.discountRate) };
  });
  return { orig: orig, lines: lines, number: orig[oc.numberField], date: String(orig[oc.dateField] || '').slice(0, 10) };
}

function emValidateReturn_(documentType, header, lines) {
  const rc = EM_DOCUMENTS[documentType];
  const info = emReturnable_(documentType, header[rc.originalField], header.id);
  const map = {};
  info.lines.forEach(function(l) { map[String(l.originalLineId)] = l; });
  const req = {};
  lines.forEach(function(line, i) {
    const ol = map[String(line[rc.originalLineField])];
    if (!ol) throw new Error('السطر ' + (i + 1) + ' لا يتبع الفاتورة الأصلية.');
    if (String(ol.itemId) !== String(line.itemId)) throw new Error('الصنف في السطر ' + (i + 1) + ' لا يطابق سطر الفاتورة الأصلية.');
    const k = String(ol.originalLineId);
    req[k] = (req[k] || 0) + emN_(line.quantity);
    if (req[k] > ol.remaining + 0.00001) {
      throw new Error('كمية المرتجع للصنف "' + ol.itemName + '" (' + emRound4_(req[k]) + ') تتجاوز المتبقي القابل للإرجاع (' + ol.remaining + ').');
    }
    line.unitPriceGross = ol.unitPriceGross;
    line.discountRate = ol.discountRate;
  });
}

function validateDocumentDraft_(documentType, header, lines) {
  const cfg = EM_DOCUMENTS[documentType];
  emRequired_(Object.assign({}, header, { status: header.status || 'draft' }), cfg.sheet);
  if (header.status && emStatus_(header.status) !== 'draft') throw new Error('الحفظ بهذه الدالة مخصص للمسودة فقط.');
  emValidateDate_(header[cfg.dateField], cfg.dateField);
  emEnsureActiveBranch_(header.branchId);
  emEnsureActiveWarehouse_(header.warehouseId, header.branchId);
  if (cfg.sheet === 'Sales_Invoices' && header.customerId) requireActiveRecord_('Customers', header.customerId, 'العميل');
  if (cfg.sheet === 'Purchase_Invoices') requireActiveRecord_('Suppliers', header.supplierId, 'المورد');
  if (!lines.length) throw new Error('يجب إضافة سطر واحد على الأقل.');
  const items = emRowsById_('Items');
  lines.forEach(function(line, index) {
    const it = items[String(line.itemId)];
    if (!it || it.active !== 'on') throw new Error('الصنف غير موجود أو غير نشط: ' + line.itemId);
    emNumber_(line.quantity, 'quantity في السطر ' + (index + 1), false);
    emNumber_(line.unitPriceGross, 'unitPriceGross في السطر ' + (index + 1), true);
    if (cfg.return && !line[cfg.originalLineField]) throw new Error('السطر ' + (index + 1) + ' يجب أن يرتبط بسطر الفاتورة الأصلية.');
  });
  if (cfg.return) emValidateReturn_(documentType, header, lines);
}

function buildMovementsForDocument_(documentType, header, lines, user) {
  const cfg = EM_DOCUMENTS[documentType], items = emRowsById_('Items');
  if (cfg.direction === 'out') {
    const qty = {}, names = {};
    lines.forEach(function(l) { qty[l.itemId] = (qty[l.itemId] || 0) + emN_(l.quantity); names[l.itemId] = l.itemNameSnapshot; });
    emCheckStock_(header.warehouseId, qty, names);
  }
  const now = emNow_(), movements = [];
  lines.forEach(function(line) {
    const item = items[String(line.itemId)];
    if (!item || item.active !== 'on') throw new Error('الصنف غير موجود أو غير نشط: ' + line.itemId);
    const quantity = emNumber_(line.quantity, 'quantity', false);
    movements.push({
      id: emId_(), transactionDate: now,
      transactionType: cfg.return ? 'return' : (documentType.indexOf('sales') === 0 ? 'sale' : 'purchase'),
      sourceType: documentType, sourceId: header.id, sourceNumber: header[cfg.numberField],
      originalInvoiceId: cfg.return ? header[cfg.originalField] : header.id,
      branchId: header.branchId, warehouseId: header.warehouseId, itemId: item.id,
      itemCodeSnapshot: item.itemCode, itemNameSnapshot: item.name,
      quantityIn: cfg.direction === 'in' ? quantity : 0, quantityOut: cfg.direction === 'out' ? quantity : 0,
      unitCostGross: emOptionalNumber_(line.unitPriceGross, 'unitPriceGross'),
      currency: header.currency || getSetting_('currency', 'ر.س'), notes: '', createdAt: now, createdBy: user.id
    });
  });
  return movements;
}

/* ---------- حفظ المستندات (مع حساب الإجماليات للمسودة) ---------- */
function emSaveDraftWithTotals_(type, header, lines, user) {
  const r = saveDocumentDraft(type, header, lines, { id: user.id, name: user.username });
  const cfg = EM_DOCUMENTS[type], h = r.header;
  calculateHeaderTotals_(h, r.lines);
  emUpdateById_(cfg.sheet, h.id, h);
  return { header: h, lines: r.lines };
}
function emSalesSettings_() {
  return { requireCustomer: getSetting_('sales.requireCustomer', 'off'), requireSeller: getSetting_('sales.requireSeller', 'off'), discountEnabled: getSetting_('sales.discountEnabled', 'on') };
}
function saveSalesInvoiceFromUi(header, lines, token) {
  const u = requireUiPermission_(token, 'sales_write'), h = Object.assign({}, header || {}), s = emSalesSettings_();
  if (s.requireCustomer === 'on' && !h.customerId) throw new Error('اسم العميل مطلوب حسب إعدادات فواتير البيع.');
  if (s.requireSeller === 'on' && !h.sellerEmployeeId && !String(h.sellerName || '').trim()) throw new Error('اسم البائع مطلوب حسب إعدادات فواتير البيع.');
  if (s.discountEnabled === 'off') (lines || []).forEach(function(x) { x.discountRate = 0; });
  return emSaveDraftWithTotals_('sales_invoice', h, lines || [], u);
}
function savePurchaseInvoiceFromUi(header, lines, token) {
  const u = requireUiPermission_(token, 'purchase_write');
  return emSaveDraftWithTotals_('purchase_invoice', Object.assign({}, header || {}), lines || [], u);
}
function saveReturnFromUi(returnType, header, lines, token) {
  const docType = returnType === 'purchase_return' ? 'purchase_return' : 'sales_return';
  const u = requireUiPermission_(token, docType === 'sales_return' ? 'sales_write' : 'purchase_write');
  const rc = EM_DOCUMENTS[docType], h = Object.assign({}, header || {});
  const info = emReturnable_(docType, h[rc.originalField], h.id);
  const pf = emPartyField_(docType);
  h[pf] = info.orig[pf] || '';
  h.branchId = h.branchId || info.orig.branchId;
  h.warehouseId = h.warehouseId || info.orig.warehouseId;
  return emSaveDraftWithTotals_(docType, h, lines || [], u);
}
function cancelDocumentFromUi(documentType, id, reason, token) {
  const u = requireUiPermission_(token, 'document_cancel'), cfg = EM_DOCUMENTS[documentType];
  if (!cfg) throw new Error('نوع المستند غير معروف.');
  if (!cfg.return) {
    const rc = EM_DOCUMENTS[documentType === 'sales_invoice' ? 'sales_return' : 'purchase_return'];
    const has = emReadAll_(rc.sheet).some(function(h) { return String(h[rc.originalField]) === String(id) && h.status !== 'cancelled'; });
    if (has) throw new Error('لا يمكن إلغاء الفاتورة لوجود مرتجعات مرتبطة بها. ألغِ المرتجعات أولًا.');
  }
  return cancelDocument(documentType, id, reason, { id: u.id, name: u.username });
}
function deleteDraftDocumentFromUi(documentType, id, token) {
  const cfg = EM_DOCUMENTS[documentType];
  if (!cfg) throw new Error('نوع المستند غير معروف.');
  const u = requireUiPermission_(token, documentType.indexOf('sales') === 0 ? 'sales_write' : 'purchase_write');
  return emWithLock_(function() {
    const h = emFindById_(cfg.sheet, id);
    if (!h) throw new Error('المستند غير موجود.');
    if (h.status !== 'draft') throw new Error('يُحذف المستند وهو مسودة فقط؛ المستند المعتمد يُلغى.');
    emDeleteWhere_(cfg.linesSheet, cfg.lineParent, id);
    emDeleteWhere_(cfg.sheet, 'id', id);
    emAudit_('delete_draft', cfg.sheet, id, h[cfg.numberField], h, null, { id: u.id, name: u.username }, '');
    return { ok: true, id: id };
  });
}

/* ---------- الاستعلامات ---------- */
function getDocContextFromUi(token) {
  getSessionUser(token);
  return {
    vatRate: emN_(getSetting_('vatRate', '15')), blockNegative: getSetting_('inventory.blockNegative', 'off'),
    showItemImage: getSetting_('sales.showItemImage', 'off'), discountEnabled: getSetting_('sales.discountEnabled', 'on'),
    requireCustomer: getSetting_('sales.requireCustomer', 'off'), requireSeller: getSetting_('sales.requireSeller', 'off'),
    currency: getSetting_('currency', 'ر.س'), company: getSetting_('companyName', ''), paper: getSetting_('sales.paperSize', 'A4')
  };
}
function getWarehouseBalancesMapFromUi(warehouseId, token) {
  getSessionUser(token);
  return warehouseId ? emStockMap_(warehouseId) : {};
}
function getPartyInfoFromUi(kind, partyId, token) {
  getSessionUser(token);
  const k = kind === 'supplier' ? 'supplier' : 'customer';
  const rec = emFindById_(k === 'customer' ? 'Customers' : 'Suppliers', partyId);
  if (!rec) throw new Error('الطرف غير موجود.');
  const b = finPartyBalances_(k, emToday_()).find(function(x) { return String(x.id) === String(partyId); }) || { increase: 0, decrease: 0, balance: 0 };
  const info = emPartyInfo_(rec);
  info.balance = b.balance; info.increase = b.increase; info.decrease = b.decrease;
  return info;
}
function listDocumentsFromUi(f, token) {
  getSessionUser(token);
  f = f || {};
  const types = f.type ? [f.type] : Object.keys(EM_DOCUMENTS);
  const customers = emRowsById_('Customers'), suppliers = emRowsById_('Suppliers'), branches = emRowsById_('Branches'), whs = emRowsById_('Warehouses');
  const origMaps = {};
  const q = String(f.q || '').trim().toLowerCase();
  let out = [];
  types.forEach(function(type) {
    const cfg = EM_DOCUMENTS[type];
    if (!cfg) return;
    if (cfg.return && !origMaps[type]) {
      const oc = EM_DOCUMENTS[type === 'sales_return' ? 'sales_invoice' : 'purchase_invoice'];
      origMaps[type] = { map: emRowsById_(oc.sheet), numField: oc.numberField };
    }
    const pmap = type.indexOf('sales') === 0 ? customers : suppliers, pf = emPartyField_(type);
    emReadAll_(cfg.sheet).forEach(function(h) {
      const d = String(h[cfg.dateField] || '').slice(0, 10);
      if (f.status && h.status !== f.status) return;
      if (f.from && d < f.from) return;
      if (f.to && d > f.to) return;
      const party = pmap[String(h[pf])] || {};
      const origNo = cfg.return ? ((origMaps[type].map[String(h[cfg.originalField])] || {})[origMaps[type].numField] || '') : '';
      const number = h[cfg.numberField];
      if (q && String(number).toLowerCase().indexOf(q) < 0 && String(party.name || '').toLowerCase().indexOf(q) < 0 && String(h.supplierInvoiceNumber || '').toLowerCase().indexOf(q) < 0) return;
      out.push({
        id: h.id, type: type, typeLabel: EM_DOC_LABELS[type], number: number, date: d, status: h.status,
        totalGross: emN_(h.totalGross), currency: h.currency || '', partyName: party.name || '', paymentType: h.paymentType || '',
        branchName: (branches[String(h.branchId)] || {}).name || '', warehouseName: (whs[String(h.warehouseId)] || {}).name || '',
        originalNumber: origNo, supplierInvoiceNumber: h.supplierInvoiceNumber || ''
      });
    });
  });
  out.sort(function(a, b) { return a.date === b.date ? (a.number < b.number ? 1 : -1) : (a.date < b.date ? 1 : -1); });
  return out.slice(0, Number(f.limit) || 400);
}
function getDocumentFromUi(type, id, token) {
  getSessionUser(token);
  const cfg = EM_DOCUMENTS[type];
  if (!cfg) throw new Error('نوع المستند غير معروف.');
  const h = emFindById_(cfg.sheet, id);
  if (!h) throw new Error('المستند غير موجود.');
  const lines = getDocumentLines_(cfg, id), pf = emPartyField_(type);
  const party = h[pf] ? emFindById_(emPartySheet_(type), h[pf]) : null;
  let original = null;
  if (cfg.return) {
    const oc = EM_DOCUMENTS[type === 'sales_return' ? 'sales_invoice' : 'purchase_invoice'], o = emFindById_(oc.sheet, h[cfg.originalField]);
    if (o) original = { id: o.id, number: o[oc.numberField], date: String(o[oc.dateField] || '').slice(0, 10) };
  }
  const seller = h.sellerEmployeeId ? emFindById_('Employees', h.sellerEmployeeId) : null;
  return {
    type: type, typeLabel: EM_DOC_LABELS[type], header: h, lines: lines, party: emPartyInfo_(party),
    branchName: (emFindById_('Branches', h.branchId) || {}).name || '', warehouseName: (emFindById_('Warehouses', h.warehouseId) || {}).name || '',
    sellerName: seller ? seller.name : '', original: original, vatRate: emN_(getSetting_('vatRate', '15')),
    company: getSetting_('companyName', ''), number: h[cfg.numberField]
  };
}
function getReturnableInvoicesFromUi(returnType, token) {
  getSessionUser(token);
  const sales = returnType !== 'purchase_return', oc = EM_DOCUMENTS[sales ? 'sales_invoice' : 'purchase_invoice'];
  const pmap = emRowsById_(sales ? 'Customers' : 'Suppliers'), pf = sales ? 'customerId' : 'supplierId';
  return emReadAll_(oc.sheet).filter(function(h) { return h.status === 'approved'; }).map(function(h) {
    return { id: h.id, number: h[oc.numberField], date: String(h[oc.dateField] || '').slice(0, 10), partyName: (pmap[String(h[pf])] || {}).name || '', totalGross: emN_(h.totalGross) };
  }).sort(function(a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); }).slice(0, 500);
}
function getReturnableLinesFromUi(returnType, originalId, excludeReturnId, token) {
  getSessionUser(token);
  const type = returnType === 'purchase_return' ? 'purchase_return' : 'sales_return';
  const info = emReturnable_(type, originalId, excludeReturnId);
  const pf = emPartyField_(type), party = info.orig[pf] ? emFindById_(emPartySheet_(type), info.orig[pf]) : null;
  return {
    original: { id: info.orig.id, number: info.number, date: info.date, branchId: info.orig.branchId, warehouseId: info.orig.warehouseId, partyId: info.orig[pf] || '', partyName: party ? party.name : '', currency: info.orig.currency || '' },
    lines: info.lines
  };
}

/* ---------- تحويل البضاعة بين المخازن ---------- */
function saveTransferDraftFromUi(d, token) {
  const u = requireUiPermission_(token, 'inventory_write');
  return emWithLock_(function() {
    d = d || {};
    const date = emValidateDate_(d.transferDate || emToday_(), 'تاريخ التحويل');
    const from = emEnsureActiveWarehouse_(d.fromWarehouseId), to = emEnsureActiveWarehouse_(d.toWarehouseId);
    if (String(from.id) === String(to.id)) throw new Error('المخزن المحوّل منه والمحوّل إليه متطابقان.');
    const lines = Array.isArray(d.lines) ? d.lines : [];
    if (!lines.length) throw new Error('أضف صنفًا واحدًا على الأقل.');
    const items = emRowsById_('Items'), units = emRowsById_('Units'), seen = {};
    const rows = lines.map(function(x, i) {
      const it = items[String(x.itemId)];
      if (!it || it.active !== 'on') throw new Error('الصنف غير موجود أو غير نشط في السطر ' + (i + 1));
      if (seen[it.id]) throw new Error('الصنف "' + it.name + '" مكرر في الإذن.');
      seen[it.id] = 1;
      const cost = (x.unitCostGross === '' || x.unitCostGross == null) ? emN_(it.purchasePrice) : emN_(x.unitCostGross);
      return { item: it, qty: emNumber_(x.quantity, 'الكمية في السطر ' + (i + 1), false), cost: cost };
    });
    const old = d.id ? emFindById_('Transfers', d.id) : null;
    if (d.id && !old) throw new Error('الإذن غير موجود.');
    if (old && old.status !== 'draft') throw new Error('لا يمكن تعديل إذن غير مسودة.');
    emEnsureSequence_('transfer', 'TR-');
    const now = emNow_(), id = old ? old.id : emId_();
    const h = { id: id, transferNumber: old ? old.transferNumber : nextDocumentNumber_('transfer', 'transferPrefix'), transferDate: date,
      fromBranchId: from.branchId, fromWarehouseId: from.id, toBranchId: to.branchId, toWarehouseId: to.id, status: 'draft', notes: String(d.notes || ''),
      createdAt: old ? old.createdAt : now, updatedAt: now, createdBy: old ? old.createdBy : u.id, updatedBy: u.id, approvedAt: '', approvedBy: '' };
    if (old) emUpdateById_('Transfers', id, h); else emAppend_('Transfers', h);
    emDeleteWhere_('Transfer_Lines', 'transferId', id);
    emAppendMany_('Transfer_Lines', rows.map(function(r, i) {
      return { id: emId_(), transferId: id, lineNo: i + 1, itemId: r.item.id, itemCodeSnapshot: r.item.itemCode, itemNameSnapshot: r.item.name,
        unitId: r.item.unitId, unitNameSnapshot: (units[String(r.item.unitId)] || {}).name || '', quantity: r.qty, unitCostGross: r.cost, notes: '' };
    }));
    emAudit_(old ? 'update' : 'create', 'Transfers', id, h.transferNumber, old, h, { id: u.id, name: u.username }, '');
    return { header: h };
  });
}
function approveTransferFromUi(id, token) {
  const u = requireUiPermission_(token, 'document_approve');
  return emWithLock_(function() {
    const h = emFindById_('Transfers', id);
    if (!h) throw new Error('الإذن غير موجود.');
    if (h.status === 'approved') return { header: h, movements: [] };
    if (h.status !== 'draft') throw new Error('لا يمكن اعتماد إذن ملغى.');
    const lines = emReadAll_('Transfer_Lines').filter(function(x) { return String(x.transferId) === String(id); });
    if (!lines.length) throw new Error('الإذن بلا أصناف.');
    const qty = {}, names = {};
    lines.forEach(function(l) { qty[l.itemId] = (qty[l.itemId] || 0) + emN_(l.quantity); names[l.itemId] = l.itemNameSnapshot; });
    emCheckStock_(h.fromWarehouseId, qty, names);
    const now = emNow_(), cur = getSetting_('currency', 'ر.س'), mv = [];
    lines.forEach(function(l) {
      const base = { transactionDate: now, sourceType: 'transfer', sourceId: id, sourceNumber: h.transferNumber, itemId: l.itemId, itemCodeSnapshot: l.itemCodeSnapshot,
        itemNameSnapshot: l.itemNameSnapshot, unitCostGross: l.unitCostGross, currency: cur, notes: '', createdAt: now, createdBy: u.id };
      mv.push(Object.assign({ id: emId_(), transactionType: 'transfer_out', branchId: h.fromBranchId, warehouseId: h.fromWarehouseId, quantityIn: 0, quantityOut: emN_(l.quantity) }, base));
      mv.push(Object.assign({ id: emId_(), transactionType: 'transfer_in', branchId: h.toBranchId, warehouseId: h.toWarehouseId, quantityIn: emN_(l.quantity), quantityOut: 0 }, base));
    });
    emAppendMany_(EM_INVENTORY_SHEET, mv);
    h.status = 'approved'; h.approvedAt = now; h.approvedBy = u.id; h.updatedAt = now; h.updatedBy = u.id;
    emUpdateById_('Transfers', id, h);
    emAudit_('approve', 'Transfers', id, h.transferNumber, null, h, { id: u.id, name: u.username }, '');
    return { header: h, movements: mv };
  });
}
function emReverseMovements_(sourceType, id, number, reason, user) {
  const now = emNow_();
  const rev = emReadAll_(EM_INVENTORY_SHEET).filter(function(m) { return String(m.sourceId) === String(id) && String(m.sourceType) === sourceType; }).map(function(m) {
    const c = Object.assign({}, m);
    c.id = emId_(); c.transactionDate = now; c.transactionType = 'cancellation_reversal'; c.sourceType = sourceType + '_cancellation';
    c.quantityIn = m.quantityOut || 0; c.quantityOut = m.quantityIn || 0; c.notes = 'عكس مستند ملغى: ' + reason; c.createdAt = now; c.createdBy = user.id;
    return c;
  });
  emAppendMany_(EM_INVENTORY_SHEET, rev);
  return rev;
}
function cancelTransferFromUi(id, reason, token) {
  const u = requireUiPermission_(token, 'document_cancel');
  return emWithLock_(function() {
    const h = emFindById_('Transfers', id);
    if (!h) throw new Error('الإذن غير موجود.');
    if (h.status === 'cancelled') return h;
    if (!String(reason || '').trim()) throw new Error('سبب الإلغاء مطلوب.');
    const rev = h.status === 'approved' ? emReverseMovements_('transfer', id, h.transferNumber, String(reason).trim(), u) : [];
    h.status = 'cancelled'; h.notes = (h.notes ? h.notes + ' | ' : '') + 'ملغى: ' + String(reason).trim(); h.updatedAt = emNow_(); h.updatedBy = u.id;
    emUpdateById_('Transfers', id, h);
    emAudit_('cancel', 'Transfers', id, h.transferNumber, null, h, { id: u.id, name: u.username }, reason);
    return { header: h, reversals: rev };
  });
}
function deleteDraftTransferFromUi(id, token) {
  const u = requireUiPermission_(token, 'inventory_write');
  return emWithLock_(function() {
    const h = emFindById_('Transfers', id);
    if (!h) throw new Error('الإذن غير موجود.');
    if (h.status !== 'draft') throw new Error('يُحذف الإذن وهو مسودة فقط؛ المعتمد يُلغى.');
    emDeleteWhere_('Transfer_Lines', 'transferId', id);
    emDeleteWhere_('Transfers', 'id', id);
    emAudit_('delete_draft', 'Transfers', id, h.transferNumber, h, null, { id: u.id, name: u.username }, '');
    return { ok: true };
  });
}
function listTransfersFromUi(f, token) {
  getSessionUser(token);
  f = f || {};
  const whs = emRowsById_('Warehouses'), counts = {}, total = {};
  emReadAll_('Transfer_Lines').forEach(function(l) { counts[l.transferId] = (counts[l.transferId] || 0) + 1; total[l.transferId] = (total[l.transferId] || 0) + emN_(l.quantity) * emN_(l.unitCostGross); });
  return emReadAll_('Transfers').filter(function(h) {
    const d = String(h.transferDate || '').slice(0, 10);
    return (!f.status || h.status === f.status) && (!f.from || d >= f.from) && (!f.to || d <= f.to);
  }).map(function(h) {
    return { id: h.id, number: h.transferNumber, date: String(h.transferDate || '').slice(0, 10), status: h.status, fromName: (whs[String(h.fromWarehouseId)] || {}).name || '', toName: (whs[String(h.toWarehouseId)] || {}).name || '',
      lineCount: counts[h.id] || 0, total: emRound4_(total[h.id] || 0), notes: h.notes || '' };
  }).sort(function(a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : (a.number < b.number ? 1 : -1)); }).slice(0, 300);
}
function getTransferFromUi(id, token) {
  getSessionUser(token);
  const h = emFindById_('Transfers', id);
  if (!h) throw new Error('الإذن غير موجود.');
  const lines = emReadAll_('Transfer_Lines').filter(function(x) { return String(x.transferId) === String(id); }).sort(function(a, b) { return emN_(a.lineNo) - emN_(b.lineNo); });
  return { header: h, lines: lines, fromName: (emFindById_('Warehouses', h.fromWarehouseId) || {}).name || '', toName: (emFindById_('Warehouses', h.toWarehouseId) || {}).name || '',
    fromBranchName: (emFindById_('Branches', h.fromBranchId) || {}).name || '', toBranchName: (emFindById_('Branches', h.toBranchId) || {}).name || '', company: getSetting_('companyName', '') };
}

/* ---------- الجرد ---------- */
function emGroupSet_(groupId) {
  const set = {};
  if (!groupId) return null;
  const groups = emReadAll_('Groups');
  set[String(groupId)] = true;
  let changed = true;
  while (changed) {
    changed = false;
    groups.forEach(function(g) { if (g.parentGroupId && set[String(g.parentGroupId)] && !set[String(g.id)]) { set[String(g.id)] = true; changed = true; } });
  }
  return set;
}
function emGroupLabel_(g, gmap) {
  if (!g) return '';
  const p = g.parentGroupId ? gmap[String(g.parentGroupId)] : null;
  return p ? p.name + ' / ' + g.name : g.name;
}
function getStocktakeSheetFromUi(warehouseId, groupId, token) {
  getSessionUser(token);
  emEnsureActiveWarehouse_(warehouseId);
  const set = emGroupSet_(groupId), gmap = emRowsById_('Groups'), units = emRowsById_('Units'), bal = emStockMap_(warehouseId);
  return emReadAll_('Items').filter(function(i) { return i.active === 'on' && (!set || set[String(i.groupId)]); }).map(function(i) {
    return { itemId: i.id, itemCode: i.itemCode, itemName: i.name, unitName: (units[String(i.unitId)] || {}).name || '', groupName: emGroupLabel_(gmap[String(i.groupId)], gmap), systemQuantity: emRound4_(bal[String(i.id)] || 0) };
  }).sort(function(a, b) { return a.groupName === b.groupName ? (a.itemCode < b.itemCode ? -1 : 1) : (a.groupName < b.groupName ? -1 : 1); });
}
function saveStocktakeDraftFromUi(d, token) {
  const u = requireUiPermission_(token, 'inventory_write');
  return emWithLock_(function() {
    d = d || {};
    const wh = emEnsureActiveWarehouse_(d.warehouseId), date = emValidateDate_(d.stocktakeDate || emToday_(), 'تاريخ الجرد');
    const lines = (Array.isArray(d.lines) ? d.lines : []).filter(function(x) { return x.countedQuantity !== '' && x.countedQuantity != null; });
    if (!lines.length) throw new Error('أدخل الكمية الفعلية لصنف واحد على الأقل.');
    const items = emRowsById_('Items'), bal = emStockMap_(wh.id), seen = {};
    const rows = lines.map(function(x, i) {
      const it = items[String(x.itemId)];
      if (!it || it.active !== 'on') throw new Error('الصنف غير موجود أو غير نشط في السطر ' + (i + 1));
      if (seen[it.id]) throw new Error('الصنف "' + it.name + '" مكرر.');
      seen[it.id] = 1;
      const counted = emNumber_(x.countedQuantity, 'الكمية الفعلية للصنف ' + it.name, true), sys = bal[String(it.id)] || 0;
      return { item: it, counted: counted, sys: emRound4_(sys), diff: emRound4_(counted - sys) };
    });
    const old = d.id ? emFindById_('Stocktakes', d.id) : null;
    if (d.id && !old) throw new Error('الجرد غير موجود.');
    if (old && old.status !== 'draft') throw new Error('لا يمكن تعديل جرد غير مسودة.');
    emEnsureSequence_('stocktake', 'ST-');
    const now = emNow_(), id = old ? old.id : emId_();
    const h = { id: id, stocktakeNumber: old ? old.stocktakeNumber : nextDocumentNumber_('stocktake', 'stocktakePrefix'), stocktakeDate: date, branchId: wh.branchId, warehouseId: wh.id, status: 'draft',
      notes: JSON.stringify({ groupId: d.groupId || '', text: String(d.notes || '') }), createdAt: old ? old.createdAt : now, updatedAt: now, createdBy: old ? old.createdBy : u.id, updatedBy: u.id, approvedAt: '', approvedBy: '' };
    if (old) emUpdateById_('Stocktakes', id, h); else emAppend_('Stocktakes', h);
    emDeleteWhere_('Stocktake_Lines', 'stocktakeId', id);
    emAppendMany_('Stocktake_Lines', rows.map(function(r, i) {
      return { id: emId_(), stocktakeId: id, lineNo: i + 1, itemId: r.item.id, itemCodeSnapshot: r.item.itemCode, itemNameSnapshot: r.item.name, systemQuantity: r.sys, countedQuantity: r.counted, differenceQuantity: r.diff, unitCostGross: emN_(r.item.purchasePrice), notes: '' };
    }));
    emAudit_(old ? 'update' : 'create', 'Stocktakes', id, h.stocktakeNumber, old, h, { id: u.id, name: u.username }, '');
    return { header: h };
  });
}
function approveStocktakeFromUi(id, token) {
  const u = requireUiPermission_(token, 'document_approve');
  return emWithLock_(function() {
    const h = emFindById_('Stocktakes', id);
    if (!h) throw new Error('الجرد غير موجود.');
    if (h.status === 'approved') return { header: h, movements: [], shortage: 0, surplus: 0 };
    if (h.status !== 'draft') throw new Error('لا يمكن اعتماد جرد ملغى.');
    const lines = emReadAll_('Stocktake_Lines').filter(function(x) { return String(x.stocktakeId) === String(id); });
    const bal = emStockMap_(h.warehouseId), now = emNow_(), cur = getSetting_('currency', 'ر.س');
    const mv = [], upd = []; let shortage = 0, surplus = 0;
    lines.forEach(function(l) {
      const sys = bal[String(l.itemId)] || 0, diff = emRound4_(emN_(l.countedQuantity) - sys);
      if (diff) {
        if (diff < 0) shortage += -diff; else surplus += diff;
        mv.push({ id: emId_(), transactionDate: now, transactionType: 'stocktake_adjustment', sourceType: 'stocktake', sourceId: id, sourceNumber: h.stocktakeNumber, branchId: h.branchId, warehouseId: h.warehouseId,
          itemId: l.itemId, itemCodeSnapshot: l.itemCodeSnapshot, itemNameSnapshot: l.itemNameSnapshot, quantityIn: diff > 0 ? diff : 0, quantityOut: diff < 0 ? -diff : 0, unitCostGross: l.unitCostGross, currency: cur, notes: 'تسوية جرد', createdAt: now, createdBy: u.id });
      }
      upd.push(Object.assign({}, l, { systemQuantity: emRound4_(sys), differenceQuantity: diff }));
    });
    emAppendMany_(EM_INVENTORY_SHEET, mv);
    emDeleteWhere_('Stocktake_Lines', 'stocktakeId', id);
    emAppendMany_('Stocktake_Lines', upd);
    h.status = 'approved'; h.approvedAt = now; h.approvedBy = u.id; h.updatedAt = now; h.updatedBy = u.id;
    emUpdateById_('Stocktakes', id, h);
    emAudit_('approve', 'Stocktakes', id, h.stocktakeNumber, null, h, { id: u.id, name: u.username }, '');
    return { header: h, movements: mv, shortage: emRound4_(shortage), surplus: emRound4_(surplus) };
  });
}
function cancelStocktakeFromUi(id, reason, token) {
  const u = requireUiPermission_(token, 'document_cancel');
  return emWithLock_(function() {
    const h = emFindById_('Stocktakes', id);
    if (!h) throw new Error('الجرد غير موجود.');
    if (h.status === 'cancelled') return h;
    if (!String(reason || '').trim()) throw new Error('سبب الإلغاء مطلوب.');
    const rev = h.status === 'approved' ? emReverseMovements_('stocktake', id, h.stocktakeNumber, String(reason).trim(), u) : [];
    h.status = 'cancelled'; h.updatedAt = emNow_(); h.updatedBy = u.id;
    emUpdateById_('Stocktakes', id, h);
    emAudit_('cancel', 'Stocktakes', id, h.stocktakeNumber, null, h, { id: u.id, name: u.username }, reason);
    return { header: h, reversals: rev };
  });
}
function deleteDraftStocktakeFromUi(id, token) {
  const u = requireUiPermission_(token, 'inventory_write');
  return emWithLock_(function() {
    const h = emFindById_('Stocktakes', id);
    if (!h) throw new Error('الجرد غير موجود.');
    if (h.status !== 'draft') throw new Error('يُحذف الجرد وهو مسودة فقط؛ المعتمد يُلغى.');
    emDeleteWhere_('Stocktake_Lines', 'stocktakeId', id);
    emDeleteWhere_('Stocktakes', 'id', id);
    emAudit_('delete_draft', 'Stocktakes', id, h.stocktakeNumber, h, null, { id: u.id, name: u.username }, '');
    return { ok: true };
  });
}
function emParseNotes_(s) { try { const o = JSON.parse(s); return o && typeof o === 'object' ? o : { text: String(s || '') }; } catch (e) { return { groupId: '', text: String(s || '') }; } }
function listStocktakesFromUi(f, token) {
  getSessionUser(token);
  f = f || {};
  const whs = emRowsById_('Warehouses'), gmap = emRowsById_('Groups'), cnt = {}, diffs = {};
  emReadAll_('Stocktake_Lines').forEach(function(l) { cnt[l.stocktakeId] = (cnt[l.stocktakeId] || 0) + 1; diffs[l.stocktakeId] = (diffs[l.stocktakeId] || 0) + emN_(l.differenceQuantity); });
  return emReadAll_('Stocktakes').filter(function(h) {
    const d = String(h.stocktakeDate || '').slice(0, 10);
    return (!f.status || h.status === f.status) && (!f.from || d >= f.from) && (!f.to || d <= f.to);
  }).map(function(h) {
    const n = emParseNotes_(h.notes);
    return { id: h.id, number: h.stocktakeNumber, date: String(h.stocktakeDate || '').slice(0, 10), status: h.status, warehouseName: (whs[String(h.warehouseId)] || {}).name || '',
      scope: n.groupId ? 'مجموعة: ' + ((gmap[String(n.groupId)] || {}).name || '') : 'إجمالي', lineCount: cnt[h.id] || 0, netDifference: emRound4_(diffs[h.id] || 0), notes: n.text || '' };
  }).sort(function(a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : (a.number < b.number ? 1 : -1)); }).slice(0, 300);
}
function getStocktakeFromUi(id, token) {
  getSessionUser(token);
  const h = emFindById_('Stocktakes', id);
  if (!h) throw new Error('الجرد غير موجود.');
  const items = emRowsById_('Items'), units = emRowsById_('Units'), gmap = emRowsById_('Groups');
  const lines = emReadAll_('Stocktake_Lines').filter(function(x) { return String(x.stocktakeId) === String(id); }).sort(function(a, b) { return emN_(a.lineNo) - emN_(b.lineNo); }).map(function(l) {
    const it = items[String(l.itemId)] || {};
    return { itemId: l.itemId, itemCode: l.itemCodeSnapshot, itemName: l.itemNameSnapshot, unitName: (units[String(it.unitId)] || {}).name || '', groupName: emGroupLabel_(gmap[String(it.groupId)], gmap),
      systemQuantity: emN_(l.systemQuantity), countedQuantity: emN_(l.countedQuantity), differenceQuantity: emN_(l.differenceQuantity) };
  });
  const n = emParseNotes_(h.notes);
  return { header: h, lines: lines, groupId: n.groupId || '', text: n.text || '', warehouseName: (emFindById_('Warehouses', h.warehouseId) || {}).name || '', company: getSetting_('companyName', '') };
}

/* ---------- التسويات ---------- */
function saveAdjustmentFromUi(d, token) {
  const u = requireUiAdmin_(token);
  return emWithLock_(function() {
    d = d || {};
    const type = d.adjustmentType || 'inventory';
    if (!EM_ADJ_LABELS[type]) throw new Error('نوع التسوية غير معروف.');
    const reason = String(d.reason || '').trim();
    if (!reason) throw new Error('سبب التسوية مطلوب.');
    const now = emNow_();
    const r = { id: emId_(), adjustmentType: type, branchId: '', warehouseId: '', partyId: '', employeeId: '', itemId: '', quantity: 0, amount: 0, priceField: '', reason: reason, status: 'approved', createdAt: now, createdBy: u.id, updatedAt: now, updatedBy: u.id };
    let movement = null, itemUpdate = null;
    const amount = Number(d.amount);
    if (type === 'inventory') {
      const wh = emEnsureActiveWarehouse_(d.warehouseId), it = emEnsureActiveItem_(d.itemId), q = Number(d.quantity);
      if (!isFinite(q) || q === 0) throw new Error('أدخل كمية التسوية (موجبة للزيادة وسالبة للعجز أو التالف).');
      if (q < 0) { const o = {}, nm = {}; o[it.id] = -q; nm[it.id] = it.name; emCheckStock_(wh.id, o, nm); }
      r.branchId = wh.branchId; r.warehouseId = wh.id; r.itemId = it.id; r.quantity = emRound4_(q); r.amount = emRound4_(Math.abs(q) * emN_(it.purchasePrice));
      movement = { id: emId_(), transactionDate: now, transactionType: 'manual_adjustment', sourceType: 'adjustment', sourceId: r.id, sourceNumber: '', branchId: wh.branchId, warehouseId: wh.id, itemId: it.id,
        itemCodeSnapshot: it.itemCode, itemNameSnapshot: it.name, quantityIn: q > 0 ? q : 0, quantityOut: q < 0 ? -q : 0, unitCostGross: emN_(it.purchasePrice), currency: getSetting_('currency', 'ر.س'), notes: reason, createdAt: now, createdBy: u.id };
    } else if (type === 'customer' || type === 'supplier') {
      const p = requireActiveRecord_(type === 'customer' ? 'Customers' : 'Suppliers', d.partyId, type === 'customer' ? 'العميل' : 'المورد');
      if (!isFinite(amount) || amount === 0) throw new Error('أدخل مبلغ التسوية (موجب يزيد رصيد الطرف وسالب ينقصه).');
      r.partyId = p.id; r.amount = emRound4_(amount);
    } else if (type === 'employee') {
      const e = requireActiveRecord_('Employees', d.employeeId, 'الموظف');
      if (!isFinite(amount) || amount === 0) throw new Error('أدخل مبلغ التسوية.');
      r.employeeId = e.id; r.amount = emRound4_(amount);
    } else if (type === 'purchase_cost') {
      if (!isFinite(amount) || amount === 0) throw new Error('أدخل مبلغ التكلفة.');
      r.amount = emRound4_(amount);
    } else if (type === 'price') {
      const it = emEnsureActiveItem_(d.itemId), field = String(d.priceField || '');
      if (!EM_PRICE_FIELDS[field]) throw new Error('اختر نوع السعر المراد تسويته.');
      if (!isFinite(amount) || amount < 0 || d.amount === '' || d.amount == null) throw new Error('أدخل السعر الجديد.');
      if (d.partyId) { requireActiveRecord_('Suppliers', d.partyId, 'المورد'); r.partyId = d.partyId; }
      const old = emN_(it[field]);
      r.itemId = it.id; r.priceField = field; r.amount = emRound4_(amount); r.reason = reason + ' [' + EM_PRICE_FIELDS[field] + ': ' + old + ' ← ' + emRound4_(amount) + ']';
      itemUpdate = Object.assign({}, it); itemUpdate[field] = emRound4_(amount); itemUpdate.updatedAt = now; itemUpdate.updatedBy = u.id;
    }
    emAppend_('Adjustments', r);
    if (movement) emAppend_(EM_INVENTORY_SHEET, movement);
    if (itemUpdate) emUpdateById_('Items', itemUpdate.id, itemUpdate);
    emAudit_('create', 'Adjustments', r.id, EM_ADJ_LABELS[type], null, r, { id: u.id, name: u.username }, reason);
    return r;
  });
}
function deleteAdjustmentFromUi(id, token) {
  const u = requireUiAdmin_(token);
  return emWithLock_(function() {
    const r = emFindById_('Adjustments', id);
    if (!r) throw new Error('التسوية غير موجودة.');
    if (r.status === 'cancelled') return r;
    if (r.adjustmentType === 'price') throw new Error('تسوية الأسعار لا تُلغى؛ أنشئ تسوية سعر جديدة بالقيمة المطلوبة.');
    if (r.adjustmentType === 'inventory') emReverseMovements_('adjustment', id, '', 'إلغاء تسوية', u);
    r.status = 'cancelled'; r.updatedAt = emNow_(); r.updatedBy = u.id;
    emUpdateById_('Adjustments', id, r);
    emAudit_('cancel', 'Adjustments', id, EM_ADJ_LABELS[r.adjustmentType] || '', null, r, { id: u.id, name: u.username }, '');
    return r;
  });
}
function listAdjustmentsFromUi(f, token) {
  requireUiAdmin_(token);
  f = f || {};
  const items = emRowsById_('Items'), whs = emRowsById_('Warehouses'), cus = emRowsById_('Customers'), sup = emRowsById_('Suppliers'), emp = emRowsById_('Employees');
  return emReadAll_('Adjustments').filter(function(r) {
    const d = String(r.createdAt || '').slice(0, 10);
    return (!f.type || r.adjustmentType === f.type) && (!f.status || r.status === f.status) && (!f.from || d >= f.from) && (!f.to || d <= f.to);
  }).map(function(r) {
    const party = r.employeeId ? (emp[String(r.employeeId)] || {}).name : (cus[String(r.partyId)] || sup[String(r.partyId)] || {}).name;
    return { id: r.id, type: r.adjustmentType, typeLabel: EM_ADJ_LABELS[r.adjustmentType] || r.adjustmentType, date: String(r.createdAt || '').slice(0, 10), itemName: (items[String(r.itemId)] || {}).name || '',
      warehouseName: (whs[String(r.warehouseId)] || {}).name || '', partyName: party || '', quantity: emN_(r.quantity), amount: emN_(r.amount), priceFieldLabel: EM_PRICE_FIELDS[r.priceField] || '', reason: r.reason, status: r.status };
  }).sort(function(a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); }).slice(0, 400);
}

/* ---------- إعدادات المخزون ---------- */
function getInventorySettingsFromUi(token) { getSessionUser(token); return { blockNegative: getSetting_('inventory.blockNegative', 'off') }; }
function saveInventorySettingsFromUi(d, token) {
  const u = requireUiAdmin_(token);
  setSettingValue_('inventory.blockNegative', d && d.blockNegative === 'on' ? 'on' : 'off', 'text', u.id);
  return getInventorySettingsFromUi(token);
}


/* =====================================================================
   النقدية (v2): إيصال استلام/صرف، حركة الفيزا والشيكات والخزينة، الأجور والمرتبات
   ===================================================================== */
function cashDefaultCurrency_() { return String(getSetting_('currency', 'ر.س') || 'ر.س'); }
function cashCur_(v) { return String(v == null ? '' : v).trim() || cashDefaultCurrency_(); }
function cashD_(v) { return String(v || '').slice(0, 10); }
function cashMonth_(v) { return String(v || '').slice(0, 7); }
function cashRound_(v) { return Math.round((Number(v) || 0) * 100) / 100; }
function cashTypeLabel_(t) { return { cash: 'نقدي', card: 'فيزا', check: 'شيكات', voucher: 'قسيمة' }[t] || String(t || ''); }
function cashMaskCard_(v) { const s = String(v == null ? '' : v).replace(/\D/g, ''); return s ? '•••• ' + s.slice(-4) : ''; }
function cashAmountOrThrow_(v) {
  const a = Number(v);
  if (!isFinite(a) || a <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر.');
  return cashRound_(a);
}
function cashEnsureSheets_() {
  ['Cash_Receipts', 'Cash_Payments', 'Visa_Transactions', 'Checks_Transactions', 'Payroll'].forEach(function(n) { ensureExtraRuntimeSheet_(n); });
}
function cashSrcNo_(type, id, cache) {
  if (!type || !id) return '';
  const map = { sales_invoice: ['Sales_Invoices', 'invoiceNumber'], purchase_invoice: ['Purchase_Invoices', 'purchaseNumber'], sales_return: ['Sales_Returns', 'returnNumber'], purchase_return: ['Purchase_Returns', 'returnNumber'] }[type];
  if (!map) return '';
  if (!cache[map[0]]) {
    cache[map[0]] = {};
    try { emReadAll_(map[0]).forEach(function(r) { cache[map[0]][r.id] = r[map[1]]; }); } catch (e) {}
  }
  return cache[map[0]][id] || '';
}

/** كل حركات الخزينة (مدين/دائن) بنفس منطق finTreasuryBalance_ مع تفصيل أرقام المستندات والعملة. */
function cashLedgerAll_() {
  cashEnsureSheets_();
  const def = cashDefaultCurrency_(), rows = [], cache = {};
  emReadAll_('Opening_Balances').forEach(function(o) {
    if (o.balanceType !== 'cash') return;
    const a = finNum_(o.amount);
    rows.push({ date: cashD_(o.balanceDate), ts: '', sort: 0, cur: cashCur_(o.currency), description: 'رصيد افتتاحي' + (o.cashAccount ? ' — ' + o.cashAccount : ''), receiptNo: '', depositDoc: '', paymentNo: '', disburseDoc: '', debit: a > 0 ? a : 0, credit: a < 0 ? -a : 0 });
  });
  let assets = [];
  try { assets = emReadAll_('General_Ledger').filter(function(a) { return a.active === 'on' && a.accountType === 'asset'; }); } catch (e) {}
  emReadAll_('Cash_Receipts').forEach(function(r) {
    if (r.status !== 'approved' || r.cashType === 'check') return;
    if (assets.some(function(a) { return finMatchRef_(r.depositAccount, a, 'accountCode', 'accountName'); })) return;
    rows.push({ date: cashD_(r.receiptDate), ts: String(r.createdAt || ''), sort: 1, cur: cashCur_(r.currency),
      description: 'قبض ' + cashTypeLabel_(r.cashType) + (r.receivedFromName ? ' من ' + r.receivedFromName : '') + (r.description ? ' — ' + r.description : ''),
      receiptNo: r.receiptNumber || '', depositDoc: cashSrcNo_(r.sourceType, r.sourceId, cache), paymentNo: '', disburseDoc: '', debit: finNum_(r.amount), credit: 0 });
  });
  emReadAll_('Cash_Payments').forEach(function(p) {
    if (p.status !== 'approved' || p.cashType === 'check') return;
    rows.push({ date: cashD_(p.paymentDate), ts: String(p.createdAt || ''), sort: 2, cur: cashCur_(p.currency),
      description: 'صرف ' + cashTypeLabel_(p.cashType) + (p.paidToName ? ' إلى ' + p.paidToName : '') + (p.expenseCategory ? ' (' + p.expenseCategory + ')' : '') + (p.description ? ' — ' + p.description : ''),
      receiptNo: '', depositDoc: '', paymentNo: p.paymentNumber || '', disburseDoc: cashSrcNo_(p.sourceType, p.sourceId, cache), debit: 0, credit: finNum_(p.amount) });
  });
  emReadAll_('Checks_Transactions').forEach(function(c) {
    if (String(c.status) === 'cancelled') return;
    const col = finNum_(c.collectedAmount);
    if (!col) return;
    const isIn = c.direction === 'in';
    rows.push({ date: cashD_(c.transactionDate), ts: String(c.createdAt || ''), sort: 3, cur: def,
      description: (isIn ? 'تحصيل شيك وارد' : 'صرف شيك صادر') + ' رقم ' + (c.checkNumber || '') + (c.customerName ? ' — ' + c.customerName : ''),
      receiptNo: isIn ? (c.receiptNumber || '') : '', depositDoc: isIn ? 'شيك ' + (c.checkNumber || '') : '',
      paymentNo: isIn ? '' : (c.receiptNumber || ''), disburseDoc: isIn ? '' : 'شيك ' + (c.checkNumber || ''),
      debit: isIn ? col : 0, credit: isIn ? 0 : col });
  });
  return rows;
}
function cashBalances_(rows) {
  const m = {};
  rows.forEach(function(r) { m[r.cur] = cashRound_((m[r.cur] || 0) + r.debit - r.credit); });
  return m;
}
function cashBalanceFor_(cur) { return cashBalances_(cashLedgerAll_())[cur] || 0; }

function getCashContextFromUi(token) {
  getSessionUser(token);
  const def = cashDefaultCurrency_(), seen = {}, currencies = [];
  const add = function(v, label) { v = String(v || '').trim(); if (!v || seen[v]) return; seen[v] = 1; currencies.push({ value: v, label: label || v }); };
  add(def, def);
  try {
    ensureExtraRuntimeSheet_('Currencies');
    emReadAll_('Currencies').filter(function(c) { return c.active !== 'off'; }).forEach(function(c) {
      const v = c.symbol || c.currencyCode;
      add(v, c.name ? c.name + ' (' + v + ')' : v);
    });
  } catch (e) {}
  let cats = [];
  try { ensureExtraRuntimeSheet_('Expense_Categories'); cats = emReadAll_('Expense_Categories').filter(function(c) { return c.active !== 'off'; }).map(function(c) { return c.name; }).filter(Boolean); } catch (e) {}
  ['أجور ومرتبات', 'إيجار', 'كهرباء ومياه', 'اتصالات وإنترنت', 'مواصلات', 'صيانة', 'مستلزمات تشغيل', 'أخرى'].forEach(function(x) { if (cats.indexOf(x) < 0) cats.push(x); });
  const balances = cashBalances_(cashLedgerAll_());
  currencies.forEach(function(c) { if (balances[c.value] === undefined) balances[c.value] = 0; });
  return { defaultCurrency: def, currencies: currencies, expenseCategories: cats, balances: balances, balance: balances[def] || 0 };
}

function saveCashReceiptFromUi(d, token) {
  const u = requireUiPermission_(token, 'cash_write');
  d = d || {};
  return emWithLock_(function() {
    cashEnsureSheets_();
    const type = ['cash', 'card', 'check'].indexOf(d.cashType) >= 0 ? d.cashType : 'cash';
    const amount = cashAmountOrThrow_(d.amount);
    const from = String(d.receivedFromName || '').trim();
    if (!from) throw new Error('اكتب اسم المستلم منه.');
    if (type === 'check' && !String(d.checkNumber || '').trim()) throw new Error('رقم الشيك مطلوب.');
    if (type === 'card' && !String(d.cardNumber || '').replace(/\D/g, '')) throw new Error('رقم الكارد مطلوب.');
    const now = emNow_(), cur = cashCur_(d.currency);
    const r = { id: emId_(), receiptNumber: 'CR-' + Date.now(), receiptDate: d.receiptDate || emToday_(), cashType: type, amount: amount, currency: cur,
      receivedFromType: '', receivedFromId: '', receivedFromName: from, depositAccount: String(d.depositAccount || '').trim(), sourceType: '', sourceId: '',
      description: String(d.description || '').trim(), status: 'approved', createdAt: now, updatedAt: now, createdBy: u.id, updatedBy: u.id, approvedAt: now, approvedBy: u.id };
    emAppend_('Cash_Receipts', r);
    const collected = Math.min(amount, Math.max(0, cashRound_(d.collectedAmount)));
    if (type === 'card') {
      emAppend_('Visa_Transactions', { id: emId_(), transactionDate: r.receiptDate, direction: 'in', cardNumber: cashMaskCard_(d.cardNumber), cardType: String(d.cardType || 'visa'),
        cardExpiry: String(d.cardExpiry || ''), amount: amount, collectedAmount: collected, invoiceNumber: String(d.invoiceNumber || '').trim(), receiptId: r.receiptNumber,
        status: collected >= amount - 0.0001 ? 'collected' : (collected > 0 ? 'partial' : 'received'), notes: r.description, createdAt: now, createdBy: u.id });
    }
    if (type === 'check') {
      emAppend_('Checks_Transactions', { id: emId_(), transactionDate: r.receiptDate, direction: 'in', checkNumber: String(d.checkNumber).trim(), bankName: String(d.bankName || '').trim(),
        amount: amount, receiptNumber: r.receiptNumber, collectedAmount: collected, dueDate: d.dueDate || '', customerName: from,
        status: collected >= amount - 0.0001 ? 'collected' : 'received', notes: r.description, createdAt: now, createdBy: u.id });
    }
    return { id: r.id, receiptNumber: r.receiptNumber, currency: cur, balance: cashBalanceFor_(cur) };
  });
}

function saveCashPaymentFromUi(d, token) {
  const u = requireUiPermission_(token, 'cash_write');
  d = d || {};
  return emWithLock_(function() {
    cashEnsureSheets_();
    const type = ['cash', 'card', 'check'].indexOf(d.cashType) >= 0 ? d.cashType : 'cash';
    const amount = cashAmountOrThrow_(d.amount);
    const to = String(d.paidToName || '').trim();
    if (!to) throw new Error('اكتب اسم المصروف له.');
    if (!String(d.expenseCategory || '').trim()) throw new Error('حدّد نوع المصروف.');
    if (type === 'check' && !String(d.checkNumber || '').trim()) throw new Error('رقم الشيك مطلوب.');
    const now = emNow_(), cur = cashCur_(d.currency);
    const p = { id: emId_(), paymentNumber: 'CP-' + Date.now(), paymentDate: d.paymentDate || emToday_(), cashType: type, amount: amount, currency: cur,
      paidToType: '', paidToId: '', paidToName: to, expenseCategory: String(d.expenseCategory).trim(), sourceType: '', sourceId: '',
      description: String(d.description || '').trim(), status: 'approved', createdAt: now, updatedAt: now, createdBy: u.id, updatedBy: u.id, approvedAt: now, approvedBy: u.id };
    emAppend_('Cash_Payments', p);
    if (type === 'check') {
      emAppend_('Checks_Transactions', { id: emId_(), transactionDate: p.paymentDate, direction: 'out', checkNumber: String(d.checkNumber).trim(), bankName: String(d.bankName || '').trim(),
        amount: amount, receiptNumber: p.paymentNumber, collectedAmount: 0, dueDate: d.dueDate || '', customerName: to, status: 'issued', notes: p.description, createdAt: now, createdBy: u.id });
    }
    return { id: p.id, paymentNumber: p.paymentNumber, currency: cur, balance: cashBalanceFor_(cur) };
  });
}

function cashInstrumentText_(kind, num, visaByRc, chkByRc) {
  if (kind === 'card') {
    const v = visaByRc[num]; if (!v) return '';
    return 'كارد ' + (v.cardNumber || '') + (v.cardType ? ' · ' + v.cardType : '') + (v.cardExpiry ? ' · صلاحية ' + cashMonth_(v.cardExpiry) : '') + (v.invoiceNumber ? ' · فاتورة ' + v.invoiceNumber : '');
  }
  const c = chkByRc[num]; if (!c) return '';
  return 'شيك ' + (c.checkNumber || '') + (c.bankName ? ' · ' + c.bankName : '') + (c.dueDate ? ' · استحقاق ' + cashD_(c.dueDate) : '');
}
function cashListDocs_(sheet, dateField, numField, partyField, extraField, f, token) {
  getSessionUser(token);
  f = f || {};
  cashEnsureSheets_();
  const q = finNorm_(f.q), visaByRc = {}, chkByRc = {};
  emReadAll_('Visa_Transactions').forEach(function(v) { visaByRc[v.receiptId] = v; });
  emReadAll_('Checks_Transactions').forEach(function(c) { chkByRc[c.receiptNumber] = c; });
  const rows = emReadAll_(sheet).filter(function(r) {
    if (f.type && r.cashType !== f.type) return false;
    if (f.status && r.status !== f.status) return false;
    if (!finIn_(r[dateField], f.from, f.to)) return false;
    if (q && [r[numField], r[partyField], r[extraField], r.description, r.expenseCategory].join(' ').toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort(function(a, b) { return finCmp_(cashD_(b[dateField]), cashD_(a[dateField])) || finCmp_(String(b.createdAt), String(a.createdAt)); }).slice(0, 500);
  let total = 0;
  const out = rows.map(function(r) {
    if (r.status === 'approved') total += finNum_(r.amount);
    return { id: r.id, number: r[numField], date: cashD_(r[dateField]), cashType: r.cashType, typeLabel: cashTypeLabel_(r.cashType), amount: finNum_(r.amount), currency: cashCur_(r.currency),
      party: r[partyField] || '', extra: r[extraField] || '', description: r.description || '', status: r.status,
      instrument: cashInstrumentText_(r.cashType, r[numField], visaByRc, chkByRc) };
  });
  return { rows: out, total: cashRound_(total), count: out.length };
}
function listCashReceiptsFromUi(f, token) { return cashListDocs_('Cash_Receipts', 'receiptDate', 'receiptNumber', 'receivedFromName', 'depositAccount', f, token); }
function listCashPaymentsFromUi(f, token) { return cashListDocs_('Cash_Payments', 'paymentDate', 'paymentNumber', 'paidToName', 'expenseCategory', f, token); }

function cancelCashDocFromUi(kind, id, reason, token) {
  const u = requireUiPermission_(token, 'document_cancel');
  if (!String(reason || '').trim()) throw new Error('سبب الإلغاء مطلوب.');
  return emWithLock_(function() {
    const isReceipt = kind === 'receipt', sheet = isReceipt ? 'Cash_Receipts' : 'Cash_Payments';
    const row = emFindById_(sheet, id);
    if (!row) throw new Error('الإيصال غير موجود.');
    if (row.status === 'cancelled') throw new Error('الإيصال ملغى بالفعل.');
    const num = isReceipt ? row.receiptNumber : row.paymentNumber;
    row.status = 'cancelled'; row.updatedAt = emNow_(); row.updatedBy = u.id;
    row.description = (row.description ? row.description + ' | ' : '') + 'سبب الإلغاء: ' + String(reason).trim();
    emUpdateById_(sheet, id, row);
    emReadAll_('Visa_Transactions').filter(function(v) { return isReceipt && String(v.receiptId) === String(num); }).forEach(function(v) { v.status = 'cancelled'; emUpdateById_('Visa_Transactions', v.id, v); });
    emReadAll_('Checks_Transactions').filter(function(c) { return String(c.receiptNumber) === String(num); }).forEach(function(c) { c.status = 'cancelled'; emUpdateById_('Checks_Transactions', c.id, c); });
    return { ok: true, balance: cashBalanceFor_(cashCur_(row.currency)), currency: cashCur_(row.currency) };
  });
}

function recordCashCollectionFromUi(kind, id, amount, token) {
  requireUiPermission_(token, 'cash_write');
  return emWithLock_(function() {
    const sheet = kind === 'visa' ? 'Visa_Transactions' : 'Checks_Transactions';
    const row = emFindById_(sheet, id);
    if (!row) throw new Error('السجل غير موجود.');
    if (String(row.status) === 'cancelled') throw new Error('السجل ملغى.');
    const total = finNum_(row.amount), a = cashRound_(amount);
    if (!isFinite(a) || a < 0) throw new Error('مبلغ التحصيل غير صحيح.');
    if (a > total + 0.0001) throw new Error('مبلغ التحصيل أكبر من مبلغ السند (' + total + ').');
    row.collectedAmount = a;
    if (a >= total - 0.0001) row.status = 'collected';
    else if (a > 0) row.status = 'partial';
    else row.status = kind === 'visa' ? 'received' : (row.direction === 'out' ? 'issued' : 'received');
    emUpdateById_(sheet, id, row);
    return { ok: true, collectedAmount: a, status: row.status };
  });
}

function getVisaMovementFromUi(fromDate, toDate, token) {
  requireUiAdmin_(token);
  cashEnsureSheets_();
  const rows = [];
  emReadAll_('Visa_Transactions').forEach(function(v) {
    if (!finIn_(v.transactionDate, fromDate, toDate)) return;
    const amt = finNum_(v.amount), col = finNum_(v.collectedAmount);
    rows.push({ id: v.id, source: 'receipt', date: cashD_(v.transactionDate), cardNumber: v.cardNumber || '', cardType: v.cardType || '', cardExpiry: cashMonth_(v.cardExpiry),
      amount: amt, collected: col, remaining: cashRound_(amt - col), invoiceNumber: v.invoiceNumber || '', receiptNumber: v.receiptId || '', status: v.status || '' });
  });
  const cmap = {};
  try { emReadAll_('Customers').forEach(function(c) { cmap[c.id] = c.name; }); } catch (e) {}
  emReadAll_('Sales_Invoices').forEach(function(s) {
    if (s.status !== 'approved' || s.paymentType !== 'card' || !finIn_(s.invoiceDate, fromDate, toDate)) return;
    rows.push({ id: s.id, source: 'invoice', date: cashD_(s.invoiceDate), cardNumber: '', cardType: '', cardExpiry: '', amount: finNum_(s.totalGross), collected: null, remaining: null,
      invoiceNumber: s.invoiceNumber || '', receiptNumber: '', status: 'approved', party: cmap[s.customerId] || '' });
  });
  rows.sort(function(a, b) { return finCmp_(a.date, b.date); });
  let amount = 0, collected = 0, remaining = 0;
  rows.forEach(function(r) {
    if (r.status === 'cancelled') return;
    amount += r.amount;
    if (r.source === 'receipt') { collected += r.collected; remaining += r.remaining; }
  });
  return { rows: rows, totals: { amount: cashRound_(amount), collected: cashRound_(collected), remaining: cashRound_(remaining), count: rows.length } };
}

function getChecksMovementFromUi(fromDate, toDate, direction, token) {
  requireUiAdmin_(token);
  cashEnsureSheets_();
  const today = emToday_(), rows = [], t = { in: { amount: 0, collected: 0 }, out: { amount: 0, collected: 0 } };
  emReadAll_('Checks_Transactions').forEach(function(c) {
    if (!finIn_(c.transactionDate, fromDate, toDate)) return;
    if (direction && c.direction !== direction) return;
    const amt = finNum_(c.amount), col = finNum_(c.collectedAmount), rem = cashRound_(amt - col), st = String(c.status || '');
    const open = ['cancelled', 'returned', 'collected'].indexOf(st) < 0 && rem > 0.0001;
    const dir = c.direction === 'out' ? 'out' : 'in';
    if (st !== 'cancelled') { t[dir].amount += amt; t[dir].collected += col; }
    rows.push({ id: c.id, date: cashD_(c.transactionDate), direction: dir, directionLabel: dir === 'in' ? 'وارد' : 'صادر', checkNumber: c.checkNumber || '', bankName: c.bankName || '',
      amount: amt, receiptNumber: c.receiptNumber || '', collected: col, remaining: rem, dueDate: cashD_(c.dueDate), party: c.customerName || '', status: st,
      overdue: !!(open && c.dueDate && cashD_(c.dueDate) < today) });
  });
  rows.sort(function(a, b) { return finCmp_(a.date, b.date); });
  ['in', 'out'].forEach(function(k) { t[k].amount = cashRound_(t[k].amount); t[k].collected = cashRound_(t[k].collected); });
  return { rows: rows, totals: t };
}

function getTreasuryStatementFromUi(fromDate, toDate, currency, token) {
  requireUiAdmin_(token);
  const cur = String(currency || '').trim() || cashDefaultCurrency_();
  const all = cashLedgerAll_().filter(function(r) { return r.cur === cur; });
  all.sort(function(a, b) { return finCmp_(a.date, b.date) || finCmp_(a.ts, b.ts) || (a.sort - b.sort); });
  let opening = 0, running = 0, totalDebit = 0, totalCredit = 0, current = 0;
  const rows = [];
  all.forEach(function(r) {
    current += r.debit - r.credit;
    if (fromDate && r.date < fromDate) { opening += r.debit - r.credit; return; }
    if (toDate && r.date > toDate) return;
    rows.push(r);
  });
  running = opening;
  const out = rows.map(function(r) {
    running += r.debit - r.credit; totalDebit += r.debit; totalCredit += r.credit;
    return { date: r.date, description: r.description, receiptNo: r.receiptNo, depositDoc: r.depositDoc, paymentNo: r.paymentNo, disburseDoc: r.disburseDoc,
      debit: cashRound_(r.debit), credit: cashRound_(r.credit), balance: cashRound_(running) };
  });
  return { currency: cur, opening: cashRound_(opening), rows: out, totalDebit: cashRound_(totalDebit), totalCredit: cashRound_(totalCredit),
    closing: cashRound_(running), currentBalance: cashRound_(current) };
}

/* ---------- الأجور والمرتبات ---------- */
function getPayrollSheetFromUi(month, query, token) {
  requireUiAdmin_(token);
  cashEnsureSheets_();
  const m = cashMonth_(month), q = finNorm_(query);
  const rows = emReadAll_('Payroll').filter(function(r) {
    if (m && cashMonth_(r.payrollMonth) !== m) return false;
    if (q && finNorm_(r.employeeName).indexOf(q) < 0 && finNorm_(r.jobTitle).indexOf(q) < 0) return false;
    return true;
  }).sort(function(a, b) { return finCmp_(finNorm_(a.employeeName), finNorm_(b.employeeName)); });
  const t = { count: rows.length, basic: 0, variable: 0, allowances: 0, gross: 0, insurance: 0, advances: 0, deductions: 0, totalDeductions: 0, net: 0 };
  const out = rows.map(function(r) {
    const o = { id: r.id, month: cashMonth_(r.payrollMonth), employeeId: r.employeeId || '', employeeName: r.employeeName || '', jobTitle: r.jobTitle || '', basic: finNum_(r.basicSalary), variable: finNum_(r.variableSalary),
      allowances: finNum_(r.allowances), gross: finNum_(r.grossSalary), insurance: finNum_(r.insuranceAmount), advances: finNum_(r.advances), deductions: finNum_(r.deductions),
      totalDeductions: finNum_(r.totalDeductions), net: finNum_(r.netSalary), notes: r.notes || '' };
    t.basic += o.basic; t.variable += o.variable; t.allowances += o.allowances; t.gross += o.gross; t.insurance += o.insurance; t.advances += o.advances;
    t.deductions += o.deductions; t.totalDeductions += o.totalDeductions; t.net += o.net;
    return o;
  });
  Object.keys(t).forEach(function(k) { if (k !== 'count') t[k] = cashRound_(t[k]); });
  return { rows: out, totals: t };
}

function savePayrollRowFromUi(d, token) {
  const u = requireUiAdmin_(token);
  d = d || {};
  return emWithLock_(function() {
    cashEnsureSheets_();
    const name = String(d.employeeName || '').trim();
    if (!name) throw new Error('اسم الموظف مطلوب.');
    const month = cashMonth_(d.payrollMonth) || cashMonth_(emToday_());
    const nums = {}; ['basicSalary', 'variableSalary', 'allowances', 'insuranceAmount', 'advances', 'deductions'].forEach(function(k) {
      const v = Number(d[k] || 0);
      if (!isFinite(v) || v < 0) throw new Error('القيم المالية يجب ألا تكون سالبة.');
      nums[k] = cashRound_(v);
    });
    let emp = null;
    if (d.employeeId) emp = emFindById_('Employees', d.employeeId);
    if (!emp) emp = emReadAll_('Employees').find(function(e) { return finNorm_(e.name) === finNorm_(name); }) || null;
    const gross = cashRound_(nums.basicSalary + nums.variableSalary + nums.allowances);
    const totalDed = cashRound_(nums.insuranceAmount + nums.advances + nums.deductions);
    const now = emNow_();
    const all = emReadAll_('Payroll');
    let existing = d.id ? all.find(function(r) { return String(r.id) === String(d.id); }) : null;
    if (!existing) existing = all.find(function(r) { return cashMonth_(r.payrollMonth) === month && (emp && r.employeeId ? String(r.employeeId) === String(emp.id) : finNorm_(r.employeeName) === finNorm_(name)); }) || null;
    const rec = {
      id: existing ? existing.id : emId_(), payrollMonth: month, employeeId: emp ? emp.id : (d.employeeId || ''), employeeName: name,
      jobTitle: String(d.jobTitle || '').trim() || (emp ? emp.jobTitle || '' : ''), basicSalary: nums.basicSalary, variableSalary: nums.variableSalary, allowances: nums.allowances,
      grossSalary: gross, insuranceAmount: nums.insuranceAmount, advances: nums.advances, deductions: nums.deductions, totalDeductions: totalDed, netSalary: cashRound_(gross - totalDed),
      status: existing ? existing.status : 'draft', notes: String(d.notes || '').trim(),
      createdAt: existing ? existing.createdAt : now, createdBy: existing ? existing.createdBy : u.id, updatedAt: now, updatedBy: u.id
    };
    if (existing) emUpdateById_('Payroll', existing.id, rec); else emAppend_('Payroll', rec);
    return { id: rec.id, updated: !!existing, netSalary: rec.netSalary };
  });
}

function deletePayrollRowFromUi(id, token) {
  requireUiAdmin_(token);
  return emWithLock_(function() {
    const sh = emSheet_('Payroll'), n = sh.getLastRow() - 1;
    if (n < 1) throw new Error('السجل غير موجود.');
    const ids = sh.getRange(2, 1, n, 1).getValues().map(function(r) { return String(r[0]); });
    const i = ids.indexOf(String(id));
    if (i < 0) throw new Error('السجل غير موجود.');
    sh.deleteRow(i + 2);
    return { ok: true };
  });
}


/* ======================================================================
 * الاستعلامات › تقارير المبيعات (15 تقريرًا)
 * نقطة الدخول الوحيدة: getSalesQueryReportFromUi(type, params, token)
 * الأنواع: items_sales | today | period | by_department | cash | credit |
 *          returns | daily | monthly | groups | top | stagnant | compare |
 *          profitability | monthly_compare
 * الناتج بنفس شكل التقارير المالية: { title, period, note, sections:[{title,columns,rows,summary}], chart? }
 * الحركات المحتسبة: الفواتير والمرتجعات المعتمدة فقط.
 * التكلفة = متوسط سعر الشراء المرجّح من فواتير الشراء المعتمدة حتى نهاية الفترة
 *           (وإن لم يوجد شراء للصنف فيُستخدم سعر الشراء المسجل في بطاقة الصنف).
 * ====================================================================== */

function sqQ_(v) { return Math.round((Number(v) || 0) * 1000) / 1000; }

function sqPeriod_(from, to) { return 'من ' + (from || '—') + ' إلى ' + (to || '—'); }

function sqAddDays_(ymd, n) {
  const d = new Date(String(ymd || '').slice(0, 10) + 'T00:00:00Z');
  if (isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function sqMonthList_(endYm, n) {
  const y0 = Number(String(endYm).slice(0, 4)), m0 = Number(String(endYm).slice(5, 7));
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    let m = m0 - i, y = y0;
    while (m < 1) { m += 12; y--; }
    out.push(y + '-' + (m < 10 ? '0' : '') + m);
  }
  return out;
}

/** المجموعة الفرعية والرئيسية للصنف. صنف داخل مجموعة رئيسية مباشرة: الفرعية فارغة. */
function sqGroupInfo_(item, groups) {
  const g = item ? groups[item.groupId] : null;
  if (!g) return { sub: '', main: 'بدون مجموعة' };
  const par = g.parentGroupId ? groups[g.parentGroupId] : null;
  return par ? { sub: g.name || '', main: par.name || '' } : { sub: '', main: g.name || '' };
}

function sqItemInfo_(c, id, l) {
  const it = c.items[id] || {}, un = c.units[it.unitId] || {};
  return {
    code: (l && l.itemCodeSnapshot) || it.itemCode || '',
    name: (l && l.itemNameSnapshot) || it.name || '',
    unit: (l && l.unitNameSnapshot) || un.name || ''
  };
}

/** تحميل بيانات الفترة مرة واحدة (فواتير ومرتجعات معتمدة + بنودها + متوسط تكلفة الشراء). */
function sqLoad_(o, from, to) {
  const vat = 1 + finNum_(getSetting_('vatRate', '15')) / 100;
  const byId = function(sheet) { const m = {}; emReadAll_(sheet).forEach(function(r) { m[r.id] = r; }); return m; };
  const items = byId('Items'), groups = byId('Groups'), units = byId('Units'), customers = byId('Customers'), branches = byId('Branches');
  const keep = function(h) {
    return (!o.branchId || String(h.branchId) === String(o.branchId)) &&
           (!o.warehouseId || String(h.warehouseId) === String(o.warehouseId)) &&
           (!o.customerId || String(h.customerId) === String(o.customerId));
  };
  const invoices = emReadAll_('Sales_Invoices').filter(function(i) { return i.status === 'approved' && finIn_(i.invoiceDate, from, to) && keep(i); });
  const inv = {}; invoices.forEach(function(i) { inv[i.id] = i; });
  const lines = emReadAll_('Sales_Lines').filter(function(l) { return inv[l.salesInvoiceId]; });
  const returns = emReadAll_('Sales_Returns').filter(function(r) { return r.status === 'approved' && finIn_(r.returnDate, from, to) && keep(r); });
  const ret = {}; returns.forEach(function(r) { ret[r.id] = r; });
  const retLines = emReadAll_('Sales_Return_Lines').filter(function(l) { return ret[l.salesReturnId]; });

  const pInv = {};
  emReadAll_('Purchase_Invoices').forEach(function(h) {
    if (h.status === 'approved' && (!to || finD_(h.purchaseDate) <= to)) pInv[h.id] = true;
  });
  const pAgg = {};
  emReadAll_('Purchase_Lines').forEach(function(l) {
    if (!pInv[l.purchaseInvoiceId]) return;
    const a = pAgg[l.itemId] || (pAgg[l.itemId] = { q: 0, v: 0 });
    a.q += finNum_(l.quantity); a.v += finNum_(l.netAmountGross || l.grossAmount);
  });
  const avg = function(itemId) {
    const a = pAgg[itemId];
    if (a && a.q > 0) return a.v / a.q;
    return finNum_((items[itemId] || {}).purchasePrice);
  };

  return {
    o: o, from: from, to: to, vat: vat, items: items, groups: groups, units: units, customers: customers, branches: branches,
    invoices: invoices, inv: inv, lines: lines, returns: returns, ret: ret, retLines: retLines, avg: avg,
    m: function(g) { return o.inc ? g : g / vat; },
    lineGross: function(l) { return finNum_(l.netAmountGross || l.grossAmount); },
    custName: function(id) { return (customers[id] || {}).name || 'بدون عميل'; },
    branchName: function(id) { return (branches[id] || {}).name || 'بدون قسم'; },
    netOf: function(h) { return (h.netBeforeVat !== '' && h.netBeforeVat != null) ? finNum_(h.netBeforeVat) : finNum_(h.totalGross) / vat; }
  };
}

function sqItemAgg_(c) {
  const a = {};
  const ens = function(id, l) {
    if (!a[id]) { const i = sqItemInfo_(c, id, l); a[id] = { itemId: id, code: i.code, name: i.name, unit: i.unit, soldQty: 0, retQty: 0, soldVal: 0, retVal: 0, cost: 0, retCost: 0 }; }
    return a[id];
  };
  c.lines.forEach(function(l) { const x = ens(l.itemId, l), q = finNum_(l.quantity); x.soldQty += q; x.soldVal += c.lineGross(l); x.cost += q * c.avg(l.itemId); });
  c.retLines.forEach(function(l) { const x = ens(l.itemId, l), q = finNum_(l.quantity); x.retQty += q; x.retVal += c.lineGross(l); x.retCost += q * c.avg(l.itemId); });
  return a;
}

function sqResult_(title, c, withVatNote, sections, chart, noteOverride) {
  const r = {
    title: title,
    period: 'الفترة: ' + sqPeriod_(c.from, c.to),
    note: noteOverride || (withVatNote ? (c.o.inc ? 'القيم شاملة الضريبة.' : 'القيم قبل الضريبة.') : ''),
    sections: sections
  };
  if (chart) r.chart = chart;
  return r;
}

function getSalesQueryReportFromUi(type, params, token) {
  requireUiAdmin_(token);
  const p = params || {};
  const o = {
    type: String(type || ''),
    from: String(p.fromDate || '').slice(0, 10),
    to: String(p.toDate || '').slice(0, 10),
    branchId: p.branchId || '', warehouseId: p.warehouseId || '', customerId: p.customerId || '',
    inc: String(p.vatMode || '') === 'inc',
    limit: Math.max(1, Math.min(500, Math.floor(finNum_(p.limit)) || 20)),
    months: Math.max(2, Math.min(36, Math.floor(finNum_(p.months)) || 6))
  };
  if (o.type === 'today') { o.from = o.to = emToday_(); }
  switch (o.type) {
    case 'items_sales': return sqItemsSales_(o);
    case 'today':
    case 'period': return sqDetail_(o);
    case 'by_department': return sqByDepartment_(o);
    case 'cash': return sqInvoicesByPay_(o, false);
    case 'credit': return sqInvoicesByPay_(o, true);
    case 'returns': return sqReturns_(o);
    case 'daily': return sqPeriodTotals_(o, false);
    case 'monthly': return sqPeriodTotals_(o, true);
    case 'groups': return sqGroups_(o);
    case 'top': return sqTop_(o);
    case 'stagnant': return sqStagnant_(o);
    case 'compare': return sqCompare_(o);
    case 'profitability': return sqProfitability_(o);
    case 'monthly_compare': return sqMonthlyCompare_(o);
    default: throw new Error('نوع تقرير المبيعات غير معروف: ' + type);
  }
}

/* أ) تقرير مبيعات أصناف */
function sqItemsSales_(o) {
  const c = sqLoad_(o, o.from, o.to), a = sqItemAgg_(c);
  const rows = Object.keys(a).map(function(k) {
    const x = a[k], g = sqGroupInfo_(c.items[x.itemId], c.groups);
    return { name: x.name, code: x.code, netQty: sqQ_(x.soldQty - x.retQty), netValue: finRound_(c.m(x.soldVal - x.retVal)), subGroup: g.sub, mainGroup: g.main };
  }).sort(function(p, q) { return finCmp_(String(p.code), String(q.code)); });
  const tq = rows.reduce(function(s, r) { return s + r.netQty; }, 0), tv = rows.reduce(function(s, r) { return s + r.netValue; }, 0);
  return sqResult_('تقرير مبيعات أصناف', c, true, [finSection_('مبيعات الأصناف بعد المرتجعات', [
    finCol_('name', 'اسم الصنف'), finCol_('code', 'رقم الصنف'), finCol_('netQty', 'صافي كمية المبيعات', 'qty'),
    finCol_('netValue', 'صافي قيمة المبيعات بعد الخصم والمرتجعات', 'money'), finCol_('subGroup', 'المجموعة الفرعية'), finCol_('mainGroup', 'المجموعة الرئيسية')
  ], rows, [{ label: 'عدد الأصناف', value: rows.length }, { label: 'إجمالي الكمية', value: sqQ_(tq) }, { label: 'إجمالي صافي المبيعات', value: finRound_(tv) }])]);
}

/* ب) المبيعات عن اليوم  +  ت) المبيعات عن الفترة (Shift+F1) */
function sqDetail_(o) {
  const c = sqLoad_(o, o.from, o.to), rows = [];
  c.lines.forEach(function(l) {
    const h = c.inv[l.salesInvoiceId], q = finNum_(l.quantity), g = c.lineGross(l), i = sqItemInfo_(c, l.itemId, l);
    rows.push({ date: finD_(h.invoiceDate), name: i.name, code: i.code, invoiceNumber: h.invoiceNumber || '', returnNumber: '', qty: sqQ_(q),
      price: q > 0 ? finRound_(c.m(g) / q) : 0, sales: finRound_(c.m(g)), returns: 0, cost: finRound_(c.m(q * c.avg(l.itemId))), sortKey: finD_(h.invoiceDate) + '|0|' + (h.invoiceNumber || '') });
  });
  c.retLines.forEach(function(l) {
    const h = c.ret[l.salesReturnId], q = finNum_(l.quantity), g = c.lineGross(l), i = sqItemInfo_(c, l.itemId, l);
    rows.push({ date: finD_(h.returnDate), name: i.name, code: i.code, invoiceNumber: h.salesInvoiceNumberSnapshot || '', returnNumber: h.returnNumber || '', qty: sqQ_(q),
      price: q > 0 ? finRound_(c.m(g) / q) : 0, sales: 0, returns: finRound_(c.m(g)), cost: -finRound_(c.m(q * c.avg(l.itemId))), sortKey: finD_(h.returnDate) + '|1|' + (h.returnNumber || '') });
  });
  rows.sort(function(a, b) { return finCmp_(a.sortKey, b.sortKey); });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  const sales = sum('sales'), returns = sum('returns'), cost = sum('cost');
  const cols = [];
  if (o.type === 'period') cols.push(finCol_('date', 'التاريخ'));
  cols.push(finCol_('name', 'اسم الصنف'), finCol_('code', 'رقم الصنف'), finCol_('invoiceNumber', 'رقم فاتورة البيع'), finCol_('returnNumber', 'رقم إذن المرتجع'),
    finCol_('qty', 'الكمية', 'qty'), finCol_('price', 'السعر', 'money'), finCol_('sales', 'إجمالي المبيعات', 'money'), finCol_('returns', 'إجمالي المرتجعات', 'money'),
    finCol_('cost', 'التكلفة بمتوسط أسعار الشراء', 'money'));
  const title = o.type === 'today' ? 'تقرير المبيعات عن اليوم (' + o.from + ')' : 'تقرير المبيعات عن الفترة';
  return sqResult_(title, c, true, [finSection_('تفاصيل المبيعات والمرتجعات', cols, rows, [
    { label: 'إجمالي المبيعات', value: sales }, { label: 'إجمالي المرتجعات', value: returns }, { label: 'إجمالي التكلفة', value: cost },
    { label: 'مجمل الربح', value: finRound_(sales - returns - cost) }])]);
}

/* ث) إجمالي مبيعات بالأقسام (القسم = الفرع) */
function sqByDepartment_(o) {
  const c = sqLoad_(o, o.from, o.to), by = {};
  c.invoices.forEach(function(i) { const k = i.branchId || ''; (by[k] = by[k] || []).push(i); });
  const cols = [finCol_('dept', 'القسم'), finCol_('date', 'التاريخ'), finCol_('customer', 'اسم العميل'), finCol_('number', 'رقم الفاتورة'),
    finCol_('total', 'إجمالي قيمة الفاتورة', 'money'), finCol_('net', 'صافي قيمة الفاتورة', 'money')];
  const sections = [], overview = [];
  Object.keys(by).sort(function(a, b) { return finCmp_(c.branchName(a), c.branchName(b)); }).forEach(function(k) {
    const name = c.branchName(k);
    const rows = by[k].sort(function(a, b) { return finCmp_(finD_(a.invoiceDate) + (a.invoiceNumber || ''), finD_(b.invoiceDate) + (b.invoiceNumber || '')); }).map(function(i) {
      return { dept: name, date: finD_(i.invoiceDate), customer: c.custName(i.customerId), number: i.invoiceNumber || '', total: finRound_(finNum_(i.totalGross)), net: finRound_(c.netOf(i)) };
    });
    const t = finRound_(rows.reduce(function(s, r) { return s + r.total; }, 0)), n = finRound_(rows.reduce(function(s, r) { return s + r.net; }, 0));
    overview.push({ dept: name, count: rows.length, total: t, net: n });
    sections.push(finSection_('القسم: ' + name, cols, rows, [{ label: 'عدد الفواتير', value: rows.length }, { label: 'إجمالي القيمة', value: t }, { label: 'صافي القيمة', value: n }]));
  });
  sections.push(finSection_('ملخص الأقسام', [finCol_('dept', 'القسم'), finCol_('count', 'عدد الفواتير', 'int'), finCol_('total', 'إجمالي القيمة', 'money'), finCol_('net', 'صافي القيمة', 'money')], overview,
    [{ label: 'إجمالي القيمة', value: finRound_(overview.reduce(function(s, r) { return s + r.total; }, 0)) }, { label: 'صافي القيمة', value: finRound_(overview.reduce(function(s, r) { return s + r.net; }, 0)) }]));
  return sqResult_('تقرير إجمالي مبيعات بالأقسام', c, false, sections, null, 'القسم = الفرع. الإجمالي شامل الضريبة والصافي قبل الضريبة.');
}

/* ج) مبيعات النقدية (Shift+F2)  +  ح) مبيعات الآجلة (Shift+F3) */
function sqInvoicesByPay_(o, credit) {
  const c = sqLoad_(o, o.from, o.to);
  const d = Number(getSetting_('sales.creditDays', '30')), days = isFinite(d) && d >= 0 ? d : 30;
  const rows = c.invoices.filter(function(i) { return (i.paymentType === 'credit') === credit; })
    .sort(function(a, b) { return finCmp_(finD_(a.invoiceDate) + (a.invoiceNumber || ''), finD_(b.invoiceDate) + (b.invoiceNumber || '')); })
    .map(function(i) {
      return { date: finD_(i.invoiceDate), customer: c.custName(i.customerId), number: i.invoiceNumber || '', total: finRound_(finNum_(i.totalGross)), net: finRound_(c.netOf(i)),
        dueDate: credit ? sqAddDays_(i.invoiceDate, days) : '' };
    });
  const cols = [finCol_('date', 'التاريخ'), finCol_('customer', 'اسم العميل'), finCol_('number', 'رقم الفاتورة'), finCol_('total', 'إجمالي قيمة الفاتورة', 'money'), finCol_('net', 'صافي قيمة الفاتورة', 'money')];
  if (credit) cols.push(finCol_('dueDate', 'تاريخ الاستحقاق'));
  const note = 'الإجمالي شامل الضريبة والصافي قبل الضريبة.' + (credit ? ' تاريخ الاستحقاق = تاريخ الفاتورة + ' + days + ' يومًا (الإعداد sales.creditDays).' : ' تُحسب كل فاتورة غير آجلة (نقدي/فيزا/مختلط) ضمن النقدية.');
  return sqResult_(credit ? 'تقرير إجمالي مبيعات الآجلة' : 'تقرير إجمالي مبيعات النقدية', c, false, [finSection_(credit ? 'فواتير البيع الآجل' : 'فواتير البيع النقدي', cols, rows, [
    { label: 'عدد الفواتير', value: rows.length }, { label: 'إجمالي القيمة', value: finRound_(rows.reduce(function(s, r) { return s + r.total; }, 0)) },
    { label: 'صافي القيمة', value: finRound_(rows.reduce(function(s, r) { return s + r.net; }, 0)) }])], null, note);
}

/* خ) مرتجعات المبيعات */
function sqReturns_(o) {
  const c = sqLoad_(o, o.from, o.to);
  const rows = c.returns.sort(function(a, b) { return finCmp_(finD_(a.returnDate) + (a.returnNumber || ''), finD_(b.returnDate) + (b.returnNumber || '')); }).map(function(r) {
    return { date: finD_(r.returnDate), customer: c.custName(r.customerId), number: r.returnNumber || '', net: finRound_(c.netOf(r)), notes: r.reason || r.notes || '' };
  });
  return sqResult_('تقرير مرتجعات المبيعات', c, false, [finSection_('أذونات المرتجع', [finCol_('date', 'التاريخ'), finCol_('customer', 'اسم العميل'), finCol_('number', 'رقم الإذن'),
    finCol_('net', 'إجمالي قيمة الإذن بدون ضريبة', 'money'), finCol_('notes', 'ملاحظات')], rows,
    [{ label: 'عدد الأذونات', value: rows.length }, { label: 'إجمالي القيمة بدون ضريبة', value: finRound_(rows.reduce(function(s, r) { return s + r.net; }, 0)) }])], null, '');
}

/* د) إجمالي المبيعات باليوم (Shift+F4)  +  ذ) إجمالي المبيعات بالشهور (Shift+F5) */
function sqPeriodTotals_(o, monthly) {
  const c = sqLoad_(o, o.from, o.to), m = {};
  const key = function(d) { d = finD_(d); return monthly ? d.slice(0, 7) : d; };
  const ens = function(k) { return m[k] || (m[k] = { period: k, sales: 0, discount: 0, net: 0, returns: 0, cost: 0 }); };
  c.invoices.forEach(function(i) { const x = ens(key(i.invoiceDate)); x.sales += finNum_(i.subtotalGross || i.totalGross); x.discount += finNum_(i.discountAmount); x.net += finNum_(i.totalGross); });
  c.returns.forEach(function(r) { ens(key(r.returnDate)).returns += finNum_(r.totalGross); });
  c.lines.forEach(function(l) { ens(key(c.inv[l.salesInvoiceId].invoiceDate)).cost += finNum_(l.quantity) * c.avg(l.itemId); });
  c.retLines.forEach(function(l) { ens(key(c.ret[l.salesReturnId].returnDate)).cost -= finNum_(l.quantity) * c.avg(l.itemId); });
  const rows = Object.keys(m).sort().map(function(k) {
    const x = m[k], sales = finRound_(c.m(x.sales)), disc = finRound_(c.m(x.discount)), net = finRound_(c.m(x.net)), ret = finRound_(c.m(x.returns)), cost = finRound_(c.m(x.cost));
    return { period: k, sales: sales, discount: disc, net: net, returns: ret, cost: cost, profit: finRound_(net - ret - cost) };
  });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  return sqResult_(monthly ? 'تقرير إجمالي المبيعات بالشهور' : 'تقرير إجمالي المبيعات باليوم', c, true, [finSection_(monthly ? 'المبيعات بالشهور' : 'المبيعات باليوم', [
    finCol_('period', monthly ? 'الشهر' : 'التاريخ'), finCol_('sales', 'إجمالي المبيعات', 'money'), finCol_('discount', 'إجمالي الخصم', 'money'), finCol_('net', 'صافي المبيعات', 'money'),
    finCol_('returns', 'إجمالي المرتجعات', 'money'), finCol_('cost', 'تكلفة المبيعات بمتوسط أسعار الشراء', 'money'), finCol_('profit', 'مجمل الربح', 'money')], rows,
    [{ label: 'إجمالي المبيعات', value: sum('sales') }, { label: 'إجمالي الخصم', value: sum('discount') }, { label: 'صافي المبيعات', value: sum('net') },
      { label: 'إجمالي المرتجعات', value: sum('returns') }, { label: 'تكلفة المبيعات', value: sum('cost') }, { label: 'مجمل الربح', value: sum('profit') }])]);
}

/* ر) بيان المبيعات عن فترة بالمجموعة السلعية (Shift+F6) */
function sqGroups_(o) {
  const c = sqLoad_(o, o.from, o.to), rows = {}, mains = {};
  const ens = function(map, k, main) { return map[k] || (map[k] = { group: k, main: main, soldQty: 0, retQty: 0, cash: 0, credit: 0, returns: 0 }); };
  c.lines.forEach(function(l) {
    const g = sqGroupInfo_(c.items[l.itemId], c.groups), x = ens(rows, g.sub || g.main, g.main), y = ens(mains, g.main, g.main);
    const q = finNum_(l.quantity), v = c.lineGross(l), isCredit = c.inv[l.salesInvoiceId].paymentType === 'credit';
    x.soldQty += q; y.soldQty += q;
    if (isCredit) { x.credit += v; y.credit += v; } else { x.cash += v; y.cash += v; }
  });
  c.retLines.forEach(function(l) {
    const g = sqGroupInfo_(c.items[l.itemId], c.groups), x = ens(rows, g.sub || g.main, g.main), y = ens(mains, g.main, g.main);
    const q = finNum_(l.quantity), v = c.lineGross(l);
    x.retQty += q; y.retQty += q; x.returns += v; y.returns += v;
  });
  const out = function(x) {
    const cash = finRound_(c.m(x.cash)), credit = finRound_(c.m(x.credit)), ret = finRound_(c.m(x.returns)), net = finRound_(cash + credit);
    return { group: x.group, main: x.main, soldQty: sqQ_(x.soldQty), retQty: sqQ_(x.retQty), cash: cash, credit: credit, net: net, returns: ret, netAfter: finRound_(net - ret) };
  };
  const list = Object.keys(rows).map(function(k) { return out(rows[k]); }).sort(function(a, b) { return finCmp_(a.main + '|' + a.group, b.main + '|' + b.group); });
  const mainList = Object.keys(mains).map(function(k) { return out(mains[k]); }).sort(function(a, b) { return finCmp_(a.main, b.main); });
  const sum = function(arr, k) { return finRound_(arr.reduce(function(s, r) { return s + r[k]; }, 0)); };
  return sqResult_('بيان المبيعات عن فترة بالمجموعة السلعية', c, true, [
    finSection_('المجموعات السلعية', [finCol_('group', 'المجموعة السلعية'), finCol_('soldQty', 'الكميات المباعة', 'qty'), finCol_('retQty', 'الكميات المرتجعة', 'qty'),
      finCol_('cash', 'صافي المبيعات النقدية', 'money'), finCol_('credit', 'صافي المبيعات الآجلة', 'money'), finCol_('net', 'صافي المبيعات', 'money'),
      finCol_('returns', 'قيمة المرتجعات', 'money'), finCol_('netAfter', 'صافي المبيعات بعد المرتجعات', 'money'), finCol_('main', 'المجموعة الرئيسية')], list,
      [{ label: 'صافي المبيعات', value: sum(list, 'net') }, { label: 'قيمة المرتجعات', value: sum(list, 'returns') }, { label: 'صافي بعد المرتجعات', value: sum(list, 'netAfter') }]),
    finSection_('إجمالي المجموعات الرئيسية', [finCol_('main', 'المجموعة الرئيسية'), finCol_('soldQty', 'الكميات المباعة', 'qty'), finCol_('retQty', 'الكميات المرتجعة', 'qty'),
      finCol_('net', 'صافي المبيعات', 'money'), finCol_('returns', 'قيمة المرتجعات', 'money'), finCol_('netAfter', 'صافي المبيعات بعد المرتجعات', 'money')], mainList,
      [{ label: 'الإجمالي بعد المرتجعات', value: sum(mainList, 'netAfter') }])]);
}

/* ز) أعلى مبيعات عن فترة (Shift+F8) */
function sqTop_(o) {
  const c = sqLoad_(o, o.from, o.to), a = sqItemAgg_(c);
  const rows = Object.keys(a).map(function(k) { return a[k]; }).filter(function(x) { return x.soldQty > 0; })
    .sort(function(p, q) { return q.soldVal - p.soldVal; }).slice(0, o.limit).map(function(x) {
      return { code: x.code, name: x.name, price: finRound_(c.m(x.soldVal) / x.soldQty), qty: sqQ_(x.soldQty), total: finRound_(c.m(x.soldVal)) };
    });
  return sqResult_('تقرير أعلى مبيعات عن فترة (أعلى ' + o.limit + ' صنف)', c, true, [finSection_('الأصناف الأعلى مبيعًا', [finCol_('code', 'رقم الصنف'), finCol_('name', 'اسم الصنف'),
    finCol_('price', 'سعر البيع بعد الخصم', 'money'), finCol_('qty', 'إجمالي الكمية المباعة', 'qty'), finCol_('total', 'إجمالي المبيعات', 'money')], rows,
    [{ label: 'عدد الأصناف المعروضة', value: rows.length }, { label: 'إجمالي المبيعات', value: finRound_(rows.reduce(function(s, r) { return s + r.total; }, 0)) }])]);
}

/* س) الأصناف الراكدة عن فترة (Shift+F9) — الأصناف النشطة التي لها رصيد ولم تُبع خلال الفترة */
function sqStagnant_(o) {
  const c = sqLoad_(o, o.from, o.to), sold = {};
  c.lines.forEach(function(l) { sold[l.itemId] = true; });
  const dateOf = {};
  emReadAll_('Sales_Invoices').forEach(function(i) { if (i.status === 'approved') dateOf[i.id] = finD_(i.invoiceDate); });
  const last = {};
  emReadAll_('Sales_Lines').forEach(function(l) { const d = dateOf[l.salesInvoiceId]; if (d && (!last[l.itemId] || d > last[l.itemId])) last[l.itemId] = d; });
  const stock = {};
  emReadAll_(EM_INVENTORY_SHEET).forEach(function(r) {
    if (o.warehouseId && String(r.warehouseId) !== String(o.warehouseId)) return;
    stock[r.itemId] = (stock[r.itemId] || 0) + finNum_(r.quantityIn) - finNum_(r.quantityOut);
  });
  const today = emToday_();
  const rows = Object.keys(c.items).map(function(k) { return c.items[k]; }).filter(function(it) { return it.active === 'on' && !sold[it.id] && finNum_(stock[it.id]) > 0; }).map(function(it) {
    const g = sqGroupInfo_(it, c.groups), i = sqItemInfo_(c, it.id, null), ld = last[it.id] || '';
    const days = ld ? Math.max(0, Math.round((new Date(today + 'T00:00:00Z') - new Date(ld + 'T00:00:00Z')) / 86400000)) : '';
    return { code: i.code, name: i.name, unit: i.unit, group: g.sub ? g.main + ' / ' + g.sub : g.main, stock: sqQ_(stock[it.id]), lastSale: ld || 'لم يُبع من قبل', days: days };
  }).sort(function(a, b) { return b.stock - a.stock; });
  return sqResult_('تقرير الأصناف الراكدة عن فترة', c, false, [finSection_('أصناف لها رصيد ولم تُبع خلال الفترة', [finCol_('code', 'رقم الصنف'), finCol_('name', 'اسم الصنف'),
    finCol_('unit', 'الوحدة'), finCol_('group', 'المجموعة'), finCol_('stock', 'الرصيد الحالي', 'qty'), finCol_('lastSale', 'آخر بيع'), finCol_('days', 'أيام منذ آخر بيع', 'int')], rows,
    [{ label: 'عدد الأصناف الراكدة', value: rows.length }])], null, 'الصنف الراكد = صنف نشط له رصيد مخزني ولا توجد له مبيعات معتمدة في الفترة. (الوصف غير محدد في المستند فاعتُمد هذا التعريف.)');
}

/* ش) مقارنة المبيعات والمشتريات عن فترة */
function sqCompare_(o) {
  const c = sqLoad_(o, o.from, o.to), a = sqItemAgg_(c), pq = {};
  const pInv = {};
  emReadAll_('Purchase_Invoices').forEach(function(h) {
    if (h.status === 'approved' && finIn_(h.purchaseDate, o.from, o.to) &&
        (!o.branchId || String(h.branchId) === String(o.branchId)) && (!o.warehouseId || String(h.warehouseId) === String(o.warehouseId))) pInv[h.id] = true;
  });
  const pl = emReadAll_('Purchase_Lines').filter(function(l) { return pInv[l.purchaseInvoiceId]; });
  pl.forEach(function(l) { pq[l.itemId] = (pq[l.itemId] || 0) + finNum_(l.quantity); });
  const ids = {}; Object.keys(a).forEach(function(k) { ids[k] = true; }); Object.keys(pq).forEach(function(k) { ids[k] = true; });
  const rows = Object.keys(ids).map(function(id) {
    const i = a[id] ? { code: a[id].code, name: a[id].name, unit: a[id].unit } : sqItemInfo_(c, id, null);
    return { code: i.code, name: i.name, soldQty: sqQ_(a[id] ? a[id].soldQty : 0), purchQty: sqQ_(pq[id] || 0), unit: i.unit };
  }).sort(function(x, y) { return finCmp_(String(x.code), String(y.code)); });
  return sqResult_('تقرير مقارنة المبيعات والمشتريات عن فترة', c, false, [finSection_('كميات المبيعات مقابل المشتريات', [finCol_('code', 'رقم الصنف'), finCol_('name', 'اسم الصنف'),
    finCol_('soldQty', 'إجمالي الكمية (المبيعات)', 'qty'), finCol_('purchQty', 'إجمالي الكمية (المشتريات)', 'qty'), finCol_('unit', 'الوحدة')], rows,
    [{ label: 'عدد الأصناف', value: rows.length }, { label: 'إجمالي كمية المبيعات', value: sqQ_(rows.reduce(function(s, r) { return s + r.soldQty; }, 0)) },
      { label: 'إجمالي كمية المشتريات', value: sqQ_(rows.reduce(function(s, r) { return s + r.purchQty; }, 0)) }])], null, 'الكميات قبل خصم المرتجعات.');
}

/* ص) بيان ربحية الأصناف (Shift+F11) */
function sqProfitability_(o) {
  const c = sqLoad_(o, o.from, o.to), a = sqItemAgg_(c);
  const rows = Object.keys(a).map(function(k) {
    const x = a[k], val = finRound_(c.m(x.soldVal - x.retVal)), cost = finRound_(c.m(x.cost - x.retCost)), profit = finRound_(val - cost);
    return { code: x.code, name: x.name, unit: x.unit, netQty: sqQ_(x.soldQty - x.retQty), netValue: val, netCost: cost, profit: profit, rate: val ? finRound_(profit / val * 100) : 0 };
  }).sort(function(p, q) { return finCmp_(String(p.code), String(q.code)); });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  const tv = sum('netValue'), tp = sum('profit');
  return sqResult_('بيان ربحية الأصناف', c, true, [finSection_('ربحية الأصناف', [finCol_('code', 'رقم الصنف'), finCol_('name', 'اسم الصنف'), finCol_('unit', 'الوحدة'),
    finCol_('netQty', 'صافي كمية المبيعات', 'qty'), finCol_('netValue', 'صافي قيمة المبيعات بعد الخصم والمرتجعات', 'money'), finCol_('netCost', 'صافي التكلفة بمتوسط أسعار الشراء', 'money'),
    finCol_('profit', 'مجمل الربح الصافي', 'money'), finCol_('rate', 'نسبة الربح', 'pct')], rows,
    [{ label: 'صافي المبيعات', value: tv }, { label: 'صافي التكلفة', value: sum('netCost') }, { label: 'مجمل الربح', value: tp }, { label: 'نسبة الربح %', value: tv ? finRound_(tp / tv * 100) : 0 }])]);
}

/* ض) بيان مقارنة المبيعات بالشهور (Shift+F12) — جدول + رسم بياني */
function sqMonthlyCompare_(o) {
  const endYm = (o.to || emToday_()).slice(0, 7), list = sqMonthList_(endYm, o.months);
  const from = list[0] + '-01', to = list[list.length - 1] + '-31';
  const c = sqLoad_(o, from, to), m = {};
  list.forEach(function(k) { m[k] = { net: 0, returns: 0, cost: 0 }; });
  c.invoices.forEach(function(i) { const x = m[finD_(i.invoiceDate).slice(0, 7)]; if (x) x.net += finNum_(i.totalGross); });
  c.returns.forEach(function(r) { const x = m[finD_(r.returnDate).slice(0, 7)]; if (x) x.returns += finNum_(r.totalGross); });
  c.lines.forEach(function(l) { const x = m[finD_(c.inv[l.salesInvoiceId].invoiceDate).slice(0, 7)]; if (x) x.cost += finNum_(l.quantity) * c.avg(l.itemId); });
  c.retLines.forEach(function(l) { const x = m[finD_(c.ret[l.salesReturnId].returnDate).slice(0, 7)]; if (x) x.cost -= finNum_(l.quantity) * c.avg(l.itemId); });
  const rows = list.map(function(k, idx) {
    const x = m[k], net = finRound_(c.m(x.net)), ret = finRound_(c.m(x.returns)), cost = finRound_(c.m(x.cost));
    const prev = idx > 0 ? finRound_(c.m(m[list[idx - 1]].net)) : null;
    return { month: k, net: net, returns: ret, afterReturns: finRound_(net - ret), profit: finRound_(net - ret - cost), change: prev ? finRound_((net - prev) / prev * 100) : '' };
  });
  const chart = { title: 'حركة المبيعات خلال ' + list.length + ' شهرًا', labels: list, series: [
    { name: 'صافي المبيعات', values: rows.map(function(r) { return r.net; }) },
    { name: 'المرتجعات', values: rows.map(function(r) { return r.returns; }) },
    { name: 'مجمل الربح', values: rows.map(function(r) { return r.profit; }) }] };
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  c.from = from; c.to = list[list.length - 1];
  return sqResult_('بيان مقارنة المبيعات بالشهور', c, true, [finSection_('المبيعات الشهرية', [finCol_('month', 'الشهر'), finCol_('net', 'صافي المبيعات', 'money'), finCol_('returns', 'المرتجعات', 'money'),
    finCol_('afterReturns', 'الصافي بعد المرتجعات', 'money'), finCol_('profit', 'مجمل الربح', 'money'), finCol_('change', 'التغير عن الشهر السابق %', 'pct')], rows,
    [{ label: 'إجمالي صافي المبيعات', value: sum('net') }, { label: 'إجمالي المرتجعات', value: sum('returns') }, { label: 'إجمالي مجمل الربح', value: sum('profit') }])], chart);
}


/* ======================================================================
 * تقارير المشتريات + بيان الأصناف
 * نقطة الدخول: getPurchaseQueryReportFromUi(type, params, token)  (للمدير فقط)
 * الأنواع:
 *   purchase_items      المشتريات عن فترة (أصناف)
 *   purchase_suppliers  المشتريات عن فترة (موردين)
 *   purchase_returns    بيان مرتجع المشتريات
 *   items_available_detailed   متاح بالمخزن — تفصيلي
 *   items_all_detailed         تفصيلي — جميع الأصناف
 *   items_available_summary    متاح بالمخزن — إجمالي
 *   items_all_summary          إجمالي — جميع الأصناف
 *   items_supplier_summary     إجمالي بالمورد
 * params: { fromDate, toDate, branchId, warehouseId, supplierId }
 * الناتج بنفس شكل بقية التقارير: { title, period, note, sections:[{title,columns,rows,summary}] }
 * المحتسب: الفواتير والمرتجعات المعتمدة فقط. المبالغ كما هي في الفاتورة (شاملة الضريبة).
 * ====================================================================== */

function pqById_(sheet) { const m = {}; emReadAll_(sheet).forEach(function(r) { m[r.id] = r; }); return m; }

function pqStock_(warehouseId) {
  const m = {};
  emReadAll_(EM_INVENTORY_SHEET).forEach(function(r) {
    if (warehouseId && String(r.warehouseId) !== String(warehouseId)) return;
    m[r.itemId] = (m[r.itemId] || 0) + finNum_(r.quantityIn) - finNum_(r.quantityOut);
  });
  return m;
}

function pqResult_(title, period, note, sections) {
  return { title: title, period: period, note: note || '', sections: sections };
}

function getPurchaseQueryReportFromUi(type, params, token) {
  requireUiAdmin_(token);
  const p = params || {};
  const o = {
    type: String(type || ''),
    from: String(p.fromDate || '').slice(0, 10),
    to: String(p.toDate || '').slice(0, 10),
    branchId: p.branchId || '', warehouseId: p.warehouseId || '', supplierId: p.supplierId || ''
  };
  switch (o.type) {
    case 'purchase_items': return pqPurchaseItems_(o, false);
    case 'purchase_suppliers': return pqPurchaseItems_(o, true);
    case 'purchase_returns': return pqPurchaseReturns_(o);
    case 'items_available_detailed':
    case 'items_all_detailed':
    case 'items_available_summary':
    case 'items_all_summary':
    case 'items_supplier_summary': return pqItemsStatement_(o);
    default: throw new Error('نوع التقرير غير معروف: ' + type);
  }
}

/* ---------- المشتريات عن فترة: أصناف / موردين ---------- */
function pqPurchaseLines_(o) {
  const items = pqById_('Items'), sup = pqById_('Suppliers'), units = pqById_('Units');
  const inv = {};
  emReadAll_('Purchase_Invoices').forEach(function(h) {
    if (h.status !== 'approved' || !finIn_(h.purchaseDate, o.from, o.to)) return;
    if (o.branchId && String(h.branchId) !== String(o.branchId)) return;
    if (o.warehouseId && String(h.warehouseId) !== String(o.warehouseId)) return;
    if (o.supplierId && String(h.supplierId) !== String(o.supplierId)) return;
    inv[h.id] = h;
  });
  const rows = [];
  emReadAll_('Purchase_Lines').forEach(function(l) {
    const h = inv[l.purchaseInvoiceId];
    if (!h) return;
    const it = items[l.itemId] || {};
    rows.push({
      date: finD_(h.purchaseDate),
      code: l.itemCodeSnapshot || it.itemCode || '',
      name: l.itemNameSnapshot || it.name || '',
      supplierId: h.supplierId || '',
      supplier: (sup[h.supplierId] || {}).name || 'بدون مورد',
      invoice: h.purchaseNumber || '',
      unit: l.unitNameSnapshot || (units[it.unitId] || {}).name || '',
      qty: finNum_(l.quantity),
      price: finRound_(finNum_(l.unitPriceGross)),
      total: finRound_(finNum_(l.netAmountGross || l.grossAmount))
    });
  });
  rows.sort(function(a, b) { return finCmp_(a.date + '|' + a.invoice + '|' + a.code, b.date + '|' + b.invoice + '|' + b.code); });
  return rows;
}

function pqPurchaseItems_(o, bySupplier) {
  const rows = pqPurchaseLines_(o);
  const cols = [finCol_('date', 'التاريخ'), finCol_('code', 'رقم الصنف'), finCol_('name', 'اسم الصنف'), finCol_('supplier', 'المورد'), finCol_('invoice', 'الفاتورة'),
    finCol_('unit', 'الوحدة'), finCol_('qty', 'الكمية', 'qty'), finCol_('price', 'سعر الوحدة', 'money'), finCol_('total', 'الإجمالي', 'money')];
  const tq = function(a) { return Math.round(a.reduce(function(s, r) { return s + r.qty; }, 0) * 1000) / 1000; };
  const tv = function(a) { return finRound_(a.reduce(function(s, r) { return s + r.total; }, 0)); };
  const period = 'الفترة: من ' + (o.from || '—') + ' إلى ' + (o.to || '—');
  const note = 'فواتير الشراء المعتمدة فقط. الأسعار والإجماليات شاملة الضريبة.';
  if (!bySupplier) {
    return pqResult_('المشتريات عن فترة (أصناف)', period, note, [finSection_('حركة المشتريات', cols, rows,
      [{ label: 'عدد البنود', value: rows.length }, { label: 'إجمالي الكمية', value: tq(rows) }, { label: 'إجمالي المشتريات', value: tv(rows) }])]);
  }
  const by = {};
  rows.forEach(function(r) { (by[r.supplier] = by[r.supplier] || []).push(r); });
  const names = Object.keys(by).sort();
  const sections = [], overview = [];
  names.forEach(function(n) {
    const a = by[n];
    overview.push({ supplier: n, count: a.length, qty: tq(a), total: tv(a) });
    sections.push(finSection_('المورد: ' + n, cols, a, [{ label: 'عدد البنود', value: a.length }, { label: 'إجمالي الكمية', value: tq(a) }, { label: 'إجمالي المشتريات', value: tv(a) }]));
  });
  sections.push(finSection_('ملخص الموردين', [finCol_('supplier', 'المورد'), finCol_('count', 'عدد البنود', 'int'), finCol_('qty', 'إجمالي الكمية', 'qty'), finCol_('total', 'إجمالي المشتريات', 'money')],
    overview, [{ label: 'عدد الموردين', value: overview.length }, { label: 'إجمالي المشتريات', value: tv(rows) }]));
  return pqResult_('المشتريات عن فترة (موردين)', period, note, sections);
}

/* ---------- بيان مرتجع المشتريات ---------- */
function pqPurchaseReturns_(o) {
  const sup = pqById_('Suppliers');
  const rows = emReadAll_('Purchase_Returns').filter(function(r) {
    return r.status === 'approved' && finIn_(r.returnDate, o.from, o.to) &&
      (!o.branchId || String(r.branchId) === String(o.branchId)) &&
      (!o.warehouseId || String(r.warehouseId) === String(o.warehouseId)) &&
      (!o.supplierId || String(r.supplierId) === String(o.supplierId));
  }).map(function(r) {
    return { date: finD_(r.returnDate), supplier: (sup[r.supplierId] || {}).name || 'بدون مورد', number: r.returnNumber || '', value: finRound_(finNum_(r.totalGross)) };
  }).sort(function(a, b) { return finCmp_(a.date + a.number, b.date + b.number); });
  return pqResult_('بيان مرتجع المشتريات', 'الفترة: من ' + (o.from || '—') + ' إلى ' + (o.to || '—'), 'أذونات المرتجع المعتمدة فقط. القيمة شاملة الضريبة.',
    [finSection_('أذونات مرتجع المشتريات', [finCol_('date', 'التاريخ'), finCol_('supplier', 'اسم المورد'), finCol_('number', 'رقم الإذن'), finCol_('value', 'القيمة', 'money')], rows,
      [{ label: 'عدد الأذونات', value: rows.length }, { label: 'إجمالي القيمة', value: finRound_(rows.reduce(function(s, r) { return s + r.value; }, 0)) }])]);
}

/* ---------- بيان الأصناف (5 تقارير) ---------- */
function pqItemsStatement_(o) {
  const t = o.type;
  const sup = pqById_('Suppliers'), units = pqById_('Units'), groups = pqById_('Groups');
  const availableOnly = t === 'items_available_detailed' || t === 'items_available_summary' || t === 'items_supplier_summary';
  const stock = pqStock_(o.warehouseId);
  const all = emReadAll_('Items').filter(function(i) {
    if (i.active !== 'on') return false;
    if (o.supplierId && String(i.supplierId) !== String(o.supplierId)) return false;
    if (availableOnly && !(finNum_(stock[i.id]) > 0)) return false;
    return true;
  }).sort(function(a, b) { return finCmp_(String(a.itemCode), String(b.itemCode)); });

  const rows = all.map(function(i) {
    const g = sqGroupInfo_(i, groups);
    return {
      code: i.itemCode, name: i.name, supplierId: i.supplierId || '', supplier: (sup[i.supplierId] || {}).name || 'بدون مورد',
      mainGroup: g.main, subGroup: g.sub, unit: (units[i.unitId] || {}).name || '', stock: Math.round(finNum_(stock[i.id]) * 1000) / 1000,
      reorder: finNum_(i.reorderLevel), purchase: finRound_(finNum_(i.purchasePrice)), sale: finRound_(finNum_(i.salePrice)),
      saleAfter: finRound_(finNum_(i.salePriceAfterDiscount)), consumer: finRound_(finNum_(i.salePriceAfterDiscount)), wholesale: finRound_(finNum_(i.wholesalePrice))
    };
  });

  const C = {
    code: finCol_('code', 'رقم الصنف'), name: finCol_('name', 'اسم الصنف'), supplier: finCol_('supplier', 'المورد'),
    main: finCol_('mainGroup', 'المجموعة الرئيسية'), sub: finCol_('subGroup', 'المجموعة الفرعية'), unit: finCol_('unit', 'الوحدة'),
    stock: finCol_('stock', 'الرصيد بالمخزن', 'qty'), reorder: finCol_('reorder', 'حد إعادة الطلب', 'qty'),
    purchase: finCol_('purchase', 'سعر الشراء', 'money'), sale: finCol_('sale', 'سعر البيع', 'money'),
    saleAfter: finCol_('saleAfter', 'سعر البيع بعد الخصم', 'money'), consumer: finCol_('consumer', 'سعر المستهلك', 'money'), wholesale: finCol_('wholesale', 'سعر الجملة', 'money')
  };
  const wh = o.warehouseId ? ((emFindById_('Warehouses', o.warehouseId) || {}).name || '') : 'كل المخازن';
  const period = availableOnly ? 'المخزن: ' + wh : 'جميع الأصناف النشطة';
  const cnt = function(a) { return [{ label: 'عدد الأصناف', value: a.length }]; };
  const availNote = 'الصنف المتاح = صنف نشط رصيده في المخزن المحدد أكبر من صفر.';

  if (t === 'items_available_detailed') {
    return pqResult_('بيان الأصناف — متاح بالمخزن (تفصيلي)', period, availNote,
      [finSection_('الأصناف المتاحة', [C.code, C.name, C.supplier, C.stock, C.reorder, C.purchase, C.sale, C.saleAfter], rows, cnt(rows))]);
  }
  if (t === 'items_all_detailed') {
    return pqResult_('بيان الأصناف — تفصيلي (جميع الأصناف)', period, 'سعر المستهلك = سعر البيع بعد الخصم.',
      [finSection_('جميع الأصناف', [C.code, C.name, C.supplier, C.main, C.sub, C.reorder, C.purchase, C.sale, C.consumer, C.wholesale, C.unit], rows, cnt(rows))]);
  }
  if (t === 'items_available_summary') {
    return pqResult_('بيان الأصناف — متاح بالمخزن (إجمالي)', period, availNote,
      [finSection_('الأصناف المتاحة', [C.code, C.name, C.stock, C.reorder, C.purchase, C.sale, C.saleAfter], rows, cnt(rows))]);
  }
  if (t === 'items_all_summary') {
    return pqResult_('بيان الأصناف — إجمالي (جميع الأصناف)', period, '',
      [finSection_('جميع الأصناف', [C.code, C.name, C.supplier, C.reorder, C.purchase, C.sale, C.saleAfter], rows, cnt(rows))]);
  }
  // items_supplier_summary: أصناف كل مورد المتاحة بالمخزن
  const by = {};
  rows.forEach(function(r) { (by[r.supplier] = by[r.supplier] || []).push(r); });
  const sections = Object.keys(by).sort().map(function(n) {
    return finSection_('المورد: ' + n, [C.code, C.name, C.supplier, C.stock, C.reorder, C.purchase, C.sale, C.saleAfter], by[n], cnt(by[n]));
  });
  if (!sections.length) sections.push(finSection_('أصناف الموردين', [C.code, C.name, C.supplier, C.stock, C.reorder, C.purchase, C.sale, C.saleAfter], [], []));
  return pqResult_('بيان الأصناف — إجمالي بالمورد', period, availNote, sections);
}


/* =====================================================================
 * استعلامات المخزون: حركة الصنف، الأرصدة، استعراض الأصناف، التقييم،
 * حد إعادة الطلب، تسويات المخزن
 * نقطة الدخول: getInventoryQueryReportFromUi(type, params, token)  (للمدير فقط)
 * ===================================================================== */
function iqQ_(v) { return Math.round((Number(v) || 0) * 1000) / 1000; }

/** تصنيف حركة المخزون (مع عكس الإلغاء إلى نفس تصنيف المستند الأصلي) */
function iqKind_(r) {
  const st = String(r.sourceType || '');
  const rev = /_cancellation$/.test(st) || String(r.transactionType) === 'cancellation_reversal';
  const base = st.replace(/_cancellation$/, '');
  const map = {
    purchase_invoice: ['purchase', 'فاتورة مشتريات'], purchase_return: ['preturn', 'مرتد مشتريات'],
    sales_invoice: ['sale', 'فاتورة مبيعات'], sales_return: ['sreturn', 'مرتد مبيعات'],
    transfer: ['transfer', String(r.transactionType) === 'transfer_in' ? 'تحويل وارد' : 'تحويل صادر'],
    stocktake: ['adj', 'تسوية جرد'], adjustment: ['adj', 'تسوية مخزنية'], opening_balance: ['adj', 'رصيد افتتاحي']
  };
  const m = map[base] || ['adj', base || 'حركة مخزون'];
  return { kind: m[0], label: (rev ? 'إلغاء ' : '') + m[1], base: base };
}

/** حركات المخزون مرتبة زمنيًا ومفلترة بالمخزن/الفرع/الصنف (بدون فلتر تاريخ) */
function iqMoves_(o) {
  const out = [];
  emReadAll_(EM_INVENTORY_SHEET).forEach(function(r, i) {
    if (o.warehouseId && String(r.warehouseId) !== String(o.warehouseId)) return;
    if (o.branchId && String(r.branchId) !== String(o.branchId)) return;
    if (o.itemId && String(r.itemId) !== String(o.itemId)) return;
    const k = iqKind_(r);
    out.push({
      idx: i, raw: String(r.transactionDate || ''), date: finD_(r.transactionDate), itemId: r.itemId,
      warehouseId: r.warehouseId, kind: k.kind, label: k.label, base: k.base, number: r.sourceNumber || '', notes: r.notes || '',
      transactionType: r.transactionType,
      qin: finNum_(r.quantityIn), qout: finNum_(r.quantityOut)
    });
  });
  out.sort(function(a, b) { return a.raw < b.raw ? -1 : a.raw > b.raw ? 1 : a.idx - b.idx; });
  return out;
}

/** أرصدة الأصناف حتى تاريخ (اختياري) */
function iqBalances_(o, upTo) {
  const m = {};
  iqMoves_(o).forEach(function(r) {
    if (upTo && r.date > upTo) return;
    m[r.itemId] = (m[r.itemId] || 0) + r.qin - r.qout;
  });
  return m;
}

function iqCtx_() {
  const items = emReadAll_('Items');
  return { items: items, byId: pqById_('Items'), sup: pqById_('Suppliers'), groups: pqById_('Groups'), units: pqById_('Units') };
}

function iqRowOf_(it, c) {
  const gi = sqGroupInfo_(it, c.groups);
  return {
    id: it.id, code: it.itemCode || '', name: it.name || '', supplierId: it.supplierId || '',
    supplier: (c.sup[it.supplierId] || {}).name || 'بدون مورد',
    main: gi.main, sub: gi.sub, unit: (c.units[it.unitId] || {}).name || '',
    reorder: finNum_(it.reorderLevel), purchase: finNum_(it.purchasePrice), sale: finNum_(it.salePrice),
    saleAfter: finNum_(it.salePriceAfterDiscount), wholesale: finNum_(it.wholesalePrice), discount: finNum_(it.discountRate)
  };
}

function iqSearchOk_(r, q) {
  if (!q) return true;
  const s = finNorm_(q);
  return finNorm_(r.name).indexOf(s) >= 0 || finNorm_(r.code).indexOf(s) >= 0;
}

function getInventoryQueryReportFromUi(type, params, token) {
  requireUiAdmin_(token);
  const p = params || {};
  const o = {
    type: String(type || ''),
    from: String(p.fromDate || '').slice(0, 10), to: String(p.toDate || '').slice(0, 10),
    branchId: p.branchId || '', warehouseId: p.warehouseId || '', supplierId: p.supplierId || '',
    itemId: p.itemId || '', q: String(p.query || '').trim()
  };
  switch (o.type) {
    case 'move_detailed': return iqItemMove_(o, false);
    case 'move_summary': return iqItemMove_(o, true);
    case 'bal_detailed': return iqBalDetailed_(o);
    case 'bal_summary': return iqBalSummary_(o);
    case 'bal_groups': return iqBalGroups_(o);
    case 'bal_branches': return iqBalBranches_(o);
    case 'bal_inout': return iqInOut_(o);
    case 'item_view': return iqItemView_(o);
    case 'valuation': return iqValuation_(o);
    case 'reorder': return iqReorder_(o);
    case 'adjustments': return iqAdjustments_(o);
    default: throw new Error('نوع التقرير غير معروف: ' + type);
  }
}

/* ---------- حركة الصنف: تفصيلي / إجمالي ---------- */
function iqItemMove_(o, summary) {
  if (!o.itemId) throw new Error('اختر الصنف أولًا.');
  const c = iqCtx_(), it = c.byId[o.itemId];
  if (!it) throw new Error('الصنف غير موجود.');
  const moves = iqMoves_(o);
  let opening = 0;
  const inRange = [];
  moves.forEach(function(r) {
    if (o.from && r.date < o.from) { opening += r.qin - r.qout; return; }
    if (o.to && r.date > o.to) return;
    inRange.push(r);
  });
  const rows = [{ date: o.from || '', in: '', out: '', balance: iqQ_(opening), statement: 'رصيد سابق' }];
  let bal = opening, tin = 0, tout = 0;
  if (!summary) {
    inRange.forEach(function(r) {
      bal += r.qin - r.qout; tin += r.qin; tout += r.qout;
      rows.push({ date: r.date, in: iqQ_(r.qin), out: iqQ_(r.qout), balance: iqQ_(bal),
        statement: r.label + (r.number ? ' رقم ' + r.number : '') + (r.notes && r.base !== 'purchase_invoice' && r.base !== 'sales_invoice' ? ' — ' + r.notes : '') });
    });
  } else {
    const groups = [], idx = {};
    inRange.forEach(function(r) {
      const k = r.date + '|' + r.label;
      if (!(k in idx)) { idx[k] = groups.length; groups.push({ date: r.date, label: r.label, qin: 0, qout: 0, n: 0 }); }
      const g = groups[idx[k]]; g.qin += r.qin; g.qout += r.qout; g.n++;
    });
    groups.forEach(function(g) {
      bal += g.qin - g.qout; tin += g.qin; tout += g.qout;
      rows.push({ date: g.date, in: iqQ_(g.qin), out: iqQ_(g.qout), balance: iqQ_(bal), statement: g.label + (g.n > 1 ? ' (' + g.n + ' حركة)' : '') });
    });
  }
  const cols = [finCol_('date', 'التاريخ'), finCol_('in', 'الوارد', 'qty'), finCol_('out', 'الصادر', 'qty'), finCol_('balance', 'الرصيد', 'qty'), finCol_('statement', 'البيان')];
  const period = 'الفترة: من ' + (o.from || '—') + ' إلى ' + (o.to || '—');
  const info = 'رقم الصنف: ' + (it.itemCode || '') + ' — اسم الصنف: ' + (it.name || '');
  return pqResult_(summary ? 'حركة الصنف — إجمالي' : 'حركة الصنف — تفصيلي', period, info,
    [finSection_(info, cols, rows, [{ label: 'رصيد أول الفترة', value: iqQ_(opening) }, { label: 'إجمالي الوارد', value: iqQ_(tin) }, { label: 'إجمالي الصادر', value: iqQ_(tout) }, { label: 'رصيد آخر الفترة', value: iqQ_(bal) }])]);
}

/* ---------- بيان الأرصدة بالمخزن ---------- */
function iqBalRows_(o, opts) {
  const c = iqCtx_(), bal = iqBalances_(o, '');
  const rows = [];
  c.items.forEach(function(it) {
    if (o.supplierId && String(it.supplierId) !== String(o.supplierId)) return;
    const r = iqRowOf_(it, c);
    if (!iqSearchOk_(r, o.q)) return;
    r.balance = iqQ_(bal[it.id] || 0);
    if (opts && opts.nonZero && r.balance === 0) return;
    rows.push(r);
  });
  rows.sort(function(a, b) { return finCmp_(String(a.code), String(b.code)); });
  return rows;
}

function iqBalDetailed_(o) {
  const rows = iqBalRows_(o, { nonZero: true });
  const cols = [finCol_('code', 'رقم الصنف'), finCol_('name', 'اسم الصنف'), finCol_('supplier', 'المورد'), finCol_('purchase', 'سعر الشراء', 'money'), finCol_('balance', 'إجمالي الرصيد', 'qty')];
  return pqResult_('بيان الأرصدة بالمخزن — تفصيلي', 'الأرصدة الحالية', 'الأصناف ذات الرصيد غير الصفري. يمكن البحث بالاسم أو الرقم.',
    [finSection_('الأرصدة', cols, rows, [{ label: 'عدد الأصناف', value: rows.length }, { label: 'إجمالي الرصيد', value: iqQ_(rows.reduce(function(s, r) { return s + r.balance; }, 0)) }])]);
}

function iqBalSummary_(o) {
  const rows = iqBalRows_(o, { nonZero: true });
  const cols = [finCol_('code', 'رقم الصنف'), finCol_('name', 'اسم الصنف'), finCol_('purchase', 'سعر الشراء', 'money'), finCol_('sale', 'سعر البيع', 'money'), finCol_('balance', 'إجمالي الرصيد', 'qty'), finCol_('supplier', 'المورد')];
  return pqResult_('بيان الأرصدة بالمخزن — إجمالي', 'الأرصدة الحالية', 'الأصناف ذات الرصيد غير الصفري.',
    [finSection_('الأرصدة', cols, rows, [{ label: 'عدد الأصناف', value: rows.length }, { label: 'إجمالي الرصيد', value: iqQ_(rows.reduce(function(s, r) { return s + r.balance; }, 0)) }])]);
}

function iqBalBranches_(o) {
  const o2 = { warehouseId: '', branchId: '', itemId: '', supplierId: o.supplierId, q: o.q };
  const rows = iqBalRows_(o2, { nonZero: true });
  const cols = [finCol_('code', 'رقم الصنف'), finCol_('name', 'اسم الصنف'), finCol_('supplier', 'المورد'), finCol_('balance', 'إجمالي الرصيد', 'qty')];
  return pqResult_('أرصدة الأصناف — جميع الفروع (تفصيلي)', 'الأرصدة الحالية', 'مجموع الأرصدة في كل المخازن والفروع.',
    [finSection_('الأرصدة', cols, rows, [{ label: 'عدد الأصناف', value: rows.length }, { label: 'إجمالي الرصيد', value: iqQ_(rows.reduce(function(s, r) { return s + r.balance; }, 0)) }])]);
}

/** تجميع حسب المجموعة الرئيسية/الفرعية: ينتج صفوف الفرعي + صف إجمالي لكل رئيسية */
function iqGroupTable_(rows, metrics) {
  const mains = {};
  rows.forEach(function(r) {
    const m = mains[r.main] = mains[r.main] || { subs: {}, total: {} };
    const sk = r.sub || '— (مباشر)';
    const s = m.subs[sk] = m.subs[sk] || {};
    metrics.forEach(function(k) {
      s[k] = (s[k] || 0) + (r[k] || 0);
      m.total[k] = (m.total[k] || 0) + (r[k] || 0);
    });
  });
  const out = [], grand = {};
  Object.keys(mains).sort().forEach(function(mn) {
    const m = mains[mn];
    Object.keys(m.subs).sort().forEach(function(sn) {
      const row = { main: mn, sub: sn }; metrics.forEach(function(k) { row[k] = m.subs[sn][k]; }); out.push(row);
    });
    const tr = { main: mn, sub: 'إجمالي المجموعة الرئيسية', isTotal: true };
    metrics.forEach(function(k) { tr['tot_' + k] = m.total[k]; grand[k] = (grand[k] || 0) + m.total[k]; });
    out.push(tr);
  });
  return { rows: out, grand: grand };
}

function iqBalGroups_(o) {
  const rows = iqBalRows_(o, { nonZero: false });
  const t = iqGroupTable_(rows, ['balance']);
  t.rows.forEach(function(r) {
    if (r.isTotal) { r.mainBalance = iqQ_(r.tot_balance); r.subBalance = ''; } else { r.subBalance = iqQ_(r.balance); r.mainBalance = ''; }
  });
  const cols = [finCol_('main', 'المجموعة الرئيسية'), finCol_('sub', 'المجموعة الفرعية'), finCol_('subBalance', 'إجمالي رصيد المجموعات الفرعية', 'qty'), finCol_('mainBalance', 'إجمالي رصيد المجموعات الرئيسية', 'qty')];
  return pqResult_('أرصدة المجموعة السلعية', 'الأرصدة الحالية', '', [finSection_('الأرصدة حسب المجموعة', cols, t.rows, [{ label: 'إجمالي الرصيد', value: iqQ_(t.grand.balance || 0) }])]);
}

/* ---------- إجمالي وارد ومنصرف الأصناف ---------- */
function iqInOut_(o) {
  const c = iqCtx_(), moves = iqMoves_(o), agg = {};
  moves.forEach(function(r) {
    const a = agg[r.itemId] = agg[r.itemId] || { bal: 0, purchase: 0, preturn: 0, sale: 0, sreturn: 0, transfer: 0, adj: 0 };
    if (!o.to || r.date <= o.to) a.bal += r.qin - r.qout;
    if (!finIn_(r.date, o.from, o.to)) return;
    // الوارد موجب والمنصرف سالب
    a[r.kind] += r.qin - r.qout;
  });
  const rows = [];
  c.items.forEach(function(it) {
    if (o.supplierId && String(it.supplierId) !== String(o.supplierId)) return;
    const r = iqRowOf_(it, c);
    if (!iqSearchOk_(r, o.q)) return;
    const a = agg[it.id];
    if (!a) return;
    const has = a.bal || a.purchase || a.preturn || a.sale || a.sreturn || a.transfer || a.adj;
    if (!has) return;
    rows.push({ code: r.code, name: r.name, balance: iqQ_(a.bal), purchase: iqQ_(a.purchase), preturn: iqQ_(a.preturn), sale: iqQ_(a.sale), sreturn: iqQ_(a.sreturn), transfer: iqQ_(a.transfer), adj: iqQ_(a.adj) });
  });
  rows.sort(function(a, b) { return finCmp_(String(a.code), String(b.code)); });
  const sum = function(k) { return iqQ_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  const cols = [finCol_('code', 'رقم الصنف'), finCol_('name', 'اسم الصنف'), finCol_('balance', 'الرصيد', 'qty'), finCol_('purchase', 'مشتريات', 'qty'), finCol_('preturn', 'مرتد مشتريات', 'qty'),
    finCol_('sale', 'مبيعات', 'qty'), finCol_('sreturn', 'مرتد مبيعات', 'qty'), finCol_('transfer', 'تحويلات', 'qty'), finCol_('adj', 'تسويات', 'qty')];
  return pqResult_('إجمالي وارد ومنصرف الأصناف', 'الفترة: من ' + (o.from || '—') + ' إلى ' + (o.to || '—'),
    'الوارد بإشارة موجبة والمنصرف بإشارة سالبة (صافي بعد الإلغاءات). التسويات تشمل الجرد والتسويات اليدوية والأرصدة الافتتاحية. الرصيد حتى نهاية الفترة.',
    [finSection_('حركة الأصناف', cols, rows, [{ label: 'عدد الأصناف', value: rows.length }, { label: 'إجمالي الرصيد', value: sum('balance') }, { label: 'إجمالي المشتريات', value: sum('purchase') }, { label: 'إجمالي المبيعات', value: sum('sale') }])]);
}

/* ---------- استعراض الأصناف ---------- */
function iqItemView_(o) {
  if (!o.itemId) throw new Error('اختر الصنف أولًا.');
  const c = iqCtx_(), it = c.byId[o.itemId];
  if (!it) throw new Error('الصنف غير موجود.');
  const r = iqRowOf_(it, c);
  r.group = r.sub ? r.main + ' / ' + r.sub : r.main;
  const bal = iqBalances_({ warehouseId: o.warehouseId, branchId: o.branchId, itemId: o.itemId }, '');
  r.balance = iqQ_(bal[it.id] || 0);
  const cols = [finCol_('code', 'رقم الصنف'), finCol_('name', 'الاسم'), finCol_('supplier', 'اسم المورد'), finCol_('group', 'المجموعة السلعية'), finCol_('unit', 'الوحدة'),
    finCol_('reorder', 'حد إعادة الطلب', 'qty'), finCol_('purchase', 'سعر الشراء', 'money'), finCol_('discount', 'نسبة الخصم', 'pct'), finCol_('sale', 'سعر البيع', 'money'),
    finCol_('saleAfter', 'سعر البيع بعد الخصم', 'money'), finCol_('wholesale', 'سعر البيع بالجملة', 'money'), finCol_('balance', 'الرصيد الحالي', 'qty')];
  return pqResult_('استعراض الصنف', '', '', [finSection_(r.name, cols, [r], [])]);
}

/* ---------- تقييم الأصناف ---------- */
function iqValuation_(o) {
  const rows = iqBalRows_(o, { nonZero: true });
  rows.forEach(function(r) {
    r.vPurchase = r.balance * r.purchase; r.vSale = r.balance * r.sale;
    r.vWholesale = r.balance * r.wholesale; r.vConsumer = r.balance * r.saleAfter;
  });
  const t = iqGroupTable_(rows, ['balance', 'vPurchase', 'vSale', 'vWholesale', 'vConsumer']);
  t.rows.forEach(function(r) {
    const s = r.isTotal ? 'tot_' : '';
    r.qty = iqQ_(r[s + 'balance']); r.vPurchase = finRound_(r[s + 'vPurchase']); r.vSale = finRound_(r[s + 'vSale']);
    r.vWholesale = finRound_(r[s + 'vWholesale']); r.vConsumer = finRound_(r[s + 'vConsumer']);
    r.mainSale = r.isTotal ? finRound_(r.tot_vSale) : '';
  });
  const cols = [finCol_('main', 'المجموعة الرئيسية'), finCol_('sub', 'المجموعة الفرعية'), finCol_('qty', 'رصيد الأصناف بالمجموعة', 'qty'), finCol_('vPurchase', 'القيمة بسعر الشراء', 'money'),
    finCol_('vSale', 'القيمة بسعر البيع', 'money'), finCol_('vWholesale', 'القيمة بسعر الجملة', 'money'), finCol_('vConsumer', 'القيمة بسعر المستهلك', 'money'),
    finCol_('mainSale', 'إجمالي مجموعات رئيسية بسعر البيع', 'money')];
  const g = t.grand;
  return pqResult_('تقييم الأصناف', 'الأرصدة الحالية', 'سعر المستهلك = سعر البيع بعد الخصم.',
    [finSection_('التقييم حسب المجموعة', cols, t.rows, [{ label: 'إجمالي الرصيد', value: iqQ_(g.balance || 0) }, { label: 'القيمة بسعر الشراء', value: finRound_(g.vPurchase || 0) },
      { label: 'القيمة بسعر البيع', value: finRound_(g.vSale || 0) }, { label: 'القيمة بسعر الجملة', value: finRound_(g.vWholesale || 0) }, { label: 'القيمة بسعر المستهلك', value: finRound_(g.vConsumer || 0) }])]);
}

/* ---------- حد إعادة الطلب ---------- */
function iqReorder_(o) {
  const rows = iqBalRows_(o, { nonZero: false }).filter(function(r) { return r.reorder > 0 && r.balance <= r.reorder; });
  const cols = [finCol_('code', 'رقم الصنف'), finCol_('name', 'الاسم'), finCol_('supplier', 'اسم المورد'), finCol_('reorder', 'حد إعادة الطلب', 'qty'), finCol_('balance', 'الرصيد بالمخزن', 'qty')];
  return pqResult_('بيان حد إعادة الطلب', 'الأرصدة الحالية', 'الأصناف التي وصل رصيدها إلى حد إعادة الطلب أو أقل.',
    [finSection_('أصناف تحتاج إعادة طلب', cols, rows, [{ label: 'عدد الأصناف', value: rows.length }])]);
}

/* ---------- استعراض تسويات المخزن ---------- */
function iqAdjustments_(o) {
  const c = iqCtx_(), rows = [];
  iqMoves_(o).forEach(function(r) {
    if (r.base !== 'stocktake' && r.base !== 'adjustment') return;
    if (!finIn_(r.date, o.from, o.to)) return;
    const it = c.byId[r.itemId]; if (!it) return;
    const x = iqRowOf_(it, c);
    if (o.supplierId && String(x.supplierId) !== String(o.supplierId)) return;
    const net = r.qin - r.qout;
    rows.push({ date: r.date, statement: r.label + (r.number ? ' رقم ' + r.number : '') + (r.notes ? ' — ' + r.notes : ''), code: x.code, name: x.name,
      added: iqQ_(r.qin), deducted: iqQ_(r.qout), vPurchase: finRound_(net * x.purchase), vSale: finRound_(net * x.sale), vWholesale: finRound_(net * x.wholesale), vConsumer: finRound_(net * x.saleAfter) });
  });
  const cols = [finCol_('date', 'التاريخ'), finCol_('statement', 'البيان'), finCol_('code', 'رقم الصنف'), finCol_('name', 'اسم الصنف'), finCol_('added', 'كمية مضافة', 'qty'), finCol_('deducted', 'كمية مخصومة', 'qty'),
    finCol_('vPurchase', 'القيمة بسعر الشراء', 'money'), finCol_('vSale', 'القيمة بسعر البيع', 'money'), finCol_('vWholesale', 'القيمة بسعر الجملة', 'money'), finCol_('vConsumer', 'القيمة بسعر المستهلك', 'money')];
  const sum = function(k) { return rows.reduce(function(s, r) { return s + r[k]; }, 0); };
  return pqResult_('استعراض تسويات المخزن', 'الفترة: من ' + (o.from || '—') + ' إلى ' + (o.to || '—'), 'القيم = صافي الكمية (المضافة − المخصومة) × السعر الحالي للصنف. تشمل تسويات الجرد والتسويات اليدوية.',
    [finSection_('التسويات', cols, rows, [{ label: 'عدد الحركات', value: rows.length }, { label: 'إجمالي المضاف', value: iqQ_(sum('added')) }, { label: 'إجمالي المخصوم', value: iqQ_(sum('deducted')) },
      { label: 'القيمة بسعر الشراء', value: finRound_(sum('vPurchase')) }, { label: 'القيمة بسعر البيع', value: finRound_(sum('vSale')) }])]);
}


/* ======================================================================
 * تقارير العملاء
 * نقطة الدخول الوحيدة: getCustomerReportFromUi(type, params, token)  (للمدير فقط)
 * الأنواع:
 *   detail          بيان تفصيلي عن العملاء            params: customerId
 *   summary         بيان إجمالي عن العملاء            params: region, sellerId, branchId
 *   sales_invoice   مبيعات العملاء — تفصيلي بالفاتورة   params: customerId, fromDate, toDate
 *   sales_total     مبيعات العملاء — إجمالي           params: fromDate, toDate
 *   sales_items     مبيعات العملاء — إجمالي بالأصناف   params: customerId, fromDate, toDate
 *   item_customers  تفصيلي مبيعات الأصناف بالعملاء     params: itemId, fromDate, toDate
 *   statement       كشف حساب عميل                    params: customerId, fromDate, toDate
 *   dormant         بيان الحسابات الخاملة             params: fromDate, toDate
 *   settlements     استعراض تسويات العملاء            params: customerId?, fromDate, toDate
 * الناتج: { title, period, note, sections:[{title,columns,rows,summary}], barcodes? }
 * المحتسب: الفواتير والمرتجعات والإيصالات المعتمدة فقط.
 * المنطقة = نص يُبحث عنه داخل عنوان العميل. المندوب = موظف البيع في فواتير العميل. القسم = الفرع.
 * ====================================================================== */

function getCustomerReportFromUi(type, params, token) {
  requireUiAdmin_(token);
  const p = params || {};
  const o = {
    type: String(type || ''),
    from: String(p.fromDate || '').slice(0, 10),
    to: String(p.toDate || '').slice(0, 10),
    customerId: p.customerId || '', itemId: p.itemId || '', sellerId: p.sellerId || '', branchId: p.branchId || '',
    region: String(p.region || '').trim()
  };
  switch (o.type) {
    case 'detail': return cuDetail_(o);
    case 'summary': return cuSummary_(o);
    case 'sales_invoice': return cuSalesInvoice_(o);
    case 'sales_total': return cuSalesTotal_(o);
    case 'sales_items': return cuSalesItems_(o);
    case 'item_customers': return cuItemCustomers_(o);
    case 'statement': return cuStatement_(o);
    case 'dormant': return cuDormant_(o);
    case 'settlements': return cuSettlements_(o);
    default: throw new Error('نوع تقرير العملاء غير معروف: ' + type);
  }
}

function cuPeriod_(o) { return 'الفترة: ' + sqPeriod_(o.from, o.to); }
function cuResult_(title, period, note, sections, extra) {
  const r = { title: title, period: period || '', note: note || '', sections: sections };
  if (extra) Object.keys(extra).forEach(function(k) { r[k] = extra[k]; });
  return r;
}
function cuRequireCustomer_(o) {
  const c = o.customerId ? emFindById_('Customers', o.customerId) : null;
  if (!c) throw new Error('اختر العميل أولًا.');
  return c;
}
function cuInvSort_(a, b) {
  return finCmp_(finD_(a.invoiceDate) + '|' + (a.invoiceNumber || ''), finD_(b.invoiceDate) + '|' + (b.invoiceNumber || ''));
}

/** حركات حساب كل عميل بنفس منطق finPartyBalances_ (فواتير آجلة، مرتجعاتها، إيصالات، أرصدة افتتاحية، تسويات). */
function cuMovements_() {
  const customers = emReadAll_('Customers'), ids = {}, byName = {}, mv = {};
  customers.forEach(function(c) { ids[c.id] = true; byName[finNorm_(c.name)] = c.id; });
  const add = function(id, m) { if (id && ids[id]) (mv[id] = mv[id] || []).push(m); };
  const inv = {};
  emReadAll_('Sales_Invoices').forEach(function(i) {
    if (i.status !== 'approved') return;
    inv[i.id] = i;
    if (i.paymentType === 'credit') add(i.customerId, { date: finD_(i.invoiceDate), seq: 1, branchId: i.branchId || '', description: 'فاتورة بيع رقم ' + (i.invoiceNumber || ''), debit: finNum_(i.totalGross), credit: 0 });
  });
  emReadAll_('Sales_Returns').forEach(function(r) {
    if (r.status !== 'approved') return;
    const o = inv[r.salesInvoiceId];
    if (o && o.paymentType === 'credit') add(o.customerId, { date: finD_(r.returnDate), seq: 2, branchId: r.branchId || o.branchId || '', description: 'مرتجع مبيعات رقم ' + (r.returnNumber || ''), debit: 0, credit: finNum_(r.totalGross) });
  });
  emReadAll_('Cash_Receipts').forEach(function(r) {
    if (r.status !== 'approved') return;
    let id = r.receivedFromId && ids[r.receivedFromId] ? r.receivedFromId : '';
    if (!id && (!r.receivedFromType || r.receivedFromType === 'customer')) id = byName[finNorm_(r.receivedFromName)] || '';
    add(id, { date: finD_(r.receiptDate), seq: 3, branchId: '', description: 'إيصال استلام ' + (r.receiptNumber || '') + (r.description ? ' — ' + r.description : ''), debit: 0, credit: finNum_(r.amount) });
  });
  emReadAll_('Opening_Balances').forEach(function(b) {
    if (b.balanceType !== 'customer') return;
    const a = finNum_(b.amount);
    add(b.partyId, { date: finD_(b.balanceDate), seq: 0, branchId: b.branchId || '', description: 'رصيد افتتاحي', debit: a >= 0 ? a : 0, credit: a < 0 ? -a : 0 });
  });
  emReadAll_('Adjustments').forEach(function(a) {
    if (a.adjustmentType !== 'customer' || a.status !== 'approved') return;
    const v = finNum_(a.amount);
    add(a.partyId, { date: finD_(a.createdAt), seq: 4, branchId: a.branchId || '', description: 'تسوية' + (a.reason ? ' — ' + a.reason : ''), debit: v >= 0 ? v : 0, credit: v < 0 ? -v : 0 });
  });
  Object.keys(mv).forEach(function(k) {
    mv[k].sort(function(x, y) { return finCmp_(x.date + x.seq, y.date + y.seq); });
  });
  return mv;
}

function cuBalances_() {
  const m = {};
  finPartyBalances_('customer', '').forEach(function(b) { m[b.id] = b.balance; });
  return m;
}

/* ---------- 1) أ) بيان تفصيلي ---------- */
function cuDetail_(o) {
  const c = cuRequireCustomer_(o);
  const emp = pqById_('Employees');
  const row = {
    code: c.customerCode || '', name: c.name || '', address: c.address || '', phone: c.phone || '', mobile: c.mobile || '',
    email: c.email || '', discountRate: finNum_(c.discountRate), barcode: c.barcode || c.customerCode || '',
    manager: (emp[c.managerEmployeeId] || {}).name || ''
  };
  return cuResult_('بيان تفصيلي عن العميل — ' + row.name, '', 'يمكن طباعة الباركود من زر «طباعة الباركود».', [finSection_('بيانات العميل', [
    finCol_('code', 'رقم العميل'), finCol_('name', 'اسم العميل'), finCol_('address', 'العنوان'), finCol_('phone', 'التليفون'), finCol_('mobile', 'رقم الموبايل'),
    finCol_('email', 'البريد الإلكتروني'), finCol_('discountRate', 'نسبة الخصم %', 'pct'), finCol_('barcode', 'الباركود'), finCol_('manager', 'المدير المسئول')
  ], [row], [])], { barcodes: [{ name: row.name, barcode: row.barcode }] });
}

/* ---------- 1) ب) بيان إجمالي ---------- */
function cuSummary_(o) {
  const customers = emReadAll_('Customers'), emp = pqById_('Employees'), bal = cuBalances_();
  let seller = null, branch = null;
  if (o.sellerId || o.branchId) {
    seller = {}; branch = {};
    emReadAll_('Sales_Invoices').forEach(function(i) {
      if (i.status !== 'approved') return;
      if (o.sellerId && String(i.sellerEmployeeId) === String(o.sellerId)) seller[i.customerId] = true;
      if (o.branchId && String(i.branchId) === String(o.branchId)) branch[i.customerId] = true;
    });
  }
  const reg = finNorm_(o.region);
  const rows = customers.filter(function(c) {
    if (reg && finNorm_(c.address).indexOf(reg) < 0) return false;
    if (o.sellerId && !seller[c.id]) return false;
    if (o.branchId && !branch[c.id]) return false;
    return c.active !== 'off';
  }).sort(function(a, b) { return finCmp_(finNorm_(a.name), finNorm_(b.name)); }).map(function(c) {
    return { name: c.name || '', address: c.address || '', phone: c.phone || c.mobile || '', manager: (emp[c.managerEmployeeId] || {}).name || '', balance: finRound_(bal[c.id] || 0) };
  });
  const total = finRound_(rows.reduce(function(s, r) { return s + r.balance; }, 0));
  return cuResult_('بيان إجمالي عن العملاء', '', 'الرصيد المستحق = الفواتير الآجلة + الأرصدة الافتتاحية والتسويات − المرتجعات والإيصالات.', [finSection_('قائمة العملاء', [
    finCol_('name', 'اسم العميل'), finCol_('address', 'العنوان'), finCol_('phone', 'التليفون'), finCol_('manager', 'المدير المسئول'), finCol_('balance', 'الرصيد المستحق على العميل', 'money')
  ], rows, [{ label: 'عدد العملاء', value: rows.length }, { label: 'إجمالي المستحق', value: total }])]);
}

/* ---------- 2) مبيعات العملاء: تفصيلي بالفاتورة ---------- */
function cuSalesInvoice_(o) {
  const c = cuRequireCustomer_(o);
  const rows = emReadAll_('Sales_Invoices').filter(function(i) {
    return i.status === 'approved' && String(i.customerId) === String(c.id) && finIn_(i.invoiceDate, o.from, o.to);
  }).sort(cuInvSort_).map(function(i) {
    return { date: finD_(i.invoiceDate), number: i.invoiceNumber || '', amount: finRound_(finNum_(i.totalGross)), sales: i.paymentType === 'credit' ? 'آجل' : 'نقدي', notes: i.notes || '' };
  });
  const t = finRound_(rows.reduce(function(s, r) { return s + r.amount; }, 0));
  return cuResult_('مبيعات العميل بالفاتورة — ' + c.name, cuPeriod_(o), 'المبالغ شاملة الضريبة.', [finSection_('الفواتير', [
    finCol_('date', 'التاريخ'), finCol_('number', 'رقم الفاتورة'), finCol_('amount', 'المبلغ', 'money'), finCol_('sales', 'المبيعات'), finCol_('notes', 'ملاحظات')
  ], rows, [{ label: 'عدد الفواتير', value: rows.length }, { label: 'إجمالي المبالغ', value: t }])]);
}

/* ---------- 2) مبيعات العملاء: إجمالي ---------- */
function cuSalesTotal_(o) {
  const customers = pqById_('Customers'), by = {};
  const slot = function(id) { return by[id] || (by[id] = { cash: 0, credit: 0, returns: 0 }); };
  emReadAll_('Sales_Invoices').forEach(function(i) {
    if (i.status !== 'approved' || !finIn_(i.invoiceDate, o.from, o.to)) return;
    const s = slot(i.customerId || ''), v = finNum_(i.totalGross);
    if (i.paymentType === 'credit') s.credit += v; else s.cash += v;
  });
  emReadAll_('Sales_Returns').forEach(function(r) {
    if (r.status !== 'approved' || !finIn_(r.returnDate, o.from, o.to)) return;
    slot(r.customerId || '').returns += finNum_(r.totalGross);
  });
  const rows = Object.keys(by).map(function(k) {
    const s = by[k];
    return { customer: (customers[k] || {}).name || 'بدون عميل', cash: finRound_(s.cash), credit: finRound_(s.credit), returns: finRound_(s.returns), total: finRound_(s.cash + s.credit - s.returns) };
  }).sort(function(a, b) { return finCmp_(finNorm_(a.customer), finNorm_(b.customer)); });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  return cuResult_('إجمالي مبيعات العملاء', cuPeriod_(o), 'المبالغ شاملة الضريبة. الإجمالي = النقدية + الآجلة − المرتجع.', [finSection_('مبيعات العملاء', [
    finCol_('customer', 'العميل'), finCol_('cash', 'مبيعات نقدية', 'money'), finCol_('credit', 'مبيعات آجلة', 'money'), finCol_('returns', 'مرتجع مبيعات', 'money'), finCol_('total', 'الإجمالي', 'money')
  ], rows, [{ label: 'عدد العملاء', value: rows.length }, { label: 'نقدية', value: sum('cash') }, { label: 'آجلة', value: sum('credit') }, { label: 'مرتجع', value: sum('returns') }, { label: 'الإجمالي', value: sum('total') }])]);
}

/* ---------- 2) مبيعات العملاء: إجمالي بالأصناف ---------- */
function cuSalesItems_(o) {
  const cust = cuRequireCustomer_(o);
  const c = sqLoad_({ branchId: '', warehouseId: '', customerId: cust.id, inc: true }, o.from, o.to), a = sqItemAgg_(c);
  const rows = Object.keys(a).map(function(k) {
    const x = a[k];
    return { name: x.name, code: x.code, netQty: sqQ_(x.soldQty - x.retQty), netValue: finRound_(x.soldVal - x.retVal) };
  }).sort(function(p, q) { return finCmp_(String(p.code), String(q.code)); });
  const tq = rows.reduce(function(s, r) { return s + r.netQty; }, 0), tv = rows.reduce(function(s, r) { return s + r.netValue; }, 0);
  return cuResult_('إجمالي مبيعات العميل بالأصناف — ' + cust.name, cuPeriod_(o), 'الصافي بعد المرتجعات، والقيم شاملة الضريبة.', [finSection_('الأصناف', [
    finCol_('name', 'اسم الصنف'), finCol_('code', 'رقم الصنف'), finCol_('netQty', 'صافي كمية المبيعات', 'qty'), finCol_('netValue', 'صافي قيمة المبيعات', 'money')
  ], rows, [{ label: 'عدد الأصناف', value: rows.length }, { label: 'إجمالي الكمية', value: sqQ_(tq) }, { label: 'إجمالي القيمة', value: finRound_(tv) }])]);
}

/* ---------- 2) تفصيلي مبيعات الأصناف بالعملاء ---------- */
function cuItemCustomers_(o) {
  if (!o.itemId) throw new Error('اختر الصنف أولًا.');
  const item = emFindById_('Items', o.itemId);
  if (!item) throw new Error('الصنف غير موجود.');
  const c = sqLoad_({ branchId: '', warehouseId: '', customerId: '', inc: true }, o.from, o.to), rows = [];
  c.lines.forEach(function(l) {
    if (String(l.itemId) !== String(o.itemId)) return;
    const h = c.inv[l.salesInvoiceId];
    rows.push({ date: finD_(h.invoiceDate), invoiceNumber: h.invoiceNumber || '', returnNumber: '', qty: sqQ_(finNum_(l.quantity)), retQty: 0,
      value: finRound_(c.lineGross(l)), retValue: 0, customer: c.custName(h.customerId), sortKey: finD_(h.invoiceDate) + '|0|' + (h.invoiceNumber || '') });
  });
  c.retLines.forEach(function(l) {
    if (String(l.itemId) !== String(o.itemId)) return;
    const h = c.ret[l.salesReturnId];
    rows.push({ date: finD_(h.returnDate), invoiceNumber: h.salesInvoiceNumberSnapshot || '', returnNumber: h.returnNumber || '', qty: 0, retQty: sqQ_(finNum_(l.quantity)),
      value: 0, retValue: finRound_(c.lineGross(l)), customer: c.custName(h.customerId), sortKey: finD_(h.returnDate) + '|1|' + (h.returnNumber || '') });
  });
  rows.sort(function(a, b) { return finCmp_(a.sortKey, b.sortKey); });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  return cuResult_('تفصيلي مبيعات الصنف بالعملاء — ' + (item.name || ''), cuPeriod_(o), 'القيم شاملة الضريبة.', [finSection_('حركة الصنف', [
    finCol_('date', 'التاريخ'), finCol_('invoiceNumber', 'رقم فاتورة المبيعات'), finCol_('returnNumber', 'رقم إذن المرتجع'), finCol_('qty', 'كمية المبيعات', 'qty'),
    finCol_('retQty', 'كمية المرتجعات', 'qty'), finCol_('value', 'قيمة المبيعات', 'money'), finCol_('retValue', 'قيمة المرتجعات', 'money'), finCol_('customer', 'اسم العميل')
  ], rows, [{ label: 'كمية المبيعات', value: sqQ_(sum('qty')) }, { label: 'كمية المرتجعات', value: sqQ_(sum('retQty')) }, { label: 'قيمة المبيعات', value: sum('value') }, { label: 'قيمة المرتجعات', value: sum('retValue') }])]);
}

/* ---------- 3) كشف حساب عميل ---------- */
function cuStatement_(o) {
  const cust = cuRequireCustomer_(o), br = pqById_('Branches');
  const list = (cuMovements_()[cust.id] || []);
  let bal = 0, td = 0, tc = 0;
  const rows = [];
  list.forEach(function(m) { if (o.from && m.date < o.from) bal += m.debit - m.credit; });
  if (o.from && bal !== 0) rows.push({ date: o.from, branch: '', description: 'رصيد سابق', debit: bal > 0 ? finRound_(bal) : 0, credit: bal < 0 ? finRound_(-bal) : 0, balance: finRound_(bal) });
  list.forEach(function(m) {
    if (!finIn_(m.date, o.from, o.to)) return;
    bal += m.debit - m.credit; td += m.debit; tc += m.credit;
    rows.push({ date: m.date, branch: (br[m.branchId] || {}).name || '', description: m.description, debit: finRound_(m.debit), credit: finRound_(m.credit), balance: finRound_(bal) });
  });
  return cuResult_('كشف حساب عميل — ' + cust.name, cuPeriod_(o), 'مدين = ما استحق على العميل، دائن = ما سدده أو رُد له.', [finSection_('حركة الحساب', [
    finCol_('date', 'التاريخ'), finCol_('branch', 'الفرع'), finCol_('description', 'البيان'), finCol_('debit', 'مدين', 'money'), finCol_('credit', 'دائن', 'money'), finCol_('balance', 'الرصيد', 'money')
  ], rows, [{ label: 'إجمالي المدين', value: finRound_(td) }, { label: 'إجمالي الدائن', value: finRound_(tc) }, { label: 'الرصيد الختامي', value: finRound_(bal) }])]);
}

/* ---------- 4) الحسابات الخاملة: عملاء بلا حركة داخل الفترة ---------- */
function cuDormant_(o) {
  const customers = emReadAll_('Customers'), mv = cuMovements_(), bal = cuBalances_(), rows = [];
  customers.forEach(function(c) {
    if (c.active === 'off') return;
    const list = mv[c.id] || [];
    if (list.some(function(m) { return finIn_(m.date, o.from, o.to); })) return;
    const b = finRound_(bal[c.id] || 0);
    if (!list.length && b === 0) return;
    const last = list[list.length - 1];
    rows.push({ name: c.name || '', balance: b, lastDate: last ? last.date : '', debit: finRound_(list.reduce(function(s, m) { return s + m.debit; }, 0)),
      credit: finRound_(list.reduce(function(s, m) { return s + m.credit; }, 0)), movement: last ? last.description : '' });
  });
  rows.sort(function(a, b) { return finCmp_(a.lastDate, b.lastDate); });
  return cuResult_('بيان الحسابات الخاملة', cuPeriod_(o), 'عملاء ليس لهم أي حركة حساب خلال الفترة. المدين والدائن إجمالي كل الحركات.', [finSection_('الحسابات الخاملة', [
    finCol_('name', 'اسم العميل'), finCol_('balance', 'الرصيد الحالي', 'money'), finCol_('lastDate', 'تاريخ آخر حركة'), finCol_('debit', 'مدينة', 'money'), finCol_('credit', 'دائنة', 'money'), finCol_('movement', 'بيان الحركة')
  ], rows, [{ label: 'عدد الحسابات الخاملة', value: rows.length }, { label: 'إجمالي الأرصدة', value: finRound_(rows.reduce(function(s, r) { return s + r.balance; }, 0)) }])]);
}

/* ---------- 5) استعراض تسويات العملاء ---------- */
function cuSettlements_(o) {
  const customers = pqById_('Customers');
  const rows = emReadAll_('Adjustments').filter(function(a) {
    return a.adjustmentType === 'customer' && a.status === 'approved' && finIn_(a.createdAt, o.from, o.to) && (!o.customerId || String(a.partyId) === String(o.customerId));
  }).sort(function(a, b) { return finCmp_(finD_(a.createdAt), finD_(b.createdAt)); }).map(function(a) {
    const v = finNum_(a.amount);
    return { date: finD_(a.createdAt), customer: (customers[a.partyId] || {}).name || '', debit: v >= 0 ? finRound_(v) : 0, credit: v < 0 ? finRound_(-v) : 0, description: a.reason || '' };
  });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  return cuResult_('استعراض تسويات العملاء', cuPeriod_(o), 'التسويات المعتمدة فقط.', [finSection_('التسويات', [
    finCol_('date', 'التاريخ'), finCol_('customer', 'اسم العميل'), finCol_('debit', 'مدين', 'money'), finCol_('credit', 'دائن', 'money'), finCol_('description', 'البيان')
  ], rows, [{ label: 'عدد التسويات', value: rows.length }, { label: 'إجمالي المدين', value: sum('debit') }, { label: 'إجمالي الدائن', value: sum('credit') }])]);
}


/* ======================================================================
 * تقارير الموردين
 * نقطة الدخول الوحيدة: getSupplierReportFromUi(type, params, token)  (للمدير فقط)
 * الأنواع:
 *   detail      بيان الموردين التفصيلي    params: supplierId | name (بحث بجزء من الاسم)
 *   summary     بيان الموردين الإجمالي    params: —
 *   statement   كشف حساب مورد            params: supplierId, fromDate, toDate
 *   accounts    حسابات الموردين           params: supplierId | name, fromDate, toDate
 *   movement    حركة الموردين عن فترة     params: supplierId?, fromDate, toDate
 *   settlements استعراض تسويات الموردين   params: supplierId?, fromDate, toDate
 * الرصيد = مشتريات + أرصدة افتتاحية وتسويات دائنة − مرتجعات ومدفوعات (موجب = مستحق للمورد).
 * المحتسب: المستندات المعتمدة فقط.
 * ====================================================================== */

function getSupplierReportFromUi(type, params, token) {
  requireUiAdmin_(token);
  const p = params || {};
  const o = {
    type: String(type || ''),
    from: String(p.fromDate || '').slice(0, 10),
    to: String(p.toDate || '').slice(0, 10),
    supplierId: p.supplierId || '',
    name: String(p.name || '').trim()
  };
  switch (o.type) {
    case 'detail': return suDetail_(o);
    case 'summary': return suSummary_(o);
    case 'statement': return suStatement_(o);
    case 'accounts': return suAccounts_(o);
    case 'movement': return suMovement_(o);
    case 'settlements': return suSettlements_(o);
    default: throw new Error('نوع تقرير الموردين غير معروف: ' + type);
  }
}

function suRequireSupplier_(o) {
  const s = o.supplierId ? emFindById_('Suppliers', o.supplierId) : null;
  if (!s) throw new Error('اختر المورد أولًا.');
  return s;
}
/** الموردون المطابقون: المورد المختار، أو كل من يحوي اسمه نص البحث. */
function suMatch_(o) {
  if (o.supplierId) return [suRequireSupplier_(o)];
  const q = finNorm_(o.name);
  if (!q) throw new Error('اختر المورد أو اكتب جزءًا من اسمه.');
  const list = emReadAll_('Suppliers').filter(function(s) { return finNorm_(s.name).indexOf(q) >= 0; });
  if (!list.length) throw new Error('لا يوجد مورد بهذا الاسم.');
  return list;
}
function suBalances_() {
  const m = {};
  finPartyBalances_('supplier', '').forEach(function(b) { m[b.id] = b.balance; });
  return m;
}

/** حركات حساب كل مورد بنفس منطق finPartyBalances_. دائن = زيادة المستحق للمورد، مدين = نقصانه. */
function suMovements_() {
  const suppliers = emReadAll_('Suppliers'), ids = {}, byName = {}, mv = {};
  suppliers.forEach(function(s) { ids[s.id] = true; byName[finNorm_(s.name)] = s.id; });
  const add = function(id, m) { if (id && ids[id]) (mv[id] = mv[id] || []).push(m); };
  emReadAll_('Purchase_Invoices').forEach(function(i) {
    if (i.status !== 'approved') return;
    add(i.supplierId, { kind: 'purchase', date: finD_(i.purchaseDate), seq: 1, branchId: i.branchId || '', description: 'فاتورة شراء رقم ' + (i.purchaseNumber || ''), debit: 0, credit: finNum_(i.totalGross) });
  });
  emReadAll_('Purchase_Returns').forEach(function(r) {
    if (r.status !== 'approved') return;
    add(r.supplierId, { kind: 'return', date: finD_(r.returnDate), seq: 2, branchId: r.branchId || '', description: 'مرتجع مشتريات رقم ' + (r.returnNumber || ''), debit: finNum_(r.totalGross), credit: 0 });
  });
  emReadAll_('Cash_Payments').forEach(function(p) {
    if (p.status !== 'approved' || String(p.expenseCategory || '').trim()) return;
    let id = p.paidToId && ids[p.paidToId] ? p.paidToId : '';
    if (!id && (!p.paidToType || p.paidToType === 'supplier')) id = byName[finNorm_(p.paidToName)] || '';
    add(id, { kind: 'payment', date: finD_(p.paymentDate), seq: 3, branchId: '', description: 'إيصال دفع ' + (p.paymentNumber || '') + (p.description ? ' — ' + p.description : ''), debit: finNum_(p.amount), credit: 0 });
  });
  emReadAll_('Opening_Balances').forEach(function(b) {
    if (b.balanceType !== 'supplier') return;
    const a = finNum_(b.amount);
    add(b.partyId, { kind: 'opening', date: finD_(b.balanceDate), seq: 0, branchId: b.branchId || '', description: 'رصيد افتتاحي', debit: a < 0 ? -a : 0, credit: a >= 0 ? a : 0 });
  });
  emReadAll_('Adjustments').forEach(function(a) {
    if (a.adjustmentType !== 'supplier' || a.status !== 'approved') return;
    const v = finNum_(a.amount);
    add(a.partyId, { kind: 'adjustment', date: finD_(a.createdAt), seq: 4, branchId: a.branchId || '', description: 'تسوية' + (a.reason ? ' — ' + a.reason : ''), debit: v < 0 ? -v : 0, credit: v >= 0 ? v : 0 });
  });
  Object.keys(mv).forEach(function(k) {
    mv[k].sort(function(x, y) { return finCmp_(x.date + x.seq, y.date + y.seq); });
  });
  return mv;
}

function suCols_() {
  return [finCol_('code', 'رقم المورد'), finCol_('name', 'الاسم'), finCol_('address', 'العنوان'), finCol_('phone', 'التليفون'), finCol_('manager', 'اسم المدير المسئول')];
}
function suPartyRow_(s, emp, bal) {
  return { code: s.supplierCode || '', name: s.name || '', address: s.address || '', phone: s.phone || s.mobile || '', manager: (emp[s.managerEmployeeId] || {}).name || '', balance: finRound_(bal[s.id] || 0) };
}

/* ---------- أ) بيان الموردين التفصيلي ---------- */
function suDetail_(o) {
  const list = suMatch_(o), emp = pqById_('Employees'), bal = suBalances_();
  const rows = list.sort(function(a, b) { return finCmp_(finNorm_(a.name), finNorm_(b.name)); }).map(function(s) { return suPartyRow_(s, emp, bal); });
  const total = finRound_(rows.reduce(function(s, r) { return s + r.balance; }, 0));
  return cuResult_('بيان الموردين التفصيلي', '', 'المستحقات = ما هو مستحق للمورد حتى اليوم (موجب = مستحق للمورد).',
    [finSection_('بيانات المورد', suCols_().concat([finCol_('balance', 'مستحقات المورد', 'money')]), rows, [{ label: 'عدد الموردين', value: rows.length }, { label: 'إجمالي المستحقات', value: total }])]);
}

/* ---------- ب) بيان الموردين الإجمالي ---------- */
function suSummary_() {
  const emp = pqById_('Employees'), bal = suBalances_();
  const rows = emReadAll_('Suppliers').filter(function(s) { return s.active !== 'off'; })
    .sort(function(a, b) { return finCmp_(finNorm_(a.name), finNorm_(b.name)); }).map(function(s) { return suPartyRow_(s, emp, bal); });
  const total = finRound_(rows.reduce(function(s, r) { return s + r.balance; }, 0));
  return cuResult_('بيان الموردين الإجمالي', '', 'رصيد المورد = المشتريات + الأرصدة الافتتاحية والتسويات الدائنة − المرتجعات والمدفوعات.',
    [finSection_('قائمة الموردين', suCols_().concat([finCol_('balance', 'رصيد المورد', 'money')]), rows, [{ label: 'عدد الموردين', value: rows.length }, { label: 'إجمالي أرصدة الموردين', value: total }])]);
}

/* ---------- ت) كشف حساب مورد ---------- */
function suStatement_(o) {
  const sup = suRequireSupplier_(o), br = pqById_('Branches');
  const list = suMovements_()[sup.id] || [];
  let bal = 0, td = 0, tc = 0;
  const rows = [];
  list.forEach(function(m) { if (o.from && m.date < o.from) bal += m.credit - m.debit; });
  if (o.from && bal !== 0) rows.push({ date: o.from, branch: '', description: 'رصيد سابق', debit: bal < 0 ? finRound_(-bal) : 0, credit: bal > 0 ? finRound_(bal) : 0, balance: finRound_(bal) });
  list.forEach(function(m) {
    if (!finIn_(m.date, o.from, o.to)) return;
    bal += m.credit - m.debit; td += m.debit; tc += m.credit;
    rows.push({ date: m.date, branch: (br[m.branchId] || {}).name || '', description: m.description, debit: finRound_(m.debit), credit: finRound_(m.credit), balance: finRound_(bal) });
  });
  const all = suBalances_();
  const totalAll = finRound_(Object.keys(all).reduce(function(s, k) { return s + all[k]; }, 0));
  return cuResult_('كشف حساب مورد — ' + sup.name, cuPeriod_(o), 'دائن = ما استحق للمورد (مشتريات)، مدين = ما سُدد أو رُد له.',
    [finSection_('حركة الحساب', [finCol_('date', 'التاريخ'), finCol_('branch', 'الفرع'), finCol_('description', 'البيان'), finCol_('debit', 'مدين', 'money'), finCol_('credit', 'دائن', 'money'), finCol_('balance', 'الرصيد', 'money')],
      rows, [{ label: 'إجمالي المدين', value: finRound_(td) }, { label: 'إجمالي الدائن', value: finRound_(tc) }, { label: 'الرصيد الختامي', value: finRound_(bal) }, { label: 'إجمالي أرصدة الموردين', value: totalAll }])]);
}

/* ---------- ث) حسابات الموردين ---------- */
function suAccounts_(o) {
  const sups = suMatch_(o), sid = {};
  sups.forEach(function(s) { sid[s.id] = s; });
  const inv = {}, ret = {};
  emReadAll_('Purchase_Invoices').forEach(function(h) {
    if (h.status === 'approved' && sid[h.supplierId] && finIn_(h.purchaseDate, o.from, o.to)) inv[h.id] = h;
  });
  emReadAll_('Purchase_Returns').forEach(function(r) {
    if (r.status === 'approved' && sid[r.supplierId] && finIn_(r.returnDate, o.from, o.to)) ret[r.id] = r;
  });
  const items = pqById_('Items'), rows = [];
  emReadAll_('Purchase_Lines').forEach(function(l) {
    const h = inv[l.purchaseInvoiceId]; if (!h) return;
    const v = finRound_(finNum_(l.netAmountGross || l.grossAmount));
    rows.push({ date: finD_(h.purchaseDate), supplier: sid[h.supplierId].name || '', invoice: h.purchaseNumber || '', item: l.itemNameSnapshot || (items[l.itemId] || {}).name || '',
      qty: finNum_(l.quantity), retQty: 0, total: v, net: v, retTotal: 0, sort: finD_(h.purchaseDate) + '|0|' + (h.purchaseNumber || '') + '|' + (l.lineNo || '') });
  });
  emReadAll_('Purchase_Return_Lines').forEach(function(l) {
    const r = ret[l.purchaseReturnId]; if (!r) return;
    const v = finRound_(finNum_(l.netAmountGross || l.grossAmount));
    rows.push({ date: finD_(r.returnDate), supplier: sid[r.supplierId].name || '', invoice: r.purchaseNumberSnapshot || r.returnNumber || '', item: l.itemNameSnapshot || (items[l.itemId] || {}).name || '',
      qty: 0, retQty: finNum_(l.quantity), total: 0, net: -v, retTotal: v, sort: finD_(r.returnDate) + '|1|' + (r.returnNumber || '') + '|' + (l.lineNo || '') });
  });
  rows.sort(function(a, b) { return finCmp_(a.sort, b.sort); });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  const title = sups.length === 1 ? 'حسابات المورد — ' + sups[0].name : 'حسابات الموردين';
  return cuResult_(title, cuPeriod_(o), 'المبالغ شاملة الضريبة. صافي المشتريات = المشتريات − المرتجعات.', [finSection_('حركة المشتريات', [
    finCol_('date', 'التاريخ'), finCol_('supplier', 'المورد'), finCol_('invoice', 'رقم الفاتورة'), finCol_('item', 'اسم الصنف'), finCol_('qty', 'كمية المشتريات', 'qty'),
    finCol_('retQty', 'كمية المرتجعات', 'qty'), finCol_('total', 'إجمالي المشتريات', 'money'), finCol_('net', 'صافي المشتريات', 'money'), finCol_('retTotal', 'إجمالي المرتجعات', 'money')
  ], rows, [{ label: 'كمية المشتريات', value: sum('qty') }, { label: 'كمية المرتجعات', value: sum('retQty') }, { label: 'إجمالي المشتريات', value: sum('total') },
    { label: 'صافي المشتريات', value: sum('net') }, { label: 'إجمالي المرتجعات', value: sum('retTotal') }])]);
}

/* ---------- ج) حركة الموردين عن فترة ---------- */
function suMovement_(o) {
  const mv = suMovements_(), rows = [];
  emReadAll_('Suppliers').forEach(function(s) {
    if (o.supplierId && String(s.id) !== String(o.supplierId)) return;
    const r = { supplier: s.name || '', opening: 0, purchases: 0, returns: 0, payments: 0, debitAdj: 0, creditAdj: 0, closing: 0 };
    (mv[s.id] || []).forEach(function(m) {
      if (m.kind === 'opening' ? m.date <= (o.to || '9999-12-31') : o.from && m.date < o.from) { r.opening += m.credit - m.debit; return; }
      if (!finIn_(m.date, o.from, o.to)) return;
      if (m.kind === 'purchase') r.purchases += m.credit;
      else if (m.kind === 'return') r.returns += m.debit;
      else if (m.kind === 'payment') r.payments += m.debit;
      else if (m.kind === 'adjustment') { r.debitAdj += m.debit; r.creditAdj += m.credit; }
    });
    r.closing = r.opening + r.purchases - r.returns - r.payments + r.creditAdj - r.debitAdj;
    if (!o.supplierId && ['opening', 'purchases', 'returns', 'payments', 'debitAdj', 'creditAdj'].every(function(k) { return Math.abs(r[k]) < 0.005; })) return;
    Object.keys(r).forEach(function(k) { if (k !== 'supplier') r[k] = finRound_(r[k]); });
    rows.push(r);
  });
  rows.sort(function(a, b) { return finCmp_(finNorm_(a.supplier), finNorm_(b.supplier)); });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  return cuResult_('حركة الموردين عن فترة', cuPeriod_(o), 'رصيد آخر المدة = أول المدة + المشتريات − المرتجعات − المدفوعات + التسويات الدائنة − التسويات المدينة. تظهر الأرصدة الافتتاحية ضمن رصيد أول المدة.', [finSection_('حركة الموردين', [
    finCol_('supplier', 'المورد'), finCol_('opening', 'رصيد أول مدة', 'money'), finCol_('purchases', 'المشتريات', 'money'), finCol_('returns', 'مرتجع المشتريات', 'money'),
    finCol_('payments', 'مدفوعات', 'money'), finCol_('debitAdj', 'تسويات مدينة', 'money'), finCol_('creditAdj', 'تسويات دائنة', 'money'), finCol_('closing', 'رصيد آخر مدة', 'money')
  ], rows, [{ label: 'عدد الموردين', value: rows.length }, { label: 'رصيد أول المدة', value: sum('opening') }, { label: 'المشتريات', value: sum('purchases') }, { label: 'المرتجعات', value: sum('returns') },
    { label: 'المدفوعات', value: sum('payments') }, { label: 'رصيد آخر المدة', value: sum('closing') }])]);
}

/* ---------- ح) استعراض تسويات الموردين ---------- */
function suSettlements_(o) {
  const sup = pqById_('Suppliers');
  const rows = emReadAll_('Adjustments').filter(function(a) {
    return a.adjustmentType === 'supplier' && a.status === 'approved' && finIn_(a.createdAt, o.from, o.to) && (!o.supplierId || String(a.partyId) === String(o.supplierId));
  }).sort(function(a, b) { return finCmp_(finD_(a.createdAt), finD_(b.createdAt)); }).map(function(a) {
    const v = finNum_(a.amount);
    return { date: finD_(a.createdAt), supplier: (sup[a.partyId] || {}).name || '', debit: v < 0 ? finRound_(-v) : 0, credit: v >= 0 ? finRound_(v) : 0 };
  });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  return cuResult_('استعراض تسويات الموردين', cuPeriod_(o), 'التسويات المعتمدة فقط. التسوية الدائنة تزيد المستحق للمورد والمدينة تنقصه.', [finSection_('التسويات', [
    finCol_('date', 'التاريخ'), finCol_('supplier', 'المورد'), finCol_('debit', 'مدين', 'money'), finCol_('credit', 'دائن', 'money')
  ], rows, [{ label: 'عدد التسويات', value: rows.length }, { label: 'إجمالي المدين', value: sum('debit') }, { label: 'إجمالي الدائن', value: sum('credit') }])]);
}


/* ======================================================================
 * تقارير الموظفين والتعديلات والمندوبين وضرائب المبيعات
 * نقطة الدخول الوحيدة: getStaffReportFromUi(type, params, token)  (للمدير فقط)
 * الأنواع:
 *   emp_register      سجل الموظفين
 *   emp_statement     كشف حساب موظف              params: employeeId, fromDate, toDate
 *   emp_period        بيانات الموظفين عن فترة     params: employeeId, fromDate, toDate (مبيعات الموظف بالمجموعات والأصناف)
 *   audit             بيان التعديلات             params: fromDate, toDate
 *   commissions       بيان العمولات              params: employeeId?, fromDate, toDate
 *   sales_collections مبيعات وتحصيلات عن فترة     params: employeeId?, fromDate, toDate
 *   compare           مقارنة المبيعات والتحصيلات عن عام  params: year, dimension (all|seller|branch|group|region|customer)
 *   sales_tax         كشف حساب ضرائب المبيعات     params: fromDate, toDate
 * المحتسب: المستندات المعتمدة فقط. تحصيلات المندوب = مبيعات نقدية/شيكات لفواتيره + إيصالات عملائه
 * (يُنسب العميل إلى مندوب آخر فاتورة له).
 * ====================================================================== */

function getStaffReportFromUi(type, params, token) {
  requireUiAdmin_(token);
  const p = params || {};
  const o = {
    type: String(type || ''),
    from: String(p.fromDate || '').slice(0, 10),
    to: String(p.toDate || '').slice(0, 10),
    employeeId: p.employeeId || '',
    year: String(p.year || '').slice(0, 4) || String(emToday_()).slice(0, 4),
    dimension: String(p.dimension || 'all')
  };
  switch (o.type) {
    case 'emp_register': return stEmpRegister_(o);
    case 'emp_statement': return stEmpStatement_(o);
    case 'emp_period': return stEmpPeriod_(o);
    case 'audit': return stAudit_(o);
    case 'commissions': return stCommissions_(o);
    case 'sales_collections': return stSalesCollections_(o);
    case 'compare': return stCompare_(o);
    case 'sales_tax': return stSalesTax_(o);
    default: throw new Error('نوع التقرير غير معروف: ' + type);
  }
}

function stIsCheck_(t) { return /check|cheque|شيك/i.test(String(t || '')); }
function stRequireEmployee_(o) {
  const e = o.employeeId ? emFindById_('Employees', o.employeeId) : null;
  if (!e) throw new Error('اختر الموظف أولًا.');
  return e;
}
function stMonthOfDate_(d) { return Number(finD_(d).slice(5, 7)) || 0; }

/* ---------- 6) أ) سجل الموظفين ---------- */
function stEmpRegister_() {
  const br = pqById_('Branches');
  const rows = emReadAll_('Employees').filter(function(e) { return e.active !== 'off'; })
    .sort(function(a, b) { return finCmp_(String(a.employeeCode), String(b.employeeCode)); })
    .map(function(e) {
      return { code: e.employeeCode || '', branch: (br[e.branchId] || {}).name || '', name: e.name || '', birthDate: finD_(e.birthDate), marital: e.maritalStatus || '',
        job: e.jobTitle || '', address: e.address || '', phone: e.phone || '', mobile: e.mobile || '' };
    });
  return cuResult_('سجل الموظفين', '', '', [finSection_('قائمة الموظفين', [
    finCol_('code', 'رقم الموظف'), finCol_('branch', 'الفرع'), finCol_('name', 'الاسم'), finCol_('birthDate', 'تاريخ الميلاد'), finCol_('marital', 'الحالة الاجتماعية'),
    finCol_('job', 'الوظيفة'), finCol_('address', 'العنوان'), finCol_('phone', 'التليفون'), finCol_('mobile', 'الموبايل')
  ], rows, [{ label: 'عدد الموظفين', value: rows.length }])]);
}

/* ---------- 6) ب) كشف حساب موظف ---------- */
function stEmpStatement_(o) {
  const emp = stRequireEmployee_(o), list = [];
  emReadAll_('Payroll').forEach(function(r) {
    if (String(r.employeeId) !== String(emp.id) || r.status === 'cancelled') return;
    const d = finD_(r.createdAt) || (String(r.payrollMonth || '') + '-01');
    const date = String(r.payrollMonth || '').length >= 7 ? String(r.payrollMonth).slice(0, 7) + '-01' : d;
    list.push({ date: date, seq: 1, description: 'مرتب شهر ' + (r.payrollMonth || ''), debit: 0, credit: finNum_(r.grossSalary) });
    if (finNum_(r.totalDeductions)) list.push({ date: date, seq: 2, description: 'استقطاعات وسلف شهر ' + (r.payrollMonth || ''), debit: finNum_(r.totalDeductions), credit: 0 });
  });
  const nm = finNorm_(emp.name);
  emReadAll_('Cash_Payments').forEach(function(p) {
    if (p.status !== 'approved') return;
    const mine = (p.paidToId && String(p.paidToId) === String(emp.id)) || ((!p.paidToType || p.paidToType === 'employee') && !p.paidToId && finNorm_(p.paidToName) === nm);
    if (!mine) return;
    list.push({ date: finD_(p.paymentDate), seq: 3, description: 'إيصال صرف ' + (p.paymentNumber || '') + (p.description ? ' — ' + p.description : ''), debit: finNum_(p.amount), credit: 0 });
  });
  list.sort(function(a, b) { return finCmp_(a.date + a.seq, b.date + b.seq); });
  let bal = 0, td = 0, tc = 0;
  const rows = [];
  list.forEach(function(m) { if (o.from && m.date < o.from) bal += m.credit - m.debit; });
  if (o.from && bal !== 0) rows.push({ date: o.from, description: 'رصيد سابق', debit: bal < 0 ? finRound_(-bal) : 0, credit: bal > 0 ? finRound_(bal) : 0, balance: finRound_(bal) });
  list.forEach(function(m) {
    if (!finIn_(m.date, o.from, o.to)) return;
    bal += m.credit - m.debit; td += m.debit; tc += m.credit;
    rows.push({ date: m.date, description: m.description, debit: finRound_(m.debit), credit: finRound_(m.credit), balance: finRound_(bal) });
  });
  return cuResult_('كشف حساب موظف — ' + emp.name, cuPeriod_(o), 'دائن = مستحقات الموظف (المرتب)، مدين = ما استُقطع أو صُرف له. الرصيد الموجب مستحق للموظف.', [finSection_('حركة الحساب', [
    finCol_('date', 'التاريخ'), finCol_('description', 'البيان'), finCol_('debit', 'مدين', 'money'), finCol_('credit', 'دائن', 'money'), finCol_('balance', 'الرصيد', 'money')
  ], rows, [{ label: 'إجمالي المدين', value: finRound_(td) }, { label: 'إجمالي الدائن', value: finRound_(tc) }, { label: 'الرصيد الختامي', value: finRound_(bal) }])]);
}

/* ---------- 6) ت) بيانات الموظفين عن فترة: مبيعات الموظف بالمجموعات والأصناف ---------- */
function stEmpPeriod_(o) {
  const emp = stRequireEmployee_(o), items = pqById_('Items'), groups = pqById_('Groups');
  const inv = {};
  emReadAll_('Sales_Invoices').forEach(function(i) {
    if (i.status === 'approved' && String(i.sellerEmployeeId) === String(emp.id) && finIn_(i.invoiceDate, o.from, o.to)) inv[i.id] = i;
  });
  const retH = {};
  emReadAll_('Sales_Returns').forEach(function(r) {
    if (r.status === 'approved' && inv[r.salesInvoiceId] && finIn_(r.returnDate, o.from, o.to)) retH[r.id] = r;
  });
  const agg = {};
  const slot = function(itemId, nameSnap) {
    const it = items[itemId] || {}, g = groups[it.groupId] || {}, par = g.parentGroupId ? groups[g.parentGroupId] : null;
    const main = par ? par.name : (g.name || 'بدون مجموعة'), sub = par ? (g.name || '') : '';
    const k = main + '|' + sub + '|' + itemId;
    return agg[k] || (agg[k] = { main: main, sub: sub, item: nameSnap || it.name || '', qty: 0, value: 0 });
  };
  emReadAll_('Sales_Lines').forEach(function(l) {
    if (!inv[l.salesInvoiceId]) return;
    const s = slot(l.itemId, l.itemNameSnapshot); s.qty += finNum_(l.quantity); s.value += finNum_(l.netAmountGross || l.grossAmount);
  });
  emReadAll_('Sales_Return_Lines').forEach(function(l) {
    if (!retH[l.salesReturnId]) return;
    const s = slot(l.itemId, l.itemNameSnapshot); s.qty -= finNum_(l.quantity); s.value -= finNum_(l.netAmountGross || l.grossAmount);
  });
  const rows = Object.keys(agg).map(function(k) { const s = agg[k]; return { main: s.main, sub: s.sub, item: s.item, qty: sqQ_(s.qty), value: finRound_(s.value) }; })
    .sort(function(a, b) { return finCmp_(a.main + '|' + a.sub + '|' + a.item, b.main + '|' + b.sub + '|' + b.item); });
  const tq = rows.reduce(function(s, r) { return s + r.qty; }, 0), tv = rows.reduce(function(s, r) { return s + r.value; }, 0);
  return cuResult_('بيانات الموظف عن فترة — ' + emp.name, cuPeriod_(o), 'مبيعات الموظف (كبائع) صافي المرتجعات، والقيم شاملة الضريبة.', [finSection_('المجموعات والأصناف', [
    finCol_('main', 'المجموعة الرئيسية'), finCol_('sub', 'المجموعة الفرعية'), finCol_('item', 'الصنف'), finCol_('qty', 'صافي الكمية', 'qty'), finCol_('value', 'صافي القيمة', 'money')
  ], rows, [{ label: 'عدد الأصناف', value: rows.length }, { label: 'إجمالي الكمية', value: sqQ_(tq) }, { label: 'إجمالي القيمة', value: finRound_(tv) }])]);
}

/* ---------- 7) بيان التعديلات ---------- */
function stAudit_(o) {
  const ts = function(v) {
    if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    return String(v || '').replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '');
  };
  const rows = emReadAll_('Audit_Log').map(function(x) { return { t: ts(x.timestamp), x: x }; })
    .filter(function(a) { return finIn_(a.t.slice(0, 10), o.from, o.to); })
    .sort(function(a, b) { return finCmp_(a.t, b.t); })
    .map(function(a) {
      return { date: a.t.slice(0, 10), time: a.t.slice(11, 19), user: a.x.username || '',
        description: [a.x.action, a.x.entityType, a.x.entityNumber].filter(function(v) { return v; }).join(' ') + (a.x.reason ? ' — ' + a.x.reason : '') };
    });
  return cuResult_('بيان التعديلات', cuPeriod_(o), '', [finSection_('سجل التعديلات', [
    finCol_('date', 'التاريخ'), finCol_('time', 'الوقت'), finCol_('user', 'المستخدم'), finCol_('description', 'البيان')
  ], rows, [{ label: 'عدد التعديلات', value: rows.length }])]);
}

/* ---------- مساعدات المندوبين ---------- */
/** يربط كل عميل بمندوب آخر فاتورة معتمدة له. */
function stCustomerSeller_() {
  const last = {}, m = {};
  emReadAll_('Sales_Invoices').forEach(function(i) {
    if (i.status !== 'approved' || !i.customerId || !i.sellerEmployeeId) return;
    const k = finD_(i.invoiceDate) + '|' + (i.invoiceNumber || '');
    if (!last[i.customerId] || k > last[i.customerId]) { last[i.customerId] = k; m[i.customerId] = i.sellerEmployeeId; }
  });
  return m;
}
/** إيصالات العملاء المعتمدة مع تحديد العميل. */
function stCustomerReceipts_() {
  const cust = emReadAll_('Customers'), ids = {}, byName = {}, out = [];
  cust.forEach(function(c) { ids[c.id] = true; byName[finNorm_(c.name)] = c.id; });
  emReadAll_('Cash_Receipts').forEach(function(r) {
    if (r.status !== 'approved') return;
    let id = r.receivedFromId && ids[r.receivedFromId] ? r.receivedFromId : '';
    if (!id && (!r.receivedFromType || r.receivedFromType === 'customer')) id = byName[finNorm_(r.receivedFromName)] || '';
    if (id) out.push({ customerId: id, date: finD_(r.receiptDate), amount: finNum_(r.amount), check: stIsCheck_(r.cashType) });
  });
  return out;
}

/* ---------- 8) أ) بيان العمولات ---------- */
function stCommissions_(o) {
  const emps = pqById_('Employees'), by = {}, seller = stCustomerSeller_();
  const slot = function(date, rep) { const k = date + '|' + rep; return by[k] || (by[k] = { date: date, rep: rep, cash: 0, checks: 0 }); };
  emReadAll_('Sales_Invoices').forEach(function(i) {
    if (i.status !== 'approved' || !i.sellerEmployeeId || i.paymentType === 'credit' || !finIn_(i.invoiceDate, o.from, o.to)) return;
    if (o.employeeId && String(i.sellerEmployeeId) !== String(o.employeeId)) return;
    const s = slot(finD_(i.invoiceDate), i.sellerEmployeeId);
    if (stIsCheck_(i.paymentType)) s.checks += finNum_(i.totalGross); else s.cash += finNum_(i.totalGross);
  });
  stCustomerReceipts_().forEach(function(r) {
    const rep = seller[r.customerId];
    if (!rep || !finIn_(r.date, o.from, o.to) || (o.employeeId && String(rep) !== String(o.employeeId))) return;
    const s = slot(r.date, rep);
    if (r.check) s.checks += r.amount; else s.cash += r.amount;
  });
  const rows = Object.keys(by).map(function(k) {
    const s = by[k], e = emps[s.rep] || {}, rate = finNum_(e.commissionRate), total = s.cash + s.checks;
    return { date: s.date, rep: e.name || '', cash: finRound_(s.cash), checks: finRound_(s.checks), total: finRound_(total), rate: rate, commission: finRound_(total * rate / 100) };
  }).sort(function(a, b) { return finCmp_(a.date + a.rep, b.date + b.rep); });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  return cuResult_('بيان عمولات مندوبي البيع', cuPeriod_(o), 'العمولة = إجمالي التحصيلات × نسبة العمولة المسجلة للموظف.', [finSection_('العمولات', [
    finCol_('date', 'التاريخ'), finCol_('rep', 'المندوب'), finCol_('cash', 'التحصيلات النقدية', 'money'), finCol_('checks', 'الشيكات', 'money'),
    finCol_('total', 'إجمالي التحصيلات', 'money'), finCol_('rate', 'نسبة العمولة %', 'pct'), finCol_('commission', 'العمولة المستحقة', 'money')
  ], rows, [{ label: 'النقدية', value: sum('cash') }, { label: 'الشيكات', value: sum('checks') }, { label: 'إجمالي التحصيلات', value: sum('total') }, { label: 'إجمالي العمولة المستحقة', value: sum('commission') }])]);
}

/* ---------- 8) ب) مبيعات وتحصيلات عن فترة ---------- */
function stSalesCollections_(o) {
  const customers = pqById_('Customers'), mv = cuMovements_(), by = {};
  const slot = function(id) { return by[id] || (by[id] = { sales: 0, returns: 0, cash: 0, checks: 0 }); };
  const sel = {};
  emReadAll_('Sales_Invoices').forEach(function(i) {
    if (i.status !== 'approved' || !i.customerId || !finIn_(i.invoiceDate, o.from, o.to)) return;
    if (o.employeeId && String(i.sellerEmployeeId) !== String(o.employeeId)) return;
    sel[i.customerId] = true;
    const s = slot(i.customerId), v = finNum_(i.totalGross);
    s.sales += v;
    if (i.paymentType !== 'credit') { if (stIsCheck_(i.paymentType)) s.checks += v; else s.cash += v; }
  });
  const inv = pqById_('Sales_Invoices');
  emReadAll_('Sales_Returns').forEach(function(r) {
    if (r.status !== 'approved' || !finIn_(r.returnDate, o.from, o.to)) return;
    const cid = r.customerId || (inv[r.salesInvoiceId] || {}).customerId;
    if (cid && (!o.employeeId || sel[cid])) slot(cid).returns += finNum_(r.totalGross);
  });
  stCustomerReceipts_().forEach(function(r) {
    if (!finIn_(r.date, o.from, o.to) || (o.employeeId && !sel[r.customerId])) return;
    const s = slot(r.customerId);
    if (r.check) s.checks += r.amount; else s.cash += r.amount;
  });
  const rows = Object.keys(by).map(function(id) {
    const s = by[id];
    let opening = 0, closing = 0;
    (mv[id] || []).forEach(function(m) {
      const d = m.debit - m.credit;
      if (o.from && m.date < o.from) opening += d;
      if (!o.to || m.date <= o.to) closing += d;
    });
    return { customer: (customers[id] || {}).name || '', opening: finRound_(opening), sales: finRound_(s.sales), returns: finRound_(s.returns), cash: finRound_(s.cash), checks: finRound_(s.checks),
      collections: finRound_(s.cash + s.checks), closing: finRound_(closing) };
  }).sort(function(a, b) { return finCmp_(finNorm_(a.customer), finNorm_(b.customer)); });
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  const emp = o.employeeId ? (emFindById_('Employees', o.employeeId) || {}).name : '';
  return cuResult_('مبيعات وتحصيلات عن فترة' + (emp ? ' — ' + emp : ''), cuPeriod_(o), 'المبيعات النقدية تُحتسب تحصيلًا فوريًا. رصيد أول وآخر المدة من حساب العميل (آجل − مرتجع − إيصالات).', [finSection_('العملاء', [
    finCol_('customer', 'اسم العميل'), finCol_('opening', 'رصيد أول مدة', 'money'), finCol_('sales', 'المبيعات', 'money'), finCol_('returns', 'مرتجع المبيعات', 'money'),
    finCol_('cash', 'تحصيلات نقدية', 'money'), finCol_('checks', 'شيكات', 'money'), finCol_('collections', 'إجمالي التحصيلات', 'money'), finCol_('closing', 'رصيد آخر مدة', 'money')
  ], rows, [{ label: 'عدد العملاء', value: rows.length }, { label: 'المبيعات', value: sum('sales') }, { label: 'المرتجعات', value: sum('returns') }, { label: 'إجمالي التحصيلات', value: sum('collections') }, { label: 'رصيد آخر المدة', value: sum('closing') }])]);
}

/* ---------- 8) ت) مقارنة المبيعات والتحصيلات عن عام (رسم بياني) ---------- */
function stCompare_(o) {
  const y = o.year, dim = o.dimension;
  const customers = pqById_('Customers'), emps = pqById_('Employees'), br = pqById_('Branches'), groups = pqById_('Groups'), items = pqById_('Items');
  const seller = stCustomerSeller_(), inv = {}, by = {};
  const inYear = function(d) { return finD_(d).slice(0, 4) === y; };
  const slot = function(k, label) { return by[k] || (by[k] = { label: label, sales: 0, returns: 0, coll: 0 }); };
  const keyOfInvoice = function(i) {
    const c = customers[i.customerId] || {};
    switch (dim) {
      case 'seller': return [i.sellerEmployeeId || '', (emps[i.sellerEmployeeId] || {}).name || 'بدون مندوب'];
      case 'branch': return [i.branchId || '', (br[i.branchId] || {}).name || 'بدون إدارة'];
      case 'region': { const a = String(c.address || '').trim() || 'بدون منطقة'; return [a, a]; }
      case 'customer': return [i.customerId || '', c.name || 'بدون عميل'];
      default: return [String(stMonthOfDate_(i.invoiceDate)), ''];
    }
  };
  const groupKey = function(itemId) {
    const g = groups[(items[itemId] || {}).groupId] || {}, par = g.parentGroupId ? groups[g.parentGroupId] : null, n = par ? par.name : (g.name || 'بدون قسم');
    return [n, n];
  };
  emReadAll_('Sales_Invoices').forEach(function(i) {
    if (i.status !== 'approved' || !inYear(i.invoiceDate)) return;
    inv[i.id] = i;
    if (dim === 'group') return;
    const k = keyOfInvoice(i), s = slot(k[0], k[1]), v = finNum_(i.totalGross);
    s.sales += v;
    if (i.paymentType !== 'credit') s.coll += v;
  });
  if (dim === 'group') {
    emReadAll_('Sales_Lines').forEach(function(l) { if (inv[l.salesInvoiceId]) { const k = groupKey(l.itemId); slot(k[0], k[1]).sales += finNum_(l.netAmountGross || l.grossAmount); } });
  }
  emReadAll_('Sales_Returns').forEach(function(r) {
    const h = inv[r.salesInvoiceId];
    if (r.status !== 'approved' || !inYear(r.returnDate) || dim === 'group') return;
    const base = h || { customerId: r.customerId, branchId: r.branchId, sellerEmployeeId: '', invoiceDate: r.returnDate };
    const k = keyOfInvoice(Object.assign({}, base, { invoiceDate: r.returnDate }));
    slot(k[0], k[1]).returns += finNum_(r.totalGross);
  });
  if (dim === 'group') {
    const rh = {};
    emReadAll_('Sales_Returns').forEach(function(r) { if (r.status === 'approved' && inYear(r.returnDate)) rh[r.id] = r; });
    emReadAll_('Sales_Return_Lines').forEach(function(l) { if (rh[l.salesReturnId]) { const k = groupKey(l.itemId); slot(k[0], k[1]).returns += finNum_(l.netAmountGross || l.grossAmount); } });
  }
  if (dim !== 'branch' && dim !== 'group') {
    stCustomerReceipts_().forEach(function(r) {
      if (!inYear(r.date)) return;
      const c = customers[r.customerId] || {};
      let k;
      if (dim === 'seller') k = [seller[r.customerId] || '', (emps[seller[r.customerId]] || {}).name || 'بدون مندوب'];
      else if (dim === 'region') { const a = String(c.address || '').trim() || 'بدون منطقة'; k = [a, a]; }
      else if (dim === 'customer') k = [r.customerId, c.name || 'بدون عميل'];
      else k = [String(stMonthOfDate_(r.date)), ''];
      slot(k[0], k[1]).coll += r.amount;
    });
  }
  const names = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  let list;
  if (dim === 'all') {
    list = [];
    for (let m = 1; m <= 12; m++) { const s = by[String(m)] || { sales: 0, returns: 0, coll: 0 }; list.push({ label: names[m], sales: s.sales, returns: s.returns, coll: s.coll }); }
  } else {
    list = Object.keys(by).map(function(k) { return by[k]; }).sort(function(a, b) { return (b.sales - b.returns) - (a.sales - a.returns); });
  }
  const totalNet = list.reduce(function(s, r) { return s + (r.sales - r.returns); }, 0);
  const rows = list.map(function(r) {
    const net = r.sales - r.returns;
    return { label: r.label, sales: finRound_(r.sales), returns: finRound_(r.returns), net: finRound_(net), coll: finRound_(r.coll), share: totalNet ? finRound_(net / totalNet * 100) : 0 };
  });
  const dimName = { all: 'جميع المبيعات (بالشهور)', seller: 'مندوبو المبيعات', branch: 'الإدارات', group: 'الأقسام (المجموعات الرئيسية)', region: 'المناطق', customer: 'العملاء' }[dim] || dim;
  const sum = function(k) { return finRound_(rows.reduce(function(s, r) { return s + r[k]; }, 0)); };
  const chart = { title: 'المبيعات والتحصيلات — ' + dimName + ' — ' + y, labels: rows.map(function(r) { return r.label; }),
    series: [{ name: 'صافي المبيعات', values: rows.map(function(r) { return r.net; }) }].concat(dim === 'group' || dim === 'branch' ? [] : [{ name: 'التحصيلات', values: rows.map(function(r) { return r.coll; }) }]),
    shares: dim === 'all' ? null : rows.map(function(r) { return r.share; }) };
  const cols = [finCol_('label', dim === 'all' ? 'الشهر' : 'البيان'), finCol_('sales', 'المبيعات', 'money'), finCol_('returns', 'المرتجعات', 'money'), finCol_('net', 'صافي المبيعات', 'money')];
  if (dim !== 'group' && dim !== 'branch') cols.push(finCol_('coll', 'التحصيلات', 'money'));
  cols.push(finCol_('share', 'النسبة من الإجمالي %', 'pct'));
  return cuResult_('مقارنة المبيعات والتحصيلات عن عام ' + y, 'العام: ' + y, 'المقارنة حسب: ' + dimName + '. التحصيلات = مبيعات نقدية/شيكات + إيصالات العملاء' + (dim === 'group' || dim === 'branch' ? ' (غير متاحة لهذا التقسيم).' : '.'),
    [finSection_(dimName, cols, rows, [{ label: 'المبيعات', value: sum('sales') }, { label: 'المرتجعات', value: sum('returns') }, { label: 'صافي المبيعات', value: sum('net') }, { label: 'التحصيلات', value: sum('coll') }])], { chart: chart });
}

/* ---------- 9) كشف حساب ضرائب المبيعات ---------- */
function stSalesTax_(o) {
  const list = [];
  emReadAll_('Sales_Invoices').forEach(function(i) {
    if (i.status === 'approved') list.push({ date: finD_(i.invoiceDate), seq: 1, description: 'ضريبة فاتورة بيع رقم ' + (i.invoiceNumber || ''), debit: 0, credit: finNum_(i.vatAmount) });
  });
  emReadAll_('Sales_Returns').forEach(function(r) {
    if (r.status === 'approved') list.push({ date: finD_(r.returnDate), seq: 2, description: 'ضريبة مرتجع مبيعات رقم ' + (r.returnNumber || ''), debit: finNum_(r.vatAmount), credit: 0 });
  });
  list.sort(function(a, b) { return finCmp_(a.date + a.seq, b.date + b.seq); });
  let bal = 0, td = 0, tc = 0;
  const rows = [];
  list.forEach(function(m) { if (o.from && m.date < o.from) bal += m.credit - m.debit; });
  if (o.from && bal !== 0) rows.push({ date: o.from, description: 'رصيد سابق', debit: bal < 0 ? finRound_(-bal) : 0, credit: bal > 0 ? finRound_(bal) : 0, balance: finRound_(bal) });
  list.forEach(function(m) {
    if (!finIn_(m.date, o.from, o.to) || (!m.debit && !m.credit)) return;
    bal += m.credit - m.debit; td += m.debit; tc += m.credit;
    rows.push({ date: m.date, description: m.description, debit: finRound_(m.debit), credit: finRound_(m.credit), balance: finRound_(bal) });
  });
  return cuResult_('كشف حساب ضرائب المبيعات', cuPeriod_(o), 'دائن = ضريبة فواتير البيع (مستحقة للدولة)، مدين = ضريبة المرتجعات.', [finSection_('حركة الضريبة', [
    finCol_('date', 'التاريخ'), finCol_('description', 'البيان'), finCol_('debit', 'مدين', 'money'), finCol_('credit', 'دائن', 'money'), finCol_('balance', 'الرصيد', 'money')
  ], rows, [{ label: 'إجمالي المدين', value: finRound_(td) }, { label: 'إجمالي الدائن', value: finRound_(tc) }, { label: 'صافي الضريبة المستحقة', value: finRound_(bal) }])]);
}
