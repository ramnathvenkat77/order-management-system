import {
  IsEnum,
} from 'class-validator';

export enum SimulatedPaymentOutcome {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class SimulatePaymentDto {
  @IsEnum(
    SimulatedPaymentOutcome
  )
  outcome!: SimulatedPaymentOutcome;
}