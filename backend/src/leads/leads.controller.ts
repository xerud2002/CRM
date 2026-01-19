import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadFilterDto } from './dto/lead-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Get()
    findAll(@Query() filter: LeadFilterDto) {
        return this.leadsService.findAll(filter);
    }

    @Get('inbox')
    getInbox() {
        return this.leadsService.findInbox();
    }

    @Get('inbox/count')
    getInboxCount() {
        return this.leadsService.getInboxCount();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.leadsService.findOne(id);
    }

    @Post()
    create(@Body() createLeadDto: CreateLeadDto, @Request() req: any) {
        return this.leadsService.create(createLeadDto, req.user?.id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateLeadDto: UpdateLeadDto,
        @Request() req: any,
    ) {
        return this.leadsService.update(id, updateLeadDto, req.user?.id);
    }

    @Post(':id/accept')
    accept(@Param('id') id: string, @Request() req: any) {
        return this.leadsService.accept(id, req.user?.id);
    }

    @Post(':id/reject')
    reject(@Param('id') id: string, @Request() req: any) {
        return this.leadsService.reject(id, req.user?.id);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.leadsService.delete(id);
    }
}
