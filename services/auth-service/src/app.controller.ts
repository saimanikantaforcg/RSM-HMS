import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: any) {
    return this.appService.login(loginDto?.email, loginDto?.password);
  }

  @Post('register')
  register(@Body() registerDto: any) {
    return this.appService.register(registerDto);
  }
}
