import { Module, Global } from '@nestjs/common';
import { SessionsGateway } from './sessions.gateway';

@Global()
@Module({
  providers: [SessionsGateway],
  exports: [SessionsGateway],
})
export class SessionsModule {}
