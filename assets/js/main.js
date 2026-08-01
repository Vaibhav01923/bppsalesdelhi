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

  // Contact form: build a mailto: link from the entered fields (no backend on this static site).
  var form = document.querySelector("#enquiry-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var get = function (k) { return (data.get(k) || "").toString().trim(); };

      var lines = [
        "Name: " + get("name"),
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
      var mailto = "mailto:sales@bppsales.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      window.location.href = mailto;
    });
  }

  // Footer year.
  var yearEl = document.querySelector("#current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
