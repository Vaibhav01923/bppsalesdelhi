// BPP site behaviour: mobile nav toggle, subnav active-state, contact form mailto fallback.

document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      toggle.classList.toggle("is-active", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        toggle.classList.remove("is-active");
        document.body.style.overflow = "";
      });
    });
  }

  // Highlight active subnav link on product pages while scrolling.
  var subnavLinks = document.querySelectorAll(".subnav a");
  if (subnavLinks.length) {
    var sections = Array.prototype.map.call(subnavLinks, function (link) {
      return document.querySelector(link.getAttribute("href"));
    });

    var setActive = function () {
      var pos = window.scrollY + 170;
      var activeIndex = 0;
      sections.forEach(function (sec, i) {
        if (sec && sec.offsetTop <= pos) activeIndex = i;
      });
      subnavLinks.forEach(function (link, i) {
        link.classList.toggle("is-active", i === activeIndex);
      });
    };
    window.addEventListener("scroll", setActive, { passive: true });
    setActive();
  }

  // Contact form: send via the /api/send-enquiry serverless function, falling back to mailto: if it fails.
  var form = document.querySelector("#enquiry-form");
  if (form) {
    var statusEl = document.querySelector("#form-status");
    var submitBtn = form.querySelector("button[type=submit]");
    var defaultStatus = statusEl ? statusEl.textContent : "";

    var setStatus = function (text, isError) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.style.color = isError ? "var(--gold-dark)" : "";
    };

    var mailtoFallback = function (get) {
      var lines = [
        "Name: " + get("name"),
        "Email: " + get("email"),
        "Company: " + get("company"),
        "Phone: " + get("phone"),
        "Product interest: " + get("product"),
        "Site location & wind zone: " + get("site"),
        "Height & quantity: " + get("quantity"),
        "",
        get("message")
      ];
      var subject = "Budgetary enquiry — " + (get("product") || "BPP products");
      var body = lines.join("\n");
      return "mailto:sales@bppsales.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var get = function (k) { return (data.get(k) || "").toString().trim(); };
      var payload = {
        name: get("name"),
        email: get("email"),
        company: get("company"),
        phone: get("phone"),
        product: get("product"),
        site: get("site"),
        quantity: get("quantity"),
        message: get("message"),
        website: get("website") // honeypot, should stay empty
      };

      if (submitBtn) submitBtn.disabled = true;
      setStatus("Sending your enquiry…", false);

      fetch("/api/send-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
        .then(function (result) {
          if (result.ok && result.json && result.json.ok) {
            form.reset();
            setStatus("Thank you — your enquiry has been sent. We revert with a GA drawing and foundation design, usually within one working day.", false);
          } else {
            var msg = (result.json && result.json.error) || "Could not send your enquiry.";
            setStatus(msg + " You can also email us directly:", true);
            var link = document.createElement("a");
            link.href = mailtoFallback(get);
            link.textContent = " sales@bppsales.com";
            statusEl.appendChild(link);
          }
        })
        .catch(function () {
          setStatus("Could not reach the server. Opening your email client instead…", true);
          window.location.href = mailtoFallback(get);
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  // Footer year.
  var yearEl = document.querySelector("#current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
