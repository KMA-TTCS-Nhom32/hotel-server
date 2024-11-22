import { LoginOTPTemplate } from "../interfaces";

export const otpLoginTemplateValues: {
  en: LoginOTPTemplate;
  vi: LoginOTPTemplate;
} = {
  en: {
    title: 'Verify your registration',
    contentTitle: 'Verification code',
    description: 'Please use the verification code below to complete your registration:',
    code: '', // This will be filled dynamically
    note: "If you didn't request this, you can ignore this email.",
  },
  vi: {
    title: 'Xác thực đăng ký',
    contentTitle: 'Mã xác thực',
    description: 'Vui lòng sử dụng mã xác thực bên dưới để hoàn tất phiên đăng ký:',
    code: '', // This will be filled dynamically
    note: 'Nếu quý khách không yêu cầu mã này, hãy bỏ qua email này.',
  },
};
