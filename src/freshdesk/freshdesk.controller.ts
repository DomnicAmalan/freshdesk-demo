import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  Get,
  Patch,
} from '@nestjs/common';
import { FreshdeskService } from './freshdesk.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

@Controller('freshdesk')
export class FreshdeskController {
  constructor(
    private readonly freshdeskService: FreshdeskService,
  ) {}

  @Post('config')
  async createConfig(@Body() createConfigDto: CreateConfigDto) {
    return this.freshdeskService.createConfig(createConfigDto);
  }

  @Get('config/:companyName')
  async getConfig(@Param('companyName') companyName: string) {
    return this.freshdeskService.getConfig(companyName);
  }

  @Get('configs')
  async getAllConfigs() {
    return this.freshdeskService.getAllConfigs();
  }

  @Patch('config/:companyId')
  async updateConfig(
    @Param('companyId') companyId: string,
    @Body() updateConfigDto: UpdateConfigDto,
  ) {
    return this.freshdeskService.updateConfig(companyId, updateConfigDto);
  }

  @Delete('company/:companyId')
  async removeCompany(@Param('companyId') companyId: string) {
    await this.freshdeskService.removeCompanyById(companyId);
    return { message: `Company with ID ${companyId} removed successfully` };
  }
}
