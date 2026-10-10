/**
 * Abracerabra sheet automations.
 *
 * Menu (onOpen): send a private logistics link, publish products, run setup.
 * Web app: doGet returns published products as JSON. doPost appends logistics
 * and looks up a lead ref. Both writes check Script Property APP_SHARED_SECRET.
 *
 * Logistics token = HMAC-SHA256(UTF-8 lead_id, UTF-8 LINK_SECRET), lowercase hex.
 * The same vectors are checked by tools/logistics-token-test.mjs.
 * In the Apps Script editor, run selfTestTokens to confirm this copy matches.
 */

var DEFAULT_SITE_URL = 'https://abracerabraweb.vercel.app';
var DEFAULT_EMAIL_SUBJECT = 'Abracerabra — delivery details for {{ref}}';
var DEFAULT_EMAIL_HTML = [
  '<div style="font-family:Arial,Helvetica,sans-serif;color:#212121;line-height:1.5;max-width:560px">',
  '<div style="background:#00558c;color:#ffffff;padding:16px 20px;font-size:20px;font-weight:700">Abracerabra</div>',
  '<div style="padding:20px;border:1px solid #d0d5d2;border-top:0">',
  '<p>Hello {{name}},</p>',
  '<p>Please share the delivery address and transport preference for <strong>{{ref}}</strong>. No payment is collected on this form.</p>',
  '<p><a href="{{link}}" style="background:#00558c;color:#ffffff;padding:12px 18px;text-decoration:none;display:inline-block">Open delivery form</a></p>',
  '<p style="font-size:13px;color:#616161">Or copy this private link:<br>{{link}}</p>',
  '</div></div>'
].join('');

var TRANSPORT_MODES = {
  Road: true,
  Rail: true,
  Air: true,
  Sea: true,
  Courier: true,
  'Customer pickup': true
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Abracerabra')
    .addItem('Send logistics link to selected lead', 'sendLogisticsLinkToSelectedLead')
    .addSeparator()
    .addItem('Publish selected products', 'publishSelectedProducts')
    .addItem('Publish all ready rows', 'publishAllReadyRows')
    .addSeparator()
    .addItem('Setup columns and settings', 'setup')
    .addToUi();
}

function setup() {
  var ss = spreadsheet_();
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());

  ensureSettings_(ss);
  var leads = ss.getSheetByName('Leads');
  var logistics = ss.getSheetByName('Logistics');
  var products = ss.getSheetByName('Products');
  if (!leads || !logistics || !products) {
    throw new Error('The Leads, Logistics, and Products tabs must already exist.');
  }

  ensureTrailingColumns_(leads, ['link_sent_at', 'link_sent_by']);
  ensureTrailingColumns_(logistics, [
    'country',
    'preferred_delivery_date',
    'contact_person',
    'contact_phone',
    'notes'
  ]);
  ensureTrailingColumns_(products, ['status', 'published_at', 'message']);
  applyStatusValidation_(products);
  boldHeader_(leads);
  boldHeader_(logistics);
  boldHeader_(products);

  var created = [];
  ['LINK_SECRET', 'APP_SHARED_SECRET'].forEach(function(key) {
    if (!props.getProperty(key)) {
      props.setProperty(key, randomSecret_());
      created.push(key);
    }
  });

  var linkSecret = props.getProperty('LINK_SECRET');
  var sharedSecret = props.getProperty('APP_SHARED_SECRET');
  Logger.log('LOGISTICS_LINK_SECRET=' + linkSecret);
  Logger.log('APP_SHARED_SECRET=' + sharedSecret);
  Logger.log('Newly generated: ' + (created.join(', ') || 'none, existing secrets kept'));

  var message = [
    'Columns and the Settings tab are ready.',
    '',
    'Copy these into Vercel. They are also in View → Logs.',
    '',
    'LOGISTICS_LINK_SECRET',
    linkSecret,
    '',
    'APP_SHARED_SECRET',
    sharedSecret,
    '',
    created.length
      ? 'New secrets were generated: ' + created.join(', ')
      : 'Existing secrets were kept.'
  ].join('\n');

  try {
    SpreadsheetApp.getUi().alert('Abracerabra setup', message, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(message);
  }
}

