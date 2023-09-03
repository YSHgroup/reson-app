// const nodemailer = require("nodemailer");
import nodemailer from "nodemailer";
export default async function sendEmail (email: any, subject: any, text: any) {
  try {
    const transporter = nodemailer.createTransport({
      // host: process.env.HOST,
      service: "hotmail",
      // port: 587,
      // secure: true,
      auth: {
        user: "resonapp@outlook.com",
        pass: "reson.app",
      },
    });

    await transporter.sendMail({
      from: "resonapp@outlook.com",
      to: email,
      subject: subject,
      text: text,
    });
    console.log("email sent sucessfully");
  } catch (error) {
    console.log("email not sent");
    console.log(error);
  }
};