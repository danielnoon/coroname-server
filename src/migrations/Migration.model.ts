export class Migration {
  constructor(
    public version: number,
    public applyUpdate: () => Promise<void>
  ) {}
}