function sendLogisticsLinkToSelectedLead() {
  var ui = SpreadsheetApp.getUi();
  var ss = spreadsheet_();
  var sheet = ss.getActiveSheet();
  if (!sheet || sheet.getName() !== 'Leads') {
    ui.alert(
      'Select a row on the Leads tab first, then use Abracerabra → Send logistics link to selected lead.'
    );
    return;
  }

  var range = sheet.getActiveRange();
  if (!range || range.getRow() < 2) {
    ui.alert('Select the lead row below the header, then try again.');
    return;
  }
  if (range.getNumRows() !== 1) {
    ui.alert('Select a single lead row, then try again.');
    return;
  }

  ensureTrailingColumns_(sheet, ['link_sent_at', 'link_sent_by']);
  var map = headerMap_(sheet);
  ['lead_id', 'email', 'status'].forEach(function(name) {
    if (!col_(map, name)) throw new Error('Leads tab is missing the ' + name + ' column.');
  });

  var row = range.getRow();
  var values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var leadId = String(values[col_(map, 'lead_id') - 1] || '').trim();
  var email = String(values[col_(map, 'email') - 1] || '').trim();
  var name = col_(map, 'name') ? String(values[col_(map, 'name') - 1] || '').trim() : '';
  var ref = col_(map, 'ref') ? String(values[col_(map, 'ref') - 1] || '').trim() : '';

  if (!leadId) {
    ui.alert('This row has no lead_id.');
    return;
  }
  if (!email) {
    ui.alert('Cannot send', 'This lead has no email address. Add one in the email column, then try again.', ui.ButtonSet.OK);
    return;
  }

  var confirm = ui.alert(
    'Send logistics link',
    'Send the logistics link to ' + email + '?',
    ui.ButtonSet.OK_CANCEL
  );
  if (confirm !== ui.Button.OK) return;

  var secret = PropertiesService.getScriptProperties().getProperty('LINK_SECRET');
  if (!secret) {
    ui.alert('LINK_SECRET is missing. Run setup, then copy LOGISTICS_LINK_SECRET into Vercel.');
    return;
  }

  var settings = readSettings_();
  var token = hmacSha256Hex_(leadId, secret);
  var base = String(settings.site_base_url || DEFAULT_SITE_URL).replace(/\/+$/, '');
  var link = base + '/logistics?lead=' + encodeURIComponent(leadId) + '&t=' + token;
  var subject = fillTemplate_(settings.email_subject, {
    name: name,
    ref: ref || leadId,
    link: link,
    lead_id: leadId
  }) || ('Abracerabra — delivery details for ' + (ref || leadId));
  var html = fillTemplate_(settings.email_html, {
    name: escapeHtml_(name),
    ref: escapeHtml_(ref || leadId),
    link: link,
    lead_id: escapeHtml_(leadId)
  });
  if (html.indexOf(link) === -1) {
    html += '<p><a href="' + link + '">' + link + '</a></p>';
  }

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: html,
      body: 'Delivery details for ' + (ref || leadId) + '\n' + link,
      name: 'Abracerabra'
    });
  } catch (err) {
    ui.alert('Email was not sent', String(err.message || err), ui.ButtonSet.OK);
    return;
  }

  values[col_(map, 'status') - 1] = 'Logistics link sent';
  values[col_(map, 'link_sent_at') - 1] = new Date().toISOString();
  values[col_(map, 'link_sent_by') - 1] = activeUserEmail_();
  sheet.getRange(row, 1, 1, values.length).setValues([values]);
  ui.alert('Sent', 'Logistics link sent to ' + email + '.', ui.ButtonSet.OK);
}

