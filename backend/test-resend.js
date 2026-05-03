import { Resend } from 'resend';
const resend = new Resend('re_eFNBGfUw_PQkGHhVJKJ5sTkeHi7AknWNJ');
resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'soumyadipta.das.iotcs26@heritageit.edu.in',
  subject: 'Test',
  html: '<p>Test</p>'
}).then(console.log).catch(console.error);
