import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAccount, Email, EmailDirection, Lead } from '../entities';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';

export interface ThunderbirdAccount {
  id: string;
  name: string;
  email: string;
  incomingServer: {
    type: string;
    hostname: string;
    port: number;
    username: string;
  };
  smtpServer?: {
    hostname: string;
    port: number;
    username: string;
  };
}

export interface ImportResult {
  accounts: number;
  emails: number;
  errors: string[];
}

@Injectable()
export class ThunderbirdImportService {
  private readonly logger = new Logger(ThunderbirdImportService.name);

  constructor(
    @InjectRepository(EmailAccount)
    private readonly accountRepository: Repository<EmailAccount>,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
  ) {}

  /**
   * Get default Thunderbird profile path
   */
  getThunderbirdProfilePath(): string | null {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const thunderbirdPath = path.join(appData, 'Thunderbird', 'Profiles');

    if (!fs.existsSync(thunderbirdPath)) {
      return null;
    }

    // Find default profile (usually ends with .default or .default-release)
    const profiles = fs.readdirSync(thunderbirdPath);
    const defaultProfile = profiles.find(
      (p) => p.includes('.default') || p.includes('.default-release'),
    );

    if (defaultProfile) {
      return path.join(thunderbirdPath, defaultProfile);
    }

    // Return first profile if no default found
    return profiles.length > 0 ? path.join(thunderbirdPath, profiles[0]) : null;
  }

  /**
   * List available Thunderbird profiles
   */
  listProfiles(): { name: string; path: string }[] {
    const appData =
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const thunderbirdPath = path.join(appData, 'Thunderbird', 'Profiles');

    if (!fs.existsSync(thunderbirdPath)) {
      return [];
    }

    const profiles = fs.readdirSync(thunderbirdPath);
    return profiles.map((p) => ({
      name: p,
      path: path.join(thunderbirdPath, p),
    }));
  }

  /**
   * Parse Thunderbird prefs.js to extract account configurations
   */
  parseAccountsFromPrefs(profilePath: string): ThunderbirdAccount[] {
    const prefsPath = path.join(profilePath, 'prefs.js');

    if (!fs.existsSync(prefsPath)) {
      throw new Error('prefs.js not found in profile');
    }

    const prefsContent = fs.readFileSync(prefsPath, 'utf-8');
    const accounts: Map<string, Partial<ThunderbirdAccount>> = new Map();

    // Parse user preferences
    const prefRegex = /user_pref\("([^"]+)",\s*"?([^")\n]+)"?\);/g;
    let match;

    while ((match = prefRegex.exec(prefsContent)) !== null) {
      const [, key, value] = match;

      // Extract account identities
      if (key.startsWith('mail.identity.')) {
        const parts = key.split('.');
        const identityId = parts[2];
        const prop = parts[3];

        if (!accounts.has(identityId)) {
          accounts.set(identityId, { id: identityId });
        }

        const account = accounts.get(identityId)!;
        if (prop === 'useremail') {
          account.email = value;
        } else if (prop === 'fullName') {
          account.name = value;
        }
      }

      // Extract server configurations
      if (key.startsWith('mail.server.')) {
        const parts = key.split('.');
        const serverId = parts[2];
        const prop = parts[3];

        // Find associated account
        for (const [_id, acc] of accounts.entries()) {
          if (!acc.incomingServer) {
            acc.incomingServer = {
              type: 'imap',
              hostname: '',
              port: 993,
              username: '',
            };
          }

          if (key.includes(serverId)) {
            if (prop === 'hostname') {
              acc.incomingServer.hostname = value;
            } else if (prop === 'port') {
              acc.incomingServer.port = parseInt(value) || 993;
            } else if (prop === 'userName') {
              acc.incomingServer.username = value;
            } else if (prop === 'type') {
              acc.incomingServer.type = value;
            }
          }
        }
      }

      // Extract SMTP configurations
      if (key.startsWith('mail.smtpserver.')) {
        const parts = key.split('.');
        const _smtpId = parts[2];
        const prop = parts[3];

        for (const [_id, acc] of accounts.entries()) {
          if (!acc.smtpServer) {
            acc.smtpServer = { hostname: '', port: 587, username: '' };
          }

          if (prop === 'hostname') {
            acc.smtpServer.hostname = value;
          } else if (prop === 'port') {
            acc.smtpServer.port = parseInt(value) || 587;
          } else if (prop === 'username') {
            acc.smtpServer.username = value;
          }
        }
      }
    }

    return Array.from(accounts.values()).filter(
      (acc) => acc.email && acc.incomingServer?.hostname,
    ) as ThunderbirdAccount[];
  }