function publishSelectedProducts() {
  var ui = SpreadsheetApp.getUi();
  var sheet = spreadsheet_().getActiveSheet();
  if (!sheet || sheet.getName() !== 'Products') {
    ui.alert('Open the Products tab and select the rows to publish.');
    return;
  }
  var range = sheet.getActiveRange();
  if (!range) {
    ui.alert('Select one or more product rows, then try again.');
    return;
  }
  var rows = [];
  var list = sheet.getActiveRangeList().getRanges();
  list.forEach(function(part) {
    for (var row = part.getRow(); row < part.getRow() + part.getNumRows(); row++) {
      if (row >= 2) rows.push(row);
    }
  });
  rows = uniqueSorted_(rows);
  if (!rows.length) {
    ui.alert('Select product rows below the header, then try again.');
    return;
  }
  var result = publishRows_(rows);
  ui.alert(
    'Publish selected products',
    result.published + ' published, ' + result.errors + ' with errors, ' + result.skipped + ' empty rows skipped.',
    ui.ButtonSet.OK
  );
}

function publishAllReadyRows() {
  var ui = SpreadsheetApp.getUi();
  var sheet = spreadsheet_().getSheetByName('Products');
  if (!sheet) {
    ui.alert('The Products tab is missing.');
    return;
  }
  ensureTrailingColumns_(sheet, ['status', 'published_at', 'message']);
  var map = headerMap_(sheet);
  var lastRow = sheet.getLastRow();
  var rows = [];
  if (lastRow >= 2) {
    var statusCol = col_(map, 'status');
    var nameCol = col_(map, 'name');
    var idCol = col_(map, 'id');
    var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    values.forEach(function(record, index) {
      var status = statusCol ? String(record[statusCol - 1] || '').trim().toLowerCase() : '';
      var name = nameCol ? String(record[nameCol - 1] || '').trim() : '';
      var id = idCol ? String(record[idCol - 1] || '').trim() : '';
      var ready = status === '' || status === 'draft' || status === 'error';
      if (ready && (name || id)) rows.push(index + 2);
    });
  }
  var result = publishRows_(rows);
  ui.alert(
    'Publish all ready rows',
    result.published + ' published, ' + result.errors + ' with errors, ' + result.skipped + ' empty rows skipped.',
    ui.ButtonSet.OK
  );
}

function selfTestTokens() {
  var vectors = [
    {
      secret: 'test-secret',
      lead_id: '11111111-2222-3333-4444-555555555555',
      token: '197852d5db0511671a896ce0244ebe0243dba0ce3ecbd38ad52e3a22e567ea6b'
    },
    {
      secret: 'abracerabra-link-secret',
      lead_id: '1fb11ac0-f6ac-4828-bd4f-7f88e95c6ee7',
      token: '68595a6032dccc7613fb34f52f0f2a1b1d4a7b91bc49539470dcc9b7a09dc510'
    },
    {
      secret: 'secret with spaces',
      lead_id: 'lead id with spaces',
      token: 'b0e542e0c622d3a72b3dbf505eb410e53fb2144f66fd7694a83a9025c8365edd'
    }
  ];
  vectors.forEach(function(vector) {
    var got = hmacSha256Hex_(vector.lead_id, vector.secret);
    if (got !== vector.token) {
      throw new Error('Token mismatch for ' + vector.lead_id + '. Got ' + got);
    }
  });
  Logger.log('token vectors ok (' + vectors.length + ')');
}

function doGet(e) {
  try {
    var action = e && e.parameter && e.parameter.action ? String(e.parameter.action) : 'products';
    if (action === 'lead') {
      return jsonOut_({ ok: false, error: 'use POST for lead lookup' });
    }
    return jsonOut_(productsPayload_());
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err.message || err), products: [] });
  }
}

function doPost(e) {
  var body = {};
  try {
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: 'invalid json' });
  }
  if (!secretOk_(e, body)) return jsonOut_({ ok: false, error: 'unauthorized' });
  var action = String((body && body.action) || (e && e.parameter && e.parameter.action) || 'logistics');
  try {
    if (action === 'lead') return jsonOut_(leadSummary_(body.lead_id || body.lead));
    if (action === 'logistics') return jsonOut_(saveLogistics_(body));
    return jsonOut_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err.message || err) });
  }
}

