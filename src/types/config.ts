import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class Config {
  @IsOptional()
  @IsString()
  output!: string;
  @IsOptional()
  @IsString({ each: true })
  subreddits?: string[];
  @IsOptional()
  @IsString({ each: true })
  categories?: Record<string, string[]>;
  @IsOptional()
  @IsString()
  category?: string;
  @IsOptional()
  @IsNumber()
  minLength!: number;
  @IsOptional()
  @IsNumber()
  maxLength!: number;
  @IsOptional()
  @IsNumber()
  targetVideoLength!: number;
  @IsOptional()
  @IsBoolean()
  hideUsed!: boolean;
  @IsOptional()
  @IsBoolean()
  includeHidden!: boolean;
  @IsOptional()
  @IsString()
  tempDir!: string;
  @IsOptional()
  @IsString()
  redditClientId!: string;
  @IsOptional()
  @IsString()
  redditClientSecret!: string;
  @IsOptional()
  @IsString()
  redditUsername!: string;
  @IsOptional()
  @IsString()
  redditPassword!: string;
}
export type Options = Omit<Config, "categories"> & { input?: string };