  /**
   * Find MBOX files in Thunderbird profile
   */
  async findMboxFiles(
    profilePath: string,
  ): Promise<{ account: string; folder: string; path: string }[]> {
    const mboxFiles: { account: string; folder: string; path: string }[] = [];
    const imapMailPath = path.join(profilePath, 'ImapMail');
    const localFoldersPath = path.join(profilePath, 'Mail', 'Local Folders');

    // Check ImapMail folder
    if (fs.existsSync(imapMailPath)) {
      const servers = fs.readdirSync(imapMailPath);
      for (const server of servers) {
        const serverPath = path.join(imapMailPath, server);
        if (fs.statSync(serverPath).isDirectory()) {
          await this.scanFolderForMbox(serverPath, server, mboxFiles);
        }
      }
    }

    // Check Local Folders
    if (fs.existsSync(localFoldersPath)) {
      await this.scanFolderForMbox(
        localFoldersPath,
        'Local Folders',
        mboxFiles,
      );
    }

    return mboxFiles;
  }

  private async scanFolderForMbox(
    folderPath: string,
    accountName: string,
    results: { account: string; folder: string; path: string }[],
  ) {
    const items = fs.readdirSync(folderPath);

    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && item.endsWith('.sbd')) {
        // Subfolder container
        await this.scanFolderForMbox(itemPath, accountName, results);
      } else if (stat.isFile() && !item.endsWith('.msf')) {
        // MBOX file (no extension, not .msf index)
        results.push({
          account: accountName,
          folder: item,
          path: itemPath,
        });
      }
    }
  }

  /**
   * Parse MBOX file and extract emails
   */
  async parseMboxFile(mboxPath: string, limit = 100): Promise<ParsedMail[]> {
    const emails: ParsedMail[] = [];
    const content = fs.readFileSync(mboxPath, 'utf-8');

    // MBOX format: messages separated by "From " at start of line
    const messageRegex = /^From .+?\r?\n/gm;
    const parts = content.split(messageRegex).filter((p) => p.trim());

    for (let i = 0; i < Math.min(parts.length, limit); i++) {
      try {
        const parsed = await simpleParser(parts[i]);
        emails.push(parsed);
      } catch (error) {
        this.logger.warn(`Failed to parse email ${i}: ${error}`);
      }
    }

    return emails;
  }

  /**
   * Import accounts from Thunderbird profile
   */
  async importAccounts(
    profilePath?: string,
  ): Promise<{ imported: number; skipped: number; accounts: unknown[] }> {
    const profile = profilePath || this.getThunderbirdProfilePath();

    if (!profile) {
      throw new Error('No Thunderbird profile found');
    }

    const tbAccounts = this.parseAccountsFromPrefs(profile);
    let imported = 0;
    let skipped = 0;
    const results: unknown[] = [];

    for (const tbAcc of tbAccounts) {
      const existing = await this.accountRepository.findOne({
        where: { email: tbAcc.email },
      });

      if (existing) {
        skipped++;
        results.push({
          email: tbAcc.email,
          status: 'skipped',
          reason: 'Already exists',
        });
        continue;
      }

      const account = this.accountRepository.create({
        email: tbAcc.email,
        displayName: tbAcc.name || tbAcc.email.split('@')[0],
        imapHost: tbAcc.incomingServer.hostname,
        imapPort: tbAcc.incomingServer.port,
        smtpHost:
          tbAcc.smtpServer?.hostname ||
          tbAcc.incomingServer.hostname.replace('imap', 'smtp'),
        smtpPort: tbAcc.smtpServer?.port || 587,
        username: tbAcc.incomingServer.username || tbAcc.email,
        passwordEncrypted: 'NEEDS_PASSWORD', // User needs to set password
        isActive: true,
      });

      await this.accountRepository.save(account);
      imported++;
      results.push({ email: tbAcc.email, status: 'imported', id: account.id });
    }

    return { imported, skipped, accounts: results };
  }

  /**
   * Import emails from Thunderbird MBOX files
   */
  async importEmails(
    profilePath?: string,
    options?: {
      folders?: string[];
      limit?: number;
      accountEmail?: string;
    },
  ): Promise<ImportResult> {
    const profile = profilePath || this.getThunderbirdProfilePath();

    if (!profile) {
      throw new Error('No Thunderbird profile found');
    }

    const mboxFiles = await this.findMboxFiles(profile);
    const result: ImportResult = { accounts: 0, emails: 0, errors: [] };

    // Filter to specific folders if requested
    let filesToProcess = mboxFiles;
    if (options?.folders?.length) {
      filesToProcess = mboxFiles.filter((m) =>
        options.folders!.some((f) =>
          m.folder.toLowerCase().includes(f.toLowerCase()),
        ),
      );
    }

    // Helper to extract email address from parsed mail
    const getEmailAddress = (
      addressField: AddressObject | AddressObject[] | undefined,
    ): string => {
      if (!addressField) return '';
      if (Array.isArray(addressField)) {
        return addressField[0]?.value?.[0]?.address || '';
      }
      return addressField.value?.[0]?.address || '';
    };

    for (const mbox of filesToProcess) {
      this.logger.log(`Processing: ${mbox.account}/${mbox.folder}`);

      try {
        const emails = await this.parseMboxFile(
          mbox.path,
          options?.limit || 100,
        );

        for (const parsed of emails) {
          try {
            // Check if email already exists by messageId
            if (parsed.messageId) {
              const existing = await this.emailRepository.findOne({
                where: { messageId: parsed.messageId },
              });
              if (existing) continue;
            }

            // Determine direction
            const fromAddress = getEmailAddress(parsed.from);
            const toAddress = getEmailAddress(parsed.to);

            // Try to link to a lead
            const lead = await this.leadRepository.findOne({
              where: [{ email: fromAddress }, { email: toAddress }],
            });

            const email = this.emailRepository.create({
              direction: mbox.folder.toLowerCase().includes('sent')
                ? EmailDirection.OUTBOUND
                : EmailDirection.INBOUND,
              subject: parsed.subject || '(No Subject)',
              body: parsed.html || parsed.textAsHtml || parsed.text || '',
              fromAddress,
              toAddress,
              messageId: parsed.messageId || undefined,
              sentAt: parsed.date || new Date(),
              lead: lead || undefined,
            });

            await this.emailRepository.save(email);
            result.emails++;
          } catch (emailError) {
            result.errors.push(`Email parse error: ${emailError}`);
          }
        }

        result.accounts++;
      } catch (error) {
        result.errors.push(`MBOX error (${mbox.folder}): ${error}`);
      }
    }

    return result;
  }

  /**
   * Get import preview without actually importing
   */
  async getImportPreview(profilePath?: string): Promise<{
    profilePath: string;
    accounts: ThunderbirdAccount[];
    mboxFiles: {
      account: string;
      folder: string;
      path: string;
      size: number;
    }[];
  }> {
    const profile = profilePath || this.getThunderbirdProfilePath();

    if (!profile) {
      throw new Error('No Thunderbird profile found');
    }

    const accounts = this.parseAccountsFromPrefs(profile);
    const mboxFiles = await this.findMboxFiles(profile);

    return {
      profilePath: profile,
      accounts,
      mboxFiles: mboxFiles.map((m) => ({
        ...m,
        size: fs.statSync(m.path).size,
      })),
    };
  }
}
