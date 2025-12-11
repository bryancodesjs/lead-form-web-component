class LeadForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.translations = {
      en: {
        title: "Get in Touch",
        name: "Name",
        email: "Email",
        phone: "Phone",
        message: "Message",
        submit: "Submit",
        errorRequired: "This field is required.",
      },
      es: {
        title: "Contáctanos",
        name: "Nombre",
        email: "Correo electrónico",
        phone: "Teléfono",
        message: "Mensaje",
        submit: "Enviar",
        errorRequired: "Este campo es obligatorio.",
      },
    };
  }

  async connectedCallback() {
    const lang = this.getAttribute("lang") || "en";
    const successUrl = this.getAttribute("success-url") || "/";
    const errorUrl = this.getAttribute("error-url") || "/error";
    const customLabels = JSON.parse(this.getAttribute("custom-labels") || "{}");

    const labels = { ...this.translations[lang], ...customLabels };

    // Collect UTM parameters
    const urlParams = new URLSearchParams(window.location.search);
    const utmData = {
      utmCampaign: urlParams.get("utm_campaign"),
      utmSource: urlParams.get("utm_source"),
      utmMedium: urlParams.get("utm_medium"),
      utmContent: urlParams.get("utm_content"),
      utmTerm: urlParams.get("utm_term"),
    };

    // Fetch IP Address
    let ipAddress = null;
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const json = await res.json();
      ipAddress = json.ip;
    } catch (e) {
      console.warn("IP lookup failed", e);
    }

    // Referrer + User Agent
    const httpReferrer = document.referrer || null;
    const httpUserAgent = navigator.userAgent || null;

    this.shadowRoot.innerHTML = `
      <style>
        .form-container {
          font-family: Arial, sans-serif;
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 6px;
          max-width: 400px;
        }
        label { display: block; margin: 10px 0 5px; font-weight: 600; }
        input, textarea {
          width: 100%; padding: 10px; border: 1px solid #ccc;
          border-radius: 4px; margin-bottom: 10px;
          box-sizing: border-box;
        }
        button {
          background: #007bff; color: white; border: none;
          padding: 10px 18px; cursor: pointer; border-radius: 4px;
        }
      </style>

      <div class="form-container">
        <h3>${labels.title}</h3>
        <form id="lead-form">
          <label>${labels.name}</label>
          <input name="name" required placeholder="${labels.name}" />

          <label>${labels.email}</label>
          <input name="email" type="email" required placeholder="${labels.email}" />

          <label>${labels.phone}</label>
          <input name="phone" required placeholder="${labels.phone}" />

          <label>${labels.message}</label>
          <textarea name="message" required placeholder="${labels.message}"></textarea>

          <button type="submit">${labels.submit}</button>
        </form>
      </div>
    `;

    const form = this.shadowRoot.querySelector("#lead-form");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      // Append system-tracked fields
      for (const [key, value] of Object.entries(utmData)) {
        if (value !== null) formData.append(key, value);
      }

      formData.append("ipAddress", ipAddress ?? "");
      formData.append("httpReferrer", httpReferrer ?? "");
      formData.append("httpUserAgent", httpUserAgent ?? "");

      try {
        const response = await fetch("https://api.yoursite.com/lead", {
          method: "POST",
          body: formData,
        });

        window.location.href = response.ok ? successUrl : errorUrl;
      } catch (err) {
        window.location.href = errorUrl;
      }
    });
  }
}

customElements.define("lead-form", LeadForm);

// Auto-mount into #form-wrapper
(function () {
  const script = document.currentScript;
  const lang = script.dataset.lang;
  const successUrl = script.dataset.successUrl;
  const errorUrl = script.dataset.errorUrl;
  const customLabels = script.dataset.customLabels;

  const wrapper = document.getElementById("form-wrapper");
  if (wrapper) {
    wrapper.innerHTML = `
      <lead-form
        lang="${lang || "en"}"
        success-url="${successUrl || "/"}"
        error-url="${errorUrl || "/error"}"
        ${customLabels ? `custom-labels='${customLabels}'` : ""}
      ></lead-form>
    `;
  }
})();
