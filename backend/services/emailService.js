import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]
  );
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function emailLayout(content) {
  return `
    <div style="background:#f5f7fa;padding:32px 12px;
                font-family:Arial,sans-serif;color:#14213d;">
      <div style="max-width:620px;margin:auto;background:white;
                  border:1px solid #e2e8f0;border-radius:12px;
                  overflow:hidden;">
        <div style="background:#14213d;color:white;
                    padding:24px;text-align:center;">
          <h1 style="margin:0;font-size:26px;">BOOKMARKS</h1>
        </div>

        <div style="padding:28px;">
          ${content}
        </div>

        <div style="background:#f8fafc;padding:18px;
                    text-align:center;color:#64748b;
                    font-size:12px;">
          BookMarks | Automated order notification
        </div>
      </div>
    </div>
  `;
}

export async function sendOrderConfirmation(order) {
  const items = order.items || [];

  const rows = items.map((item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #eee;">
        ${escapeHtml(item.book_title)}
      </td>
      <td style="padding:12px;text-align:center;
                 border-bottom:1px solid #eee;">
        ${escapeHtml(item.quantity)}
      </td>
      <td style="padding:12px;text-align:right;
                 border-bottom:1px solid #eee;">
        ${money(Number(item.unit_price) * Number(item.quantity))}
      </td>
    </tr>
  `).join("");

  const html = emailLayout(`
    <h2>Thank you for your order!</h2>

    <p>Hello ${escapeHtml(order.recipient_name)},</p>

    <p>We've received your order and will notify you
       as it progresses.</p>

    <h3>Order #${escapeHtml(order.order_id)}</h3>

    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:12px;text-align:left;">Book</th>
          <th style="padding:12px;">Qty</th>
          <th style="padding:12px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <p>Subtotal: ${money(order.subtotal)}</p>
    <p>Delivery: ${money(order.delivery_fee)}</p>

    <h3>Total: ${money(order.total)}</h3>

    <p><strong>Payment:</strong> Cash on Delivery</p>

    <p><strong>Delivery address:</strong><br>
      ${escapeHtml(order.delivery_address)}
    </p>

    <p>Thank you for shopping with BookMarks!</p>
  `);

  return transporter.sendMail({
    from: {
      name: process.env.MAIL_FROM_NAME || "BookMarks",
      address: process.env.GMAIL_USER,
    },
    to: order.email,
    subject: `BookMarks - Order #${order.order_id} Received`,
    html,
  });
}

const statusMessages = {
  confirmed: "Your order has been confirmed.",
  dispatched: "Your order is on its way!",
  delivered: "Your order has been delivered.",
  cancelled: "Your order has been cancelled.",
};

export async function sendOrderStatusEmail(order) {
  const status = String(order.status || "").toLowerCase();

  const message = statusMessages[status];

  if (!message) {
    throw new Error(`Unsupported email status: ${status}`);
  }

  const html = emailLayout(`
    <h2>Order Status Update</h2>

    <p>Hello ${escapeHtml(order.recipient_name)},</p>

    <p>${escapeHtml(message)}</p>

    <div style="background:#f1f5f9;padding:20px;
                border-radius:8px;margin:24px 0;">
      <p><strong>Order:</strong>
        #${escapeHtml(order.order_id)}
      </p>

      <p><strong>New status:</strong>
        ${escapeHtml(status.toUpperCase())}
      </p>

      <p><strong>Order total:</strong>
        ${money(order.total)}
      </p>
    </div>

    <p>Thank you for shopping with BookMarks!</p>
  `);

  return transporter.sendMail({
    from: {
      name: process.env.MAIL_FROM_NAME || "BookMarks",
      address: process.env.GMAIL_USER,
    },
    to: order.email,
    subject: `BookMarks - Order #${order.order_id} ${status}`,
    html,
  });
}

export async function verifyEmailConnection() {
  return transporter.verify();
}

export async function sendPasswordResetEmail({ email, fullName, resetUrl }) {
  const html = emailLayout(`
    <h2>Reset your password</h2>
    <p>Hello ${escapeHtml(fullName)},</p>
    <p>We received a request to reset your BookMarks password.</p>
    <p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#522D60;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Reset password</a></p>
    <p>This link expires in 15 minutes and can be used only once.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `);
  return transporter.sendMail({
    from: { name: process.env.MAIL_FROM_NAME || 'BookMarks', address: process.env.GMAIL_USER },
    to: email, subject: 'BookMarks - Reset your password', html,
  });
}

export async function sendPasswordChangedEmail({ email, fullName }) {
  return transporter.sendMail({
    from: { name: process.env.MAIL_FROM_NAME || 'BookMarks', address: process.env.GMAIL_USER },
    to: email, subject: 'BookMarks - Your password was changed',
    html: emailLayout(`<h2>Password changed</h2><p>Hello ${escapeHtml(fullName)},</p><p>Your BookMarks password was successfully changed. If this was not you, contact support immediately.</p>`),
  });
}
