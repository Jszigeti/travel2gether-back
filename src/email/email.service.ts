import { Injectable } from '@nestjs/common';
import * as brevo from '@getbrevo/brevo';

@Injectable()
export class EmailService {
  async sendMail(
    email: string,
    token: string,
    userId: number,
    userVerification: boolean = true,
  ): Promise<void> {
    const url = `${process.env.FRONT_URL}/${userVerification ? 'user-verification' : 'reset-password'}/${userId}/${token}`;
    let apiInstance: any = new brevo.TransactionalEmailsApi();

    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    let sendSmtpEmail = new brevo.SendSmtpEmail();

    (sendSmtpEmail.templateId = userVerification ? 1 : 2),
      (sendSmtpEmail.sender = {
        name: 'Travel2Gether',
        email: 'app.travel2gether@gmail.com',
      });
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.params = {
      url,
    };

    apiInstance.sendTransacEmail(sendSmtpEmail).then(
      function () {
        console.log('API called successfully.');
      },
      function (error: unknown) {
        console.error(error);
      },
    );
  }
}
