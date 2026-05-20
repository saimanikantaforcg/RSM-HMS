import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('login', () => {
    it('should return an accessToken for valid credentials', () => {
      const result = appController.login({ email: 'admin@hms.internal', password: 'password' });
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedException for invalid credentials', () => {
      expect(() => appController.login({ email: 'bad@user.com', password: 'wrong' }))
        .toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should return a user object with an id and tenantId', () => {
      const result = appController.register({ email: 'new@user.com', role: 'nurse' });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('tenantId');
    });
  });
});
