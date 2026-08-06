const { Resend } = require("resend");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return String(value || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const body = req.body || {};
  const { name, email, phone, company, product, site, quantity, message, website } = body;

  // Honeypot: a hidden field real visitors never fill in. If it's set, pretend success.
  if (website) {
    return res.status(200).json({ ok: true });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: "Name, email and message are required." });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured.");
    return res.status(500).json({ ok: false, error: "Server email is not configured yet." });
  }

  const resend = new Resend(apiKey);
  const toEmail = process.env.ENQUIRY_TO_EMAIL || "sales@bppsales.com";
  const fromEmail = process.env.ENQUIRY_FROM_EMAIL || "BPP Website <enquiries@bppsales.com>";

  const subject = `Budgetary enquiry — ${product || "BPP products"}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "-"}`,
    `Company: ${company || "-"}`,
    `Product interest: ${product || "-"}`,
    `Site location & wind zone: ${site || "-"}`,
    `Height & quantity: ${quantity || "-"}`,
    "",
    message
  ].join("\n");

  const html = `
    <h2 style="font-family:sans-serif;">New budgetary enquiry</h2>
    <p style="font-family:sans-serif; line-height:1.6;">
      <b>Name:</b> ${escapeHtml(name)}<br>
      <b>Email:</b> ${escapeHtml(email)}<br>
      <b>Phone:</b> ${escapeHtml(phone)}<br>
      <b>Company:</b> ${escapeHtml(company)}<br>
      <b>Product interest:</b> ${escapeHtml(product)}<br>
      <b>Site location &amp; wind zone:</b> ${escapeHtml(site)}<br>
      <b>Height &amp; quantity:</b> ${escapeHtml(quantity)}
    </p>
    <p style="font-family:sans-serif; line-height:1.6;">
      <b>Message:</b><br>${escapeHtml(message).replace(/\n/g, "<br>")}
    </p>
  `;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      reply_to: email,
      subject,
      text,
      html
    });

    if (result.error) {
      console.error("Resend API error:", result.error);
      return res.status(502).json({ ok: false, error: result.error.message || "Could not send your enquiry." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Resend send failed:", err);
    return res.status(502).json({ ok: false, error: "Could not send your enquiry. Please email us directly." });
  }
};
