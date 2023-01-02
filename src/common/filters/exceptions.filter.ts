import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  LoggerService,
  Inject,
} from '@nestjs/common';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(Logger) private readonly loggerService: LoggerService) {}
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();
    this.loggerService.verbose(`REQUEST: ${req.method} ${res.url}`);
    const reqTime = Date.now();
    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status === 500) Logger.error(exception);
    this.loggerService.verbose(
      `RESPONSE: ${status} ${req.url} time-taken: ${Date.now() - reqTime} ms`,
    );
    this.loggerService.error(exception.stack);
    res.status(status).json({
      statusCode: status,
      error: isHttp ? exception.message : 'Internal Server Error',
    });
  }
}
