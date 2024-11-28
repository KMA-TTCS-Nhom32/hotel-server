import { OTPTemplate } from '../interfaces';

export const otpLoginTemplateValues: {
  en: OTPTemplate;
  vi: OTPTemplate;
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

export const otpForgotPasswordTemplateValues: {
  en: OTPTemplate;
  vi: OTPTemplate;
} = {
  en: {
    title: 'Reset Your Password',
    contentTitle: 'Password Reset Code',
    description: 'You have requested to reset your password. Please use this verification code:',
    code: '', // Will be filled dynamically
    note: "If you didn't request a password reset, please ignore this email.",
  },
  vi: {
    title: 'Đặt Lại Mật Khẩu',
    contentTitle: 'Mã Đặt Lại Mật Khẩu',
    description: 'Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã xác thực này:',
    code: '', // Will be filled dynamically
    note: 'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.',
  },
};