function productsPayload_() {
  var sheet = spreadsheet_().getSheetByName('Products');
  if (!sheet) return { ok: false, error: 'Products tab missing', products: [] };
  var map = headerMap_(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, products: [] };
  var rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var products = [];
  rows.forEach(function(row) {
    var status = col_(map, 'status') ? row[col_(map, 'status') - 1] : '';
    if (!isPublishedStatus_(status)) return;
    var id = textAt_(row, map, 'id');
    var name = textAt_(row, map, 'name');
    if (!id || !name) return;
    products.push({
      id: id,
      name: name,
      category: textAt_(row, map, 'category'),
      image: textAt_(row, map, 'image'),
      moq: number_(rawAt_(row, map, 'moq')),
      lotSize: number_(rawAt_(row, map, 'lotSize')),
      indicativePrice: number_(rawAt_(row, map, 'indicativePrice')),
      currency: textAt_(row, map, 'currency') || 'INR',
      unit: textAt_(row, map, 'unit'),
      specs: textAt_(row, map, 'specs'),
      status: String(status || '').trim()
    });
  });
  return { ok: true, products: products };
}

function leadSummary_(leadId) {
  var id = String(leadId || '').trim();
  if (!id) return { ok: false, error: 'missing lead_id' };
  var sheet = spreadsheet_().getSheetByName('Leads');
  if (!sheet) return { ok: true, lead_id: id, ref: '', name: '' };
  var map = headerMap_(sheet);
  var row = findRow_(sheet, col_(map, 'lead_id'), id);
  if (!row) return { ok: true, lead_id: id, ref: '', name: '' };
  var values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  return {
    ok: true,
    lead_id: id,
    ref: textAt_(values, map, 'ref'),
    name: textAt_(values, map, 'name')
  };
}

function saveLogistics_(body) {
  var leadId = String(body.lead_id || body.lead || '').trim();
  var token = String(body.token || body.t || '').trim().toLowerCase();
  var secret = PropertiesService.getScriptProperties().getProperty('LINK_SECRET') || '';
  if (!leadId || !token || !secret || !safeEqual_(hmacSha256Hex_(leadId, secret), token)) {
    return { ok: false, error: 'invalid token' };
  }
  var address = String(body.address || '').trim();
  var mode = String(body.mode_of_transport || '').trim();
  if (!address || !mode) return { ok: false, error: 'address and mode are required' };
  if (!TRANSPORT_MODES[mode]) return { ok: false, error: 'unknown mode' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = spreadsheet_();
    var sheet = ss.getSheetByName('Logistics');
    if (!sheet) {
      sheet = ss.insertSheet('Logistics');
      sheet.getRange(1, 1, 1, 6).setValues([[
        'lead_id', 'address', 'landmark', 'location', 'mode_of_transport', 'updated_at'
      ]]);
      sheet.setFrozenRows(1);
    }
    ensureTrailingColumns_(sheet, [
      'country',
      'preferred_delivery_date',
      'contact_person',
      'contact_phone',
      'notes'
    ]);
    var map = headerMap_(sheet);
    var fields = {
      lead_id: leadId,
      address: address,
      landmark: String(body.landmark || '').trim(),
      location: String(body.location || '').trim(),
      mode_of_transport: mode,
      updated_at: new Date().toISOString(),
      country: String(body.country || '').trim(),
      preferred_delivery_date: String(body.preferred_delivery_date || '').trim(),
      contact_person: String(body.contact_person || '').trim(),
      contact_phone: String(body.contact_phone || '').trim(),
      notes: String(body.notes || '').trim()
    };
    var row = findRow_(sheet, col_(map, 'lead_id'), leadId);
    var updated = row > 0;
    if (!updated) {
      var blank = [];
      for (var i = 0; i < sheet.getLastColumn(); i++) blank.push('');
      sheet.appendRow(blank);
      row = sheet.getLastRow();
    }
    writeFields_(sheet, row, map, fields);
    markLeadReceived_(ss, leadId);
    return { ok: true, lead_id: leadId, updated: updated, created: !updated };
  } finally {
    lock.releaseLock();
  }
}

