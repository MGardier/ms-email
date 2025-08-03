import { Test } from '@nestjs/testing';
import * as fs from 'fs/promises';
import { TemplateService } from './template.service';
import { join } from 'path';
import { RpcException } from '@nestjs/microservices';
import { EnumErrorCode } from '../enums/error-codes.enum';

// Mock fs to control his behavior in test
jest.mock('fs/promises', () => ({
  access: jest.fn(),
}));

/************************* HELPER ******************************************* */

/**
 * Helper to create error with specific code
 * Simulates real Node.js errors with ‘code’ property
 * @param code - System error code (ENOENT, EACCES, etc.)
 * @param message - Readable error message
 * @returns Error object with typed code property
 */
const createErrorMock = (code: string, message: string): Error => {
  const error = new Error(message);
  (error as any).code = code;
  return error;
};

/**
 * Helper to build the expected path in test mode
 * Simulates __getPath() service logic in test environment
 * @param templatePath - Relative template path
 * @returns Full path simulated for tests
 */
const joinMockPath = (templatePath): string =>
  join(process.cwd(), 'src/templates/pages/', templatePath);

/************************* TEST ******************************************* */
describe('TemplateService', () => {
  let templateService: TemplateService;
  //Cast fs to jest mock to get acces to jest method
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(async () => {
    //Specify NODE_ENV to anticipate behavior of __getPath();
    process.env.NODE_ENV = 'test';

    //Create testing module for templateService
    const moduleRef = await Test.createTestingModule({
      providers: [TemplateService],
    }).compile();
    templateService = moduleRef.get(TemplateService);

    //Clean previous mock
    jest.clearAllMocks();
  });

  describe('getPathIfExist() -  Testing file verification behavior  ', () => {
    //Fake data
    const templatePath = `auth/account-confirmation.hbs`;
    const expectedPath = joinMockPath(templatePath);

    it('should return complete path when template file exist and is accessible ', async () => {
      // mock successfull behavior
      mockFs.access.mockResolvedValueOnce(undefined);

      // Execute method under test
      const result = await templateService.getPathIfExist(templatePath);

      // Assert to have expected Path in result , fs.access have been call one time with good path
      expect(result).toBe(expectedPath);
      expect(mockFs.access).toHaveBeenCalledWith(expectedPath);
      expect(mockFs.access).toHaveBeenCalledTimes(1);
    });

    //Test all fs.access error cases
    it.each([
      ['ENOENT', 'File not found', EnumErrorCode.TEMPLATE_NOT_FOUND],
      ['EACCES', 'Permission denied', EnumErrorCode.TEMPLATE_CANNOT_ACCESS],
      ['EIO', 'I/O error', EnumErrorCode.TEMPLATE_UNKNOWN_ERROR],
    ])(
      'should throw RpcException with specific errorCode when fs.access throw an error',
      async (errorCode, message, expectedCode) => {
        // mock failure behavior
        mockFs.access.mockRejectedValue(createErrorMock(errorCode, message));

        //Action & Assert
        try {
          await templateService.getPathIfExist(templatePath);
          //forces test failure if no error is throw
          fail('Should have thrown RpcException');
        } catch (error) {
          //check type of error & check detail of error object
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toEqual({
            code: expectedCode,
            context: {
              operation: 'getPathIfExist',
              path: expectedPath,
              templatePath,
            },
          });
        }
      },
    );
  });
});
