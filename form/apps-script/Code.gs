const RESPONSE_SHEET_NAME = "RSVP";
const RESPONSE_HEADERS = [
  "Fecha de envío",
  "Nombre y apellido",
  "Asistencia",
  "Personas",
  "Acompañante",
  "Alergias o restricciones",
  "Comentario"
];

function setupSheet() {
  getResponseSheet_();
}

function doPost(event) {
  const params = event && event.parameter ? event.parameter : {};
  const requestId = /^[a-f0-9]{32}$/.test(String(params.requestId || "")) ? String(params.requestId) : "";

  // Bots que llenan el campo trampa reciben una respuesta genérica sin escribir en la hoja.
  if (String(params.website || "").trim()) return resultPage_({ ok: true, code: "saved" }, requestId);

  const response = validateResponse_(params);
  if (!response) return resultPage_({ ok: false, code: "invalid" }, requestId);

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getResponseSheet_();
    const nameKey = normalizeName_(response.guestName);
    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      const existingNames = sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues();
      const isDuplicate = existingNames.some(([name]) => normalizeName_(name) === nameKey);
      if (isDuplicate) return resultPage_({ ok: false, code: "duplicate" }, requestId);
    }

    sheet.appendRow([
      new Date(),
      safeCell_(response.guestName),
      response.attendance === "yes" ? "Sí" : "No",
      response.attendance === "yes" ? response.partySize : 0,
      safeCell_(response.companionName),
      safeCell_(response.allergies),
      safeCell_(response.comments)
    ]);
    return resultPage_({ ok: true, code: "saved" }, requestId);
  } catch (error) {
    console.error(error);
    return resultPage_({ ok: false, code: "error" }, requestId);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function validateResponse_(params) {
  const guestName = cleanText_(params.guestName, 120);
  const attendance = String(params.attendance || "");
  const partySize = attendance === "yes" ? Number(params.partySize) : 0;
  const companionName = attendance === "yes" && partySize === 2 ? cleanText_(params.companionName, 120) : "";
  const allergies = attendance === "yes" ? cleanText_(params.allergies, 500) : "";
  const comments = cleanText_(params.comments, 1000);

  if (guestName.length < 3 || !["yes", "no"].includes(attendance)) return null;
  if (attendance === "yes" && ![1, 2].includes(partySize)) return null;
  if (attendance === "yes" && partySize === 2 && companionName.length < 3) return null;
  if (companionName && normalizeName_(companionName) === normalizeName_(guestName)) return null;

  return { guestName, attendance, partySize, companionName, allergies, comments };
}

function getResponseSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("Configura la propiedad de script SPREADSHEET_ID.");

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheetByName(RESPONSE_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(RESPONSE_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, RESPONSE_HEADERS.length).setValues([RESPONSE_HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, RESPONSE_HEADERS.length).setFontWeight("bold");
    sheet.autoResizeColumns(1, RESPONSE_HEADERS.length);
  }
  return sheet;
}

function cleanText_(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

function normalizeName_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es-CL");
}

function safeCell_(value) {
  const text = String(value || "");
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function resultPage_(result, requestId) {
  const message = JSON.stringify({ type: "mineboda-rsvp-result", ...result, requestId })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  const html = "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" +
    "<script>window.top.postMessage(" + message + ", '*');</script></body></html>";

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