function publishRows_(rows) {
  var sheet = spreadsheet_().getSheetByName('Products');
  if (!sheet) throw new Error('Products tab is missing. Run setup first.');
  ensureTrailingColumns_(sheet, ['status', 'published_at', 'message']);
  applyStatusValidation_(sheet);
  var map = headerMap_(sheet);
  ['name', 'category', 'image', 'moq', 'unit', 'indicativePrice', 'status', 'published_at', 'message'].forEach(function(name) {
    if (!col_(map, name) && name !== 'id') {
      if (!col_(map, name)) throw new Error('Products tab is missing the ' + name + ' column.');
    }
  });
  if (!col_(map, 'id')) throw new Error('Products tab is missing the id column.');

  var lastRow = Math.max(sheet.getLastRow(), 2);
  var lastCol = sheet.getLastColumn();
  var grid = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var existing = {};
  for (var r = 1; r < grid.length; r++) {
    var known = String(grid[r][col_(map, 'id') - 1] || '').trim();
    if (known) existing[known] = true;
  }

  var published = 0;
  var errors = 0;
  var skipped = 0;
  uniqueSorted_(rows).forEach(function(row) {
    if (row < 2 || row > grid.length) return;
    var record = grid[row - 1].slice();
    var name = textAt_(record, map, 'name');
    var id = textAt_(record, map, 'id');
    if (!name && !id) {
      skipped++;
      return;
    }

    var problems = [];
    if (!name) problems.push('Missing name');
    if (!textAt_(record, map, 'category')) problems.push('Missing category');
    if (!textAt_(record, map, 'unit')) problems.push('Missing unit');
    var moq = number_(rawAt_(record, map, 'moq'));
    if (moq === null || moq <= 0) problems.push('moq must be a number greater than 0');
    var price = number_(rawAt_(record, map, 'indicativePrice'));
    if (price === null || price < 0) problems.push('indicativePrice must be a number');
    var imageRaw = textAt_(record, map, 'image');
    var imageResult = imageRaw ? normalizeImage_(imageRaw) : { error: 'Missing image' };
    if (!imageRaw) problems.push('Missing image');
    else if (imageResult.error) problems.push(imageResult.error);

    if (!id && name) {
      id = makeId_(name, existing);
      existing[id] = true;
      record[col_(map, 'id') - 1] = id;
    }

    if (problems.length) {
      record[col_(map, 'status') - 1] = 'Error';
      record[col_(map, 'message') - 1] = problems.join('; ');
      errors++;
    } else {
      record[col_(map, 'id') - 1] = id;
      record[col_(map, 'image') - 1] = imageResult.url;
      record[col_(map, 'status') - 1] = 'Published';
      record[col_(map, 'published_at') - 1] = new Date().toISOString();
      record[col_(map, 'message') - 1] = imageResult.note || 'Published';
      published++;
    }
    sheet.getRange(row, 1, 1, lastCol).setValues([record]);
  });
  return { published: published, errors: errors, skipped: skipped };
}

function normalizeImage_(value) {
  var text = String(value || '').trim();
  var fileId = extractDriveId_(text);
  if (fileId) {
    var shared = shareDriveFile_(fileId);
    return {
      url: 'https://lh3.googleusercontent.com/d/' + fileId,
      note: shared
        ? 'Published. Drive file is viewable by anyone with the link.'
        : 'Published. Image link updated. Drive sharing was not changed.'
    };
  }
  if (/^https:\/\//i.test(text)) return { url: text, note: 'Published' };
  if (/^http:\/\//i.test(text)) return { error: 'Image must be an https URL or a Google Drive link' };
  return { error: 'Image must be an https URL, a Google Drive link, or a Drive file id' };
}

function extractDriveId_(value) {
  var text = String(value || '').trim();
  if (!text) return '';
  var isUrl = /^https?:\/\//i.test(text);
  if (isUrl && !/drive\.google\.com|docs\.google\.com|googleusercontent\.com/i.test(text)) return '';
  var patterns = [
    /\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
    /^([a-zA-Z0-9_-]{25,})$/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);
    if (match) return match[1];
  }
  return '';
}

function shareDriveFile_(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return true;
  } catch (err) {
    return false;
  }
}

