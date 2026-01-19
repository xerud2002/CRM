import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ThunderbirdImportService,
  ThunderbirdAccount,
  ImportResult,
} from './thunderbird-import.service';

@Controller('mail/import/thunderbird')
@UseGuards(JwtAuthGuard)
export class ThunderbirdImportController {
  constructor(private readonly importService: ThunderbirdImportService) {}

  /**
   * List available Thunderbird profiles
   */
  @Get('profiles')
  listProfiles(): { name: string; path: string }[] {
    return this.importService.listProfiles();
  }

  /**
   * Preview what will be imported from Thunderbird
   */
  @Get('preview')
  async preview(@Query('profilePath') profilePath?: string): Promise<{
    profilePath: string;
    accounts: ThunderbirdAccount[];
    mboxFiles: { account: string; folder: string; path: string; size: number }[];
  }> {
    return this.importService.getImportPreview(profilePath);
  }

  /**
   * Import accounts from Thunderbird
   */
  @Post('accounts')
  async importAccounts(
    @Body() body?: { profilePath?: string },
  ): Promise<{ imported: number; skipped: number; accounts: unknown[] }> {
    return this.importService.importAccounts(body?.profilePath);
  }

  /**
   * Import emails from Thunderbird MBOX files
   */
  @Post('emails')
  async importEmails(
    @Body()
    body?: {
      profilePath?: string;
      folders?: string[];
      limit?: number;
    },
  ): Promise<ImportResult> {
    return this.importService.importEmails(body?.profilePath, {
      folders: body?.folders,
      limit: body?.limit,
    });
  }
}
