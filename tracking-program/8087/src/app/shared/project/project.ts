export class Project {
  public id: number;
  public name: String;
  public client: any;
  public timeZoneId: string;
  public savings;
  public documentShareToken:string;
  public electricBillAnalysis;
  public reportFields;
  public equipmentInfo;
  public timezoneAbbreviation;
  public currencyCode;
  public currencyExchangeRate;
  public carbonCreditRate;
  public update;
  public hasRunTest: boolean;
  public gwControl: boolean;
  public meters: any;
  public selectedTest: number;
  public totalKwh: number;
  public projectTotalKwh: number;
  public logoImgSrc: String;
  public ILRatio: number;
  public initialPf: number;
  public slackChannel: number | null;
  public activeEmvAnalysisId: number | null;
}
