import nodemailer from "nodemailer";

export const sendLoginEmail = async (email: string, name: string) => {
  try {

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Login Notification",
      html: `
        <h2>Hello ${name}</h2>
        <p>Your account has just been logged in.</p>
        <p>If this wasn't you, please change your password immediately.</p>
      `,
    });

    console.log("Login notification sent");
  } catch (error) {
    console.log("Email error:", error);
  }
};