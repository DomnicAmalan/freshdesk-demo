export class CreateConfigDto {
  apiKey: string;
  freshdeskUrl: string;
  ticketCreateInterval: number;
  ticketReplyInterval: number;
  ticketsPerDay: number;
}
