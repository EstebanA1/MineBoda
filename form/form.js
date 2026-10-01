(() => {
  const form = document.querySelector("#rsvp-form");
  if (!form) return;

  const endpoint = String(window.RSVP_CONFIG?.endpoint || "").trim();
  const submitButton = form.querySelector("[data-submit]");
  const status = form.querySelector("[data-form-status]");
  const partyFields = form.querySelector("[data-party-fields]");
  const partySize = form.querySelector("#party-size");
  const allergies = form.querySelector("#allergies");
  const companionField = form.querySelector("[data-companion-field]");
  const companionName = form.querySelector("#companion-name");
  const responseFrame = document.querySelector(".rsvp-form__response-frame");
  const successPanel = document.querySelector("[data-form-success]");
  const successCopy = document.querySelector("[data-success-copy]");
  let waitingForResponse = false;

  function selectedAttendance() {
    return form.querySelector('input[name="attendance"]:checked')?.value || "";
  }

  function updateConditionalFields() {
    const isAttending = selectedAttendance() === "yes";
    partyFields.classList.toggle("is-disabled", !isAttending);
    partyFields.setAttribute("aria-disabled", String(!isAttending));
    partySize.disabled = !isAttending;
    allergies.disabled = !isAttending;

    const hasCompanion = isAttending && partySize.value === "2";
    companionField.classList.toggle("is-disabled", !hasCompanion);
    companionField.setAttribute("aria-disabled", String(!hasCompanion));
    companionName.disabled = !hasCompanion;
    companionName.required = hasCompanion;
  }

  form.addEventListener("change", updateConditionalFields);
  updateConditionalFields();

  if (!endpoint) {
    submitButton.disabled = true;
    status.textContent = "El formulario está listo; falta conectarlo con Google Sheets.";
    return;
  }

  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || !url.pathname.endsWith("/exec")) throw new Error("URL no válida");
    form.action = url.href;
  } catch {
    submitButton.disabled = true;
    status.textContent = "La dirección de envío aún no está configurada correctamente.";
    return;
  }

  form.addEventListener("submit", (event) => {
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }
    if (waitingForResponse) {
      event.preventDefault();
      return;
    }

    waitingForResponse = true;
    submitButton.disabled = true;
    status.textContent = "Enviando tu respuesta…";
    window.setTimeout(() => {
      if (!waitingForResponse) return;
      waitingForResponse = false;
      submitButton.disabled = false;
      status.textContent = "La respuesta está tardando más de lo esperado. Revisa tu conexión e inténtalo de nuevo.";
    }, 30000);
  });

  window.addEventListener("message", (event) => {
    const trustedGoogleOrigin = event.origin === "https://script.google.com" || event.origin.endsWith(".googleusercontent.com");
    if (event.source !== responseFrame.contentWindow || !trustedGoogleOrigin || event.data?.type !== "mineboda-rsvp-result") return;

    waitingForResponse = false;
    submitButton.disabled = false;

    if (event.data.ok) {
      successCopy.textContent = selectedAttendance() === "yes"
        ? "Recibimos tu confirmación. ¡Nos vemos pronto!"
        : "Gracias por avisarnos. Te mandamos un abrazo.";
      form.hidden = true;
      successPanel.hidden = false;
      successPanel.querySelector("h2").focus();
      return;
    }

    status.textContent = event.data.code === "duplicate"
      ? "Ya recibimos una respuesta con ese nombre. Si necesitas corregirla, avísanos directamente."
      : event.data.code === "invalid"
        ? "Revisa los datos ingresados e inténtalo nuevamente."
        : "No se pudo guardar la respuesta. Inténtalo nuevamente en un momento.";
  });
})();
