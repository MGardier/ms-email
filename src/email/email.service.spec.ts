import { MailerService } from '@nestjs-modules/mailer';
import { EmailRepository } from './email.repository';
import { TemplateService } from 'src/template/template.service';
import { Test } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  const mockMailerService = {
    sendMail: jest.fn(),
  };
  const expectedEmailObject = {
    id: 1,
    gatewayEmailId: 1,
  };

  const mockEmailRepository = {
    create: jest.fn(),
    update: jest.fn(() => expectedEmailObject),
    delete: jest.fn(),
  };

  const getPathIfExistMock = jest.fn((templatePath: string) => {
    return `base/${templatePath}`;
  });

  const mockTemplateService = {
    getPathIfExist: getPathIfExistMock,
  };

  let emailService: EmailService;

  beforeEach(async () => {
    //Create testing module for emailService and mock dependencies
    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: MailerService, useValue: mockMailerService },
        { provide: EmailRepository, useValue: mockEmailRepository },
        { provide: TemplateService, useValue: mockTemplateService },
      ],
    }).compile();

    emailService = moduleRef.get(EmailService);

    //Clean previous mock
    jest.clearAllMocks();
  });

  describe('SendMail - Testing method behavior', () => {
    const fakePayload = {
      receivers: ['receivers@mail.com'],
      sender: 'sender@mail.com',
      subject: 'Testing sending email',
      cc: ['cc@mail.com'],
      bcc: ['bcc@mail.com'],
      gatewayEmailId: 1,
      templatePath: 'auth/forgot-password.hbs',
      templateVariables: {
        userName: 'username',
        resetPasswordLink: ' reset password link',
      },
    };

    it('should return email object when email is sending', async () => {
      const result = await emailService.sendMail(fakePayload);
      expect(result).toBe(expectedEmailObject);
      expect(TemplateService.getPathIfExist).toHaveBeenCalledWith(expectedPath);
      expect(mockFs.access).toHaveBeenCalledTimes(1);

      expect(mockFs.access).toHaveBeenCalledWith(expectedPath);
      expect(mockFs.access).toHaveBeenCalledTimes(1);

      expect(mockFs.access).toHaveBeenCalledWith(expectedPath);
      expect(mockFs.access).toHaveBeenCalledTimes(1);
    });
    //Tester qu'il appelle bien les bonne fonctions
    //Tester valeur de retour
  });

  describe('delete', () => {});

  describe('_send', () => {});

  describe('_formatMailData', () => {});
});
