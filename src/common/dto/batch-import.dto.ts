import { createResponseSchema } from '@/types/global';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BatchImportFailedItemSchema = z.object({
  index: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
});

export const BatchImportResultSchema = z.object({
  success: z.number(),
  failed: z.number(),
  failedItems: z.array(BatchImportFailedItemSchema),
});

export type BatchImportResult = z.infer<typeof BatchImportResultSchema>;

export class BatchImportResultDto extends createZodDto(
  createResponseSchema(BatchImportResultSchema),
) {}
