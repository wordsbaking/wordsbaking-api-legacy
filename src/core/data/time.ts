export interface TimeMachineOptions {
  now: TimeNumber;
  clientTime: TimeNumber;
  clientSyncAt: TimeNumber;
}

export class TimeMachine {
  readonly now: TimeNumber;

  private clientSyncAt: TimeNumber;
  private diff: number;

  constructor({now, clientTime, clientSyncAt}: TimeMachineOptions) {
    this.now = now;
    this.clientSyncAt = clientSyncAt;
    this.diff = now - clientTime;
  }

  /**
   * correct last update time
   */
  calibrate(time: TimeNumber): TimeNumber {
    (time as number) += this.diff;

    return Math.max(
      Math.min(time, this.now - 1),
      this.clientSyncAt + 1,
    ) as TimeNumber;
  }
}
