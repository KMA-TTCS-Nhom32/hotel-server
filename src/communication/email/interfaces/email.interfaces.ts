export interface EmailTemplate {
  title: string;
  subtitle: string;
  message: string;
  buttonText?: string;
}

export interface EmailAttachment {
  filename: string;
  path: string;
  cid: string;
}

export interface EmailOptions {
  from: {
    name: string;
    address: string;
  };
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface OTPTemplate {
  title: string;
  contentTitle: string;
  description: string;
  code: string;
  note: string;
}