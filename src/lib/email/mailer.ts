import nodemailer from "nodemailer";

interface SendResetEmailParams {
  to: string;
  resetUrl: string;
  fullName: string;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  fullName,
}: SendResetEmailParams): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "Học Từ Vựng <noreply@ielts-flashcard.vn>";

  // If SMTP is not configured, log to console for local development
  if (!host || !user || !pass) {
    console.log("\n=======================================================");
    console.log("📧 [LOCAL DEV EMAIL SIMULATION] ĐẶT LẠI MẬT KHẨU");
    console.log(`Gửi đến: ${fullName} <${to}>`);
    console.log(`Đường dẫn đặt lại mật khẩu:`);
    console.log(`👉 ${resetUrl}`);
    console.log("Liên kết có hiệu lực trong vòng 60 phút.");
    console.log("=======================================================\n");
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject: "Yêu cầu đặt lại mật khẩu - IELTS Flashcard",
      html: `
        <div style="font-family: serif, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #faf7f2; border: 1px solid #e0d8cc; color: #231f20;">
          <h2 style="color: #1b2a4a; margin-top: 0;">IELTS Flashcard</h2>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email <strong>${to}</strong>.</p>
          <p>Vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu mới (liên kết có hiệu lực trong vòng 60 phút):</p>
          <p style="margin: 28px 0; text-align: center;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #1b2a4a; color: #faf7f2; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Đặt lại mật khẩu
            </a>
          </p>
          <p style="font-size: 13px; color: #666;">Nếu bạn không gửi yêu cầu này, xin vui lòng bỏ qua email này. Mật khẩu của bạn vẫn được giữ an toàn.</p>
          <hr style="border: none; border-top: 1px solid #e0d8cc; margin: 24px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">Hệ thống học từ vựng IELTS Flashcard - Thiết kế tinh gọn & chuẩn mực</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Lỗi khi gửi email SMTP:", error);
    return false;
  }
}