function makeId_(name, existing) {
  var slug = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  if (!slug) slug = 'product';
  var id = '';
  do {
    id = slug + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6);
  } while (existing[id]);
  return id;
}

function markLeadReceived_(ss, leadId) {
  var sheet = ss.getSheetByName('Leads');
  if (!sheet) return;
  var map = headerMap_(sheet);
  var row = findRow_(sheet, col_(map, 'lead_id'), leadId);
  var statusCol = col_(map, 'status');
  if (!row || !statusCol) return;
  sheet.getRange(row, statusCol).setValue('Logistics received');
}

function ensureSettings_(ss) {
  var sheet = ss.getSheetByName('Settings');
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
    sheet.getRange(1, 1, 1, 3).setValues([['setting', 'value', 'help']]);
    sheet.setFrozenRows(1);
  }
  boldHeader_(sheet);
  var defaults = defaultSettings_();
  var help = {
    email_subject: 'Subject line. Placeholders: {{name}} {{ref}} {{link}} {{lead_id}}',
    email_html: 'HTML email. Same placeholders. The private link is inserted for {{link}}.',
    site_base_url: 'Site address with no slash at the end. The form link is added automatically.'
  };
  var present = {};
  var last = Math.max(sheet.getLastRow(), 1);
  var existing = sheet.getRange(1, 1, last, 2).getValues();
  existing.forEach(function(pair) {
    var key = String(pair[0] || '').trim();
    if (key && key !== 'setting') present[key] = true;
  });
  Object.keys(defaults).forEach(function(key) {
    if (present[key]) return;
    sheet.appendRow([key, defaults[key], help[key] || '']);
  });
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 520);
  sheet.setColumnWidth(3, 420);
  sheet.getRange(1, 2, sheet.getMaxRows(), 1).setWrap(true);
}

function defaultSettings_() {
  return {
    email_subject: DEFAULT_EMAIL_SUBJECT,
    email_html: DEFAULT_EMAIL_HTML,
    site_base_url: DEFAULT_SITE_URL
  };
}

function readSettings_() {
  var settings = defaultSettings_();
  var sheet = spreadsheet_().getSheetByName('Settings');
  if (!sheet || sheet.getLastRow() < 2) return settings;
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  rows.forEach(function(pair) {
    var key = String(pair[0] || '').trim();
    if (!key || key === 'setting') return;
    if (pair[1] !== '' && pair[1] != null) settings[key] = String(pair[1]);
  });
  return settings;
}

function ensureTrailingColumns_(sheet, names) {
  var lastContent = Math.max(sheet.getLastColumn(), 1);
  var width = Math.max(lastContent, 1);
  var headers = sheet.getRange(1, 1, 1, width).getValues()[0];
  var lastNamed = 0;
  var seen = {};
  headers.forEach(function(header, index) {
    var name = String(header || '').trim();
    if (!name) return;
    lastNamed = index + 1;
    seen[name.toLowerCase()] = true;
  });
  var missing = [];
  names.forEach(function(name) {
    if (!seen[name.toLowerCase()]) missing.push(name);
  });
  if (!missing.length) return headerMap_(sheet);
  var start = Math.max(lastNamed, lastContent) + 1;
  sheet.getRange(1, start, 1, missing.length).setValues([missing]);
  sheet.getRange(1, start, 1, missing.length).setFontWeight('bold');
  return headerMap_(sheet);
}

function applyStatusValidation_(sheet) {
  var map = headerMap_(sheet);
  var column = col_(map, 'status');
  if (!column) return;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Draft', 'Published', 'Error'], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
  sheet.getRange(1, column).setNote(
    'Leave blank or set Published to show the row on the website. Draft stays hidden. Error means the message column explains what to fix.'
  );
}

function headerMap_(sheet) {
  var last = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, last).getValues()[0];
  var map = {};
  headers.forEach(function(header, index) {
    var key = String(header || '').trim();
    if (!key) return;
    map[key.toLowerCase()] = index + 1;
  });
  return map;
}

function col_(map, name) {
  return map[String(name || '').toLowerCase()] || 0;
}

function textAt_(row, map, name) {
  var column = col_(map, name);
  if (!column) return '';
  return String(row[column - 1] || '').trim();
}

function rawAt_(row, map, name) {
  var column = col_(map, name);
  if (!column) return '';
  return row[column - 1];
}

function writeFields_(sheet, row, map, fields) {
  var last = sheet.getLastColumn();
  var values = sheet.getRange(row, 1, 1, last).getValues()[0];
  Object.keys(fields).forEach(function(name) {
    var column = col_(map, name);
    if (!column) return;
    values[column - 1] = fields[name];
  });
  sheet.getRange(row, 1, 1, last).setValues([values]);
}

function findRow_(sheet, column, value) {
  if (!column) return 0;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  var values = sheet.getRange(2, column, lastRow - 1, 1).getValues();
  var target = String(value);
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === target) return i + 2;
  }
  return 0;
}

function isPublishedStatus_(status) {
  var value = String(status || '').trim().toLowerCase();
  return value === '' || value === 'published';
}

function number_(value) {
  if (typeof value === 'number') return isFinite(value) ? value : null;
  var text = String(value == null ? '' : value).trim().replace(/,/g, '');
  if (!text) return null;
  var parsed = Number(text);
  return isFinite(parsed) ? parsed : null;
}

function spreadsheet_() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  return SpreadsheetApp.openById('1qJgkRp6fB21smNgHjshNrv4YQbwl8F7irx-UZiTSDnw');
}

function secretOk_(e, body) {
  var expected = PropertiesService.getScriptProperties().getProperty('APP_SHARED_SECRET') || '';
  if (!expected) return false;
  var provided = '';
  if (body && (body.app_shared_secret || body.secret)) {
    provided = String(body.app_shared_secret || body.secret);
  } else if (e && e.parameter && (e.parameter.app_shared_secret || e.parameter.secret)) {
    provided = String(e.parameter.app_shared_secret || e.parameter.secret);
  }
  return safeEqual_(expected, provided);
}

function hmacSha256Hex_(message, secret) {
  var bytes = Utilities.computeHmacSha256Signature(String(message), String(secret));
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var value = bytes[i];
    if (value < 0) value += 256;
    var part = value.toString(16);
    hex += part.length === 1 ? '0' + part : part;
  }
  return hex;
}

function safeEqual_(left, right) {
  var a = String(left || '');
  var b = String(right || '');
  if (!a || !b || a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function fillTemplate_(template, vars) {
  return String(template || '').replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, function(_match, key) {
    var value = vars[String(key).toLowerCase()];
    return value == null ? '' : String(value);
  });
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function randomSecret_() {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid() + '|' + Utilities.getUuid() + '|' + new Date().getTime()
  );
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, '');
}

function activeUserEmail_() {
  try {
    var active = Session.getActiveUser().getEmail();
    if (active) return active;
  } catch (err) {}
  try {
    return Session.getEffectiveUser().getEmail() || '';
  } catch (err2) {
    return '';
  }
}

function boldHeader_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) return;
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function uniqueSorted_(rows) {
  var seen = {};
  rows.forEach(function(row) { seen[row] = true; });
  return Object.keys(seen).map(function(row) { return Number(row); }).sort(function(a, b) {
    return a - b;
  });
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
